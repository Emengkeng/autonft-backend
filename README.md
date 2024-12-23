I'll create a comprehensive README file for this project, including a system architecture diagram using Mermaid.





# Automated Deployment System

A robust deployment automation system that orchestrates the creation of DigitalOcean droplets and manages application deployments through Coolify, featuring environment variable management and job queuing.

## Architecture

<antArtifact identifier="architecture-diagram" type="application/vnd.ant.mermaid" title="System Architecture Diagram">
flowchart TB
    Client([Client]) --> API[API Layer]
    API --> QueueService[Queue Service]
    API --> EnvController[Environment Controller]
    
    subgraph Queue Processing
        QueueService --> Redis[(Redis)]
        Redis --> QueueProcessor[Queue Processor]
        QueueProcessor --> DOService[DigitalOcean Service]
        QueueProcessor --> CoolifyService[Coolify Service]
        QueueProcessor --> DeploymentService[Deployment Service]
    end
    
    subgraph External Services
        DOService --> DigitalOcean[(DigitalOcean API)]
        CoolifyService --> Coolify[(Coolify API)]
        DeploymentService --> Database[(Database)]
    end
    
    subgraph Environment Management
        EnvController --> EnvService[Environment Service]
        EnvService --> Coolify
    end


## Features

- **Automated Deployment Pipeline**: Streamlined process for creating droplets and deploying applications
- **Queue-based Processing**: Reliable job processing using Bull queue with Redis
- **Environment Management**: Comprehensive environment variable handling
- **Resource Cleanup**: Automatic cleanup of resources in case of deployment failures
- **Status Monitoring**: Real-time deployment status tracking
- **Rate Limiting**: Built-in droplet creation limits (max 3 active droplets)

## Core Components

### 1. Queue Service
- Manages deployment job queue using Bull
- Handles the complete deployment lifecycle
- Implements cleanup procedures for failed deployments
- Updates deployment status in real-time

### 2. DigitalOcean Service
- Creates and manages droplets
- Handles SSH key management
- Implements droplet status monitoring
- Manages resource cleanup

### 3. Coolify Service
- Manages server connections
- Handles application deployments
- Sets up default environment configuration
- Monitors deployment status

### 4. Deployment Service
- Tracks active droplets
- Manages deployment records
- Enforces resource limits
- Provides deployment status updates

### 5. Environment Service
- Manages environment variables
- Supports bulk updates
- Handles variable deletion
- Implements automatic application restart

## API Endpoints

### Deployment Endpoints
```
POST /deploy              # Initiate new deployment
GET  /deploy/:jobId/status # Check deployment status
GET  /droplets/count      # Get active droplet count
```

### Environment Endpoints
```
POST   /env              # Update single environment variable
PUT    /env/bulk         # Bulk update environment variables
DELETE /env/:uuid/:key   # Delete environment variable
```

## Configuration

The system requires the following environment variables:

```env
DO_API_KEY=your_digitalocean_api_key
COOLIFY_API_KEY=your_coolify_api_key
COOLIFY_API_URL=https://api.coolify.io
COOLIFY_PROJECT_UUID=your_project_uuid
COOLIFY_SSH_PUBLIC_KEY=your_ssh_public_key
REDIS_URL=redis://localhost:6379
```

## Deployment Flow

1. **Job Creation**
   - Validate droplet limit
   - Create deployment record
   - Add job to queue

2. **Droplet Creation**
   - Create DigitalOcean droplet
   - Wait for droplet initialization
   - Obtain public IP

3. **Coolify Integration**
   - Connect server to Coolify
   - Deploy application
   - Set up environment variables

4. **Status Monitoring**
   - Track deployment progress
   - Handle failures
   - Update status records

## Error Handling

The system implements comprehensive error handling:
- Automatic resource cleanup on failures
- Detailed error logging
- Status updates throughout the process
- Retry mechanisms for transient failures

## Limitations

- Maximum of 3 active droplets
- 60-second timeout for droplet initialization
- Specific Coolify configuration requirements
- Redis dependency for queue management

## Development

To set up the development environment:

1. Clone the repository
2. Install dependencies: `npm install`
3. Set up environment variables
4. Start Redis server
5. Run development server: `npm run dev`

## Error Codes

- `429`: Maximum droplet limit reached
- `404`: Deployment not found
- `500`: Internal server error

## Best Practices

- Monitor Redis queue health
- Regularly check deployment logs
- Implement proper error handling
- Keep environment variables updated
- Regular cleanup of stale resources
</antArtifact>