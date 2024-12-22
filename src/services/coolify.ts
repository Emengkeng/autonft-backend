import axios from 'axios';
import { ElizaDeployConfig } from '../types';
import { config } from '../config';

export class CoolifyService {
  private client;

  constructor() {
    this.client = axios.create({
      baseURL: config.coolify.apiUrl,
      headers: {
        Authorization: `Bearer ${config.coolify.apiKey}`,
        'Content-Type': 'application/json'
      }
    });
  }

  async connectServer(dropletIp: string) {
    try {
      const serverData = {
        name: `eliza-server-${Date.now()}`,
        ip: dropletIp,
        port: 22,
        user: 'root',
        private_key_uuid: process.env.COOLIFY_PRIVATE_KEY_UUID,
        proxy_type: 'traefik'
        // Add other required server connection params based on Coolify API
      };

      const { data } = await this.client.post('/servers', serverData);
      return data.server;
    } catch (error) {
      console.error('Error connecting server to Coolify:', error);
      throw error;
    }
  }

  async deployEliza(deployConfig: Partial<ElizaDeployConfig>) {
    const finalConfig = {
      ...config.coolify.defaultConfig,
      ...deployConfig,
      gitRepository: 'https://github.com/Emengkeng/autonft.git'
    };

    try {
      const { data } = await this.client.post('/applications/public', finalConfig);
      return data.application;
    } catch (error) {
      console.error('Error deploying Eliza:', error);
      throw error;
    }
  }

  async removeServer(serverId: string) {
    try {
      await this.client.delete(`/servers/${serverId}`);
    } catch (error) {
      console.error('Error removing server from Coolify:', error);
      throw error;
    }
  }

  async checkDeploymentStatus(deploymentId: string) {
    try {
      const { data } = await this.client.get(`/applications/${deploymentId}/status`);
      return data;
    } catch (error) {
      console.error('Error checking deployment status:', error);
      throw error;
    }
  }
}