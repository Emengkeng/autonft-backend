export interface DropletConfig {
  name: string;
  region: string;
  size: string;
  image: string;
  ssh_keys?: (number | string)[];
}

export interface ElizaDeployConfig {
  projectUuid: string;
  serverUuid: string;
  environmentName: string;
  gitRepository: string;
  gitBranch: string;
  buildPack: 'nixpacks' | 'dockerfile';
  portsExposed: string;
}

export interface DeploymentJob {
  id: string;
  dropletConfig: Partial<DropletConfig>;
  deployConfig: Partial<ElizaDeployConfig>;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  dropletId?: number;
  serverId?: string;
  //dropletIp: string;
  error?: string;
  createdAt: Date;
}