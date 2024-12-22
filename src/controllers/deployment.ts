import { Request, Response } from 'express';
import { QueueService } from '../services/queue';
import { DeploymentService } from '../services/deployment';

export class DeploymentController {
  private queueService: QueueService;
  private deploymentService: DeploymentService;

  constructor() {
    this.queueService = new QueueService();
    this.deploymentService = new DeploymentService();
  }

  async deployEliza (req: Request, res: Response) {
    try {
      const jobId = await this.queueService.addJob(
        req.body.dropletConfig,
        req.body.deployConfig
      );

      res.json({
        success: true,
        jobId,
        message: 'Deployment job added to queue'
      });
    } catch (error) {
      if (error.message === 'Maximum number of droplets reached (limit: 3)') {
        return res.status(429).json({
          success: false,
          error: error.message
        });
      }

      console.error('Failed to queue deployment:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to queue deployment'
      });
    }
  };

  async getDeploymentStatus (req: Request, res: Response){
    try {
      const status = await this.queueService.getJobStatus(req.params.jobId);
      
      if (!status) {
        return res.status(404).json({
          success: false,
          error: 'Deployment not found'
        });
      }

      res.json({
        success: true,
        status
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to get deployment status'
      });
    }
  };

  async getActiveDroplets(req: Request, res: Response){
    try {
      const count = await this.deploymentService.countActiveDroplets();
      res.json({
        success: true,
        count,
        remaining: 3 - count
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to get active droplet count'
      });
    }
  };
}