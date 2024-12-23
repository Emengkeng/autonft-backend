import axios from 'axios';
import { DropletConfig } from '../types';
import { config } from '../config';

export class DigitalOceanService {
  private client;
  private coolifySSHKey: string | undefined;

  constructor() {
    this.client = axios.create({
      baseURL: 'https://api.digitalocean.com/v2',
      headers: {
        Authorization: `Bearer ${config.digitalOcean.apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    // Get Coolify's SSH key from environment
    this.coolifySSHKey = process.env.COOLIFY_SSH_PUBLIC_KEY;
    if (!this.coolifySSHKey) {
      console.warn('COOLIFY_SSH_PUBLIC_KEY not set - Coolify may not be able to connect to Droplets');
    }
  }

  

  async createDroplet(dropletConfig: Partial<DropletConfig>) {

    // First, ensure Coolify's SSH key is registered with DigitalOcean
    let sshKeyId = await this.ensureCoolifySSHKey();

    const finalConfig = {
      name:dropletConfig.name,
      ...config.digitalOcean.defaultConfig,
      ssh_keys: [sshKeyId.id, sshKeyId.fingerprint], // Only use Coolify's key
      ipv6: true,
      monitoring: true    };

    try {
      const response  = await this.client.post('/droplets', finalConfig);
      return response.data.droplet;
    } catch (error) {
      console.error('Error creating droplet:', error);
      throw error;
    }
  }

  async getDroplet(dropletId: number) {
    try {
      const { data } = await this.client.get(`/droplets/${dropletId}`);
      return data.droplet;
    } catch (error) {
      console.error('Error getting droplet:', error);
      throw error;
    }
  }

  async deleteDroplet(dropletId: number) {
    try {
      await this.client.delete(`/droplets/${dropletId}`);
    } catch (error) {
      console.error('Error deleting droplet:', error);
      throw error;
    }
  }

  private async ensureCoolifySSHKey(): Promise<any> {
    if (!this.coolifySSHKey) {
      throw new Error('COOLIFY_SSH_PUBLIC_KEY not configured');
    }

    try {
      // Check if key already exists
      const response = await this.client.get('/account/keys');
      const existingKey = response.data.ssh_keys.find(
        (key) => key.public_key === this.coolifySSHKey
      );

      if (existingKey) {
        const data = {
          id: existingKey.id,
          fingerprint: existingKey.fingerprint
        }
        return data;
      }

      // If not exists, add the key
      const newKeyResponse = await this.client.post('/account/keys', {
        name: `coolify-key-${Date.now()}`,
        public_key: this.coolifySSHKey
      });

      const data = {
        id: newKeyResponse.data.ssh_key.id,
        fingerprint: newKeyResponse.data.ssh_key.fingerprint
      }

      return data;
    } catch (error) {
      console.error('Failed to ensure SSH key:', error);
      throw error;
    }
  }
}
