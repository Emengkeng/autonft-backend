import dotenv from 'dotenv';
dotenv.config();

export const config = {
  digitalOcean: {
    apiKey: process.env.DO_API_KEY || '',
    defaultConfig: {
      region: 'nyc1',
      size: 's-2vcpu-2gb',
      image: 'ubuntu-20-04-x64'
    }
  },
  coolify: {
    apiKey: process.env.COOLIFY_API_KEY || '',
    apiUrl: process.env.COOLIFY_API_URL || 'https://api.coolify.io',
    defaultConfig: {
      buildPack: 'nixpacks' as const,
      environmentName: 'production',
      portsExposed: '3000'
    }
  }
};