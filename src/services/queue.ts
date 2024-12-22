import Bull from 'bull';
import { DeploymentJob, DropletConfig, ElizaDeployConfig } from '../types';
import { DigitalOceanService } from './digitalOcean';
import { CoolifyService } from './coolify';
import { DeploymentService } from './deployment';

export class QueueService {
  private deploymentQueue: Bull.Queue<DeploymentJob>;
  private doService: DigitalOceanService;
  private coolifyService: CoolifyService;
  private deploymentService: DeploymentService;

  constructor() {
    this.deploymentQueue = new Bull('deployment-queue', {
      redis: process.env.REDIS_URL || 'redis://localhost:6379'
    });
    this.doService = new DigitalOceanService();
    this.coolifyService = new CoolifyService();
    this.deploymentService = new DeploymentService();

    this.setupQueueProcessor();
  }

  private async cleanup(job: Bull.Job<DeploymentJob>) {
    try {
      // Cleanup DigitalOcean droplet if it was created
      if (job.data.dropletId) {
        await this.doService.deleteDroplet(job.data.dropletId);
      }

      // Cleanup Coolify server if it was connected
      if (job.data.serverId) {
        await this.coolifyService.removeServer(job.data.serverId);
      }

      // Update deployment record
      await this.deploymentService.updateDeployment(job.data.id, {
        status: 'failed',
        error: 'Cleaned up due to failure'
      });

      console.log(`Cleaned up resources for failed job ${job.id}`);
    } catch (error) {
      console.error(`Error during cleanup for job ${job.id}:`, error);
    }
  }

  private setupQueueProcessor() {
    this.deploymentQueue.process(async (job) => {
      try {
        // Update job status to processing
        const updatedJob : DeploymentJob = {
          ...job.data,
          status: 'processing' as const
        };
        await job.update(updatedJob);
        await this.deploymentService.updateDeployment(job.data.id, updatedJob);

        // Check if we can create a new droplet
        const canCreate = await this.deploymentService.canCreateNewDroplet();
        if (!canCreate) {
          throw new Error('Maximum number of droplets reached');
        }

        // 1. Create DigitalOcean droplet
        const droplet = await this.doService.createDroplet({
          name: `eliza-${job.id}`,
          ...job.data.dropletConfig
        });

        // Store droplet ID
        const jobWithDroplet = {
          ...updatedJob,
          dropletId: droplet.id,
          //dropletIp: droplet.networks.v4[0].ip_address
        };
        await job.update(jobWithDroplet);
        await this.deploymentService.updateDeployment(job.data.id, jobWithDroplet);

        // 2. Wait for droplet to be ready and get IP
        let dropletDetails;
        let attempts = 0;
        const maxAttempts = 12; // 1 minute total (5s * 12)

        do {
          await new Promise(resolve => setTimeout(resolve, 5000));
          dropletDetails = await this.doService.getDroplet(droplet.id);
          attempts++;

          // Update status with initialization progress
          const initializingStatus : DeploymentJob = {
            ...jobWithDroplet,
            status: 'processing' as const,
            error: `Initializing droplet (attempt ${attempts}/${maxAttempts})`
          };
          await job.update(initializingStatus);
          await this.deploymentService.updateDeployment(job.data.id, initializingStatus);

          if (attempts >= maxAttempts) {
            throw new Error('Droplet failed to initialize in time');
          }
        } while (!dropletDetails.networks.v4.length);

        const publicIPv4 = dropletDetails.networks.v4.find(network => network.type === "public");
        const dropletIp = publicIPv4.ip_address;

        // Update status to show droplet is ready
        const dropletReadyStatus : DeploymentJob = {
          ...jobWithDroplet,
          status: 'processing' as const,
          error: 'Droplet ready, connecting to Coolify'
        };
        await job.update(dropletReadyStatus);
        await this.deploymentService.updateDeployment(job.data.id, dropletReadyStatus);

        // 3. Connect server to Coolify
        const server = await this.coolifyService.connectServer(dropletIp);

        // Store server ID
        const jobWithServer = {
          ...jobWithDroplet,
          serverId: server.uuid,
          error: 'Server connected, preparing deployment'
        };
        await job.update(jobWithServer);
        await this.deploymentService.updateDeployment(job.data.id, jobWithServer);

        // 4. Deploy Eliza
        const deployingStatus = {
          ...jobWithServer,
          error: 'Deploying Eliza application'
        };
        await job.update(deployingStatus);
        await this.deploymentService.updateDeployment(job.data.id, deployingStatus);

        const deployment = await this.coolifyService.deployEliza({
          serverUuid: server.uuid,
          ...job.data.deployConfig
        });

        // Wait for deployment to be ready
        let deploymentStatus = await this.coolifyService.checkDeploymentStatus(deployment.id);
        attempts = 0;

        while (deploymentStatus.status === 'building' && attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 5000));
          deploymentStatus = await this.coolifyService.checkDeploymentStatus(deployment.id);
          attempts++;

          const buildingStatus = {
            ...jobWithServer,
            error: `Building application (attempt ${attempts}/${maxAttempts})`
          };
          await job.update(buildingStatus);
          await this.deploymentService.updateDeployment(job.data.id, buildingStatus);
        }

        if (deploymentStatus.status !== 'running') {
          throw new Error(`Deployment failed with status: ${deploymentStatus.status}`);
        }

        // Mark as completed in database
        const completedJob : DeploymentJob = {
          ...jobWithServer,
          status: 'completed' as const,
          //error: null
        };
        await job.update(completedJob);
        await this.deploymentService.updateDeployment(job.data.id, completedJob);

        return {
          droplet: dropletDetails,
          server,
          deployment: deploymentStatus
        };
      } catch (error) {
        // If anything fails, cleanup and mark job as failed
        await this.cleanup(job);
        const failedJob: DeploymentJob = {
          ...job.data,
          status: 'failed',
          error: error.message
        };
        await this.deploymentService.updateDeployment(job.data.id, failedJob);
        throw error;
      }
    });

    // Handle failed jobs
    this.deploymentQueue.on('failed', async (job, error) => {
      console.error(`Job ${job.id} failed:`, error);
      await this.deploymentService.updateDeployment(job.data.id, {
        status: 'failed',
        error: error.message
      });
    });
  }

  async addJob(dropletConfig: Partial<DropletConfig>, deployConfig: Partial<ElizaDeployConfig>): Promise<any> {
    // Check if we can create a new droplet before queueing
    const canCreate = await this.deploymentService.canCreateNewDroplet();
    if (!canCreate) {
      throw new Error('Maximum number of droplets reached (limit: 3)');
    }

    const jobData: DeploymentJob = {
      id: `deploy-${Date.now()}`,
      dropletConfig,
      deployConfig,
      status: 'pending' as const,
      createdAt: new Date()
    };

    // Create deployment record in database
    await this.deploymentService.createDeployment(jobData);

    // Add to queue
    const job = await this.deploymentQueue.add(jobData);
    return job.id;
  }

  async getJobStatus(jobId: string): Promise<DeploymentJob | null> {
    return this.deploymentService.getDeployment(jobId);
  }
}