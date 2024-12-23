import { EnvironmentVariable } from "@/types";
import axios from "axios";

export class EnvironmentService {
    private coolifyBaseUrl: string;
    private authToken: string;
  
    constructor(coolifyBaseUrl: string, authToken: string) {
      this.coolifyBaseUrl = coolifyBaseUrl;
      this.authToken = authToken;
    }
  
    // Headers for API requests
    private get headers() {
      return {
        'Authorization': `Bearer ${this.authToken}`,
        'Content-Type': 'application/json'
      };
    }
  
    // Update a single environment variable
    async updateEnvironmentVariable(applicationUuid: string, key: string, value: string): Promise<void> {
      try {
        const url = `${this.coolifyBaseUrl}/applications/${applicationUuid}/environment-variables`;
        await axios.post(url, { key, value }, { headers: this.headers });
        await this.restartApplication(applicationUuid);
      } catch (error) {
        throw this.handleError('Error updating environment variable', error);
      }
    }
  
    // Bulk update environment variables
    async bulkUpdateEnvironmentVariables(applicationUuid: string, variables: EnvironmentVariable[]): Promise<void> {
      try {
        const url = `${this.coolifyBaseUrl}/applications/${applicationUuid}/environment-variables/bulk`;
        await axios.put(url, { environmentVariables: variables }, { headers: this.headers });
      } catch (error) {
        throw this.handleError('Error performing bulk update of environment variables', error);
      }
    }
  
    // Delete an environment variable
    async deleteEnvironmentVariable(applicationUuid: string, key: string): Promise<void> {
      try {
        const url = `${this.coolifyBaseUrl}/applications/${applicationUuid}/environment-variables/${key}`;
        await axios.delete(url, { headers: this.headers });
        await this.restartApplication(applicationUuid)
      } catch (error) {
        throw this.handleError('Error deleting environment variable', error);
      }
    }
  
    // Helper function to handle errors
    private handleError(message: string, error: any): Error {
      console.error(message, error);
      if (axios.isAxiosError(error)) {
        return new Error(`${message}: ${error.response?.data?.message || error.message}`);
      }
      return new Error(message);
    }

    async restartApplication(uuid: string) {
        try {
            const url = `${this.coolifyBaseUrl}/applications/${uuid}/restart`;
            await axios.post(url, { headers: this.headers });
        } catch (error) {
            console.error('Error restarting application:', error);
            throw error;
        }
    }
}