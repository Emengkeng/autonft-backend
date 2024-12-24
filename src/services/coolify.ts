import axios from 'axios';
import { ElizaDeployConfig, EnvironmentVariable } from '../types';
import { config } from '../config';
import { EnvironmentService } from './environmentVariables';
import { LoggerService } from './logger';
import { log } from 'console';

export class CoolifyService {
  private client;
  private environmentService: EnvironmentService
  private logger: LoggerService;

  constructor() {
    this.client = axios.create({
      baseURL: config.coolify.apiUrl,
      headers: {
        Authorization: `Bearer ${config.coolify.apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    this.environmentService = new EnvironmentService(
        process.env.COOLIFY_API_URL || 'https://api.coolify.io',
        process.env.COOLIFY_API_KEY || ''
    );

    this.logger = new LoggerService();
  }

  async connectServer(dropletIp: string, jobId: string, dropletId: string) {
    try {

      this.logger.logCoolifyOperation(jobId, "Connecting Droplet server to colify")
      const serverData = {
        name: `eliza-server-${Date.now()}`,
        ip: dropletIp,
        port: 22,
        user: 'root',
        private_key_uuid: process.env.COOLIFY_PRIVATE_KEY_UUID,
        is_build_server: false,
        proxy_type: 'none',
        instant_validate: true
        // Add other required server connection params based on Coolify API
      };

      const response = await this.client.post('/servers', serverData);
      //console.log("Connect server response:", response)
      return response.data;
    } catch (error) {
      this.logger.logCoolifyOperation(jobId, "Failed to connect server to coolify", dropletId, error)
      throw error;
    }
  }

  async deployEliza(deployConfig: Partial<ElizaDeployConfig>) {

    this.logger.logCoolifyOperation(deployConfig.server_uuid, "Deploying Ai agent to coolify")

    const finalConfig = {
      ...config.coolify.defaultConfig,
      ...deployConfig,
      git_repository: 'https://github.com/Emengkeng/autonft.git',
      git_branch: 'main',
      dockerfile: "FROM node:23-alpine\n\nWORKDIR /app\n\nCOPY . .\n\nRUN npm install -g pnpm\nRUN pnpm install\nRUN pnpm build\n\nEXPOSE 3000\n\nCMD [\"pnpm\", \"start\"]",
      health_check_enabled: true,
      health_check_path: "/",
      health_check_port: "3000",
      health_check_interval: 30,
      health_check_timeout: 5,
      health_check_retries: 3,
     // limits_memory: "2G",
     // limits_cpus: "1",
    };

    //console.log("AI agent Data:", finalConfig)

    try {
      const response = await this.client.post('/applications/public', finalConfig);
      const getApplication = await this.getRecentlyCreatedApplication();

      if (getApplication?.uuid) {
        await this.setupDefaultEnvironment(getApplication);
      }

      return getApplication;
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

  async getRecentlyCreatedApplication(){
    try {
      const response = await this.client.get(`/applications`)
      this.logger.logCoolifyOperation(null, "Recently created application", response.data)
     // console.log("Recently created application:", response.data)
      const recentApplicationuuId = response.data.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0].uuid;
      return recentApplicationuuId;
    } catch (error) {
      
    }
  }

  private async setupDefaultEnvironment(uuid: string) {
    const defaultEnvs: EnvironmentVariable[] = [
      { key: 'NODE_ENV', value: 'production' },
      { key: 'PORT', value: '3000' },
      { key: 'CACHE_STORE', value: 'database' },
      {key: "GAIANET_MODEL", value: 'qwen72b'},
      {key: "GAIANET_SERVER_URL", value: "https://qwen72b.gaia.domains/v1"},
      {key: "GAIANET_EMBEDDING_MODEL", value: "nomic-embed"},
      {key: "USE_GAIANET_EMBEDDING", value: "TRUE"},
      {key: "TELEGRAM_ENABLED", value: "false"},
      {key: "DISCORD_ENABLED", value: "false"},
      {key: "TWITTER_ENABLED", value: "false"},
      {key: "FARCASTER_ENABLED", value: "false"},
      {key: "DIRECT_ENABLED", value: "true"},
      // Add any other default environment variables here
    ];

    try {
      await this.environmentService.bulkUpdateEnvironmentVariables(uuid, defaultEnvs);
      await this.environmentService.restartApplication(uuid);
    } catch (error) {
      console.error('Error setting up default environment:', error);
      throw error;
    }
  }

}