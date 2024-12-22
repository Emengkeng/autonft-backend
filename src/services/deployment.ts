import { droplet } from 'dots-wrapper/dist/modules';
import prisma from '../db';
import { DeploymentJob } from '../types';

export class DeploymentService {
  private static MAX_DROPLETS = 3;

  async countActiveDroplets(): Promise<number> {
    const activeDeployments = await prisma.deployment.count({
      where: {
        status: {
          in: ['pending', 'processing', 'completed']
        },
        dropletId: {
          not: null
        }
      }
    });
    return activeDeployments;
  }

  async canCreateNewDroplet(): Promise<boolean> {
    const activeCount = await this.countActiveDroplets();
    return activeCount < DeploymentService.MAX_DROPLETS;
  }

  async createDeployment(data: Omit<DeploymentJob, 'createdAt'>): Promise<any> {
    return prisma.deployment.create({
      data: {
        id: data.id,
        status: data.status,
        dropletConfig: data.dropletConfig as any,
        deployConfig: data.deployConfig as any,
        dropletId: data.dropletId,
        serverId: data.serverId,
        error: data.error
      }
    });
  }

  async updateDeployment(id: string, data: Partial<DeploymentJob>): Promise<any> {
    return prisma.deployment.update({
      where: { id },
      data: {
        status: data.status,
        dropletId: data.dropletId,
        serverId: data.serverId,
        //dropletIp: data.dropletIp,
        error: data.error
      }
    });
  }

  async getDeployment(id: string): Promise<any> {
    return prisma.deployment.findUnique({
      where: { id }
    });
  }
}