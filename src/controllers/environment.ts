import { EnvironmentService } from '@/services/environment.variables';
import { EnvironmentVariable } from '@/types';
import { Request, Response } from 'express';


interface UpdateEnvRequest extends Request {
    body: {
        uuid: string;
        key: string;
        value: string;
    };
  }
  
  interface BulkUpdateEnvRequest extends Request {
    body: {
        uuid: string;
        variables: EnvironmentVariable[];
    };
  }
  
export class EnvironmentController {
    private envService: EnvironmentService;
  
    constructor(envService: EnvironmentService) {
      this.envService = envService;
    }
  
    // Update single environment variable
    async updateVariable(req: UpdateEnvRequest, res: Response) {
      try {
        const { uuid, key, value } = req.body;
        await this.envService.updateEnvironmentVariable(uuid, key, value);
        res.status(200).json({ message: `Environment variable ${key} updated successfully` });
      } catch (error) {
        res.status(500).json({ error: (error as Error).message });
      }
    };
  
    // Bulk update environment variables
    async bulkUpdate(req: BulkUpdateEnvRequest, res: Response){
      try {
        const { uuid, variables } = req.body;
        await this.envService.bulkUpdateEnvironmentVariables(uuid, variables);
        res.status(200).json({ message: 'Environment variables updated successfully' });
      } catch (error) {
        res.status(500).json({ error: (error as Error).message });
      }
    };
  
    // Delete environment variable
    async deleteVariable(req: Request, res: Response){
      try {
        const uuid = req.params.uuid;
        const key = req.params.key;
        await this.envService.deleteEnvironmentVariable(uuid, key);
        res.status(200).json({ message: `Environment variable ${key} deleted successfully` });
      } catch (error) {
        res.status(500).json({ error: (error as Error).message });
      }
    };
}