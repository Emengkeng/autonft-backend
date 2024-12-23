export interface DropletConfig {
  name: string;
  region: string;
  size: string;
  image: string;
  ssh_keys?: (number | string)[];
}

export interface ElizaDeployConfig {
  project_uuid: string;
  server_uuid: string;
  environment_name: string;
  git_repository: string;
  git_branch: string;
  build_pack: 'nixpacks' | 'dockerfile';
  ports_exposes: string;
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

export interface EnvironmentVariable {
  key: string;
  value: string;
}

export interface BulkEnvironmentVariables {
  environmentVariables: EnvironmentVariable[];
}