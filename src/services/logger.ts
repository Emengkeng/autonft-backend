import { DeploymentJob } from '../types';
import winston from 'winston';
import path from 'path';

// Define log levels and colors
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
};

const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  debug: 'blue',
};

// Define custom format
const customFormat = winston.format.printf(({ level, message, timestamp, jobId, service }) => {
  return `${timestamp} [${jobId || 'system'}] [${service}] ${level}: ${message}`;
});

export class LoggerService {
  private logger: winston.Logger;
  
  constructor() {
    // Create logs directory if it doesn't exist
    const logDir = path.join(process.cwd(), 'logs');
    
    this.logger = winston.createLogger({
      levels,
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.colorize(),
        customFormat
      ),
      transports: [
        // Console output
        new winston.transports.Console(),
        // Error log file
        new winston.transports.File({ 
          filename: path.join(logDir, 'error.log'), 
          level: 'error' 
        }),
        // Combined log file
        new winston.transports.File({ 
          filename: path.join(logDir, 'combined.log')
        }),
      ],
    });

    // Add colors
    winston.addColors(colors);
  }

  // Log deployment status changes
  logDeploymentStatus(jobId: string, status: DeploymentJob['status'], message: string) {
    this.logger.info(message, {
      jobId,
      service: 'DeploymentService',
      status
    });
  }

  // Log DigitalOcean operations
  logDropletOperation(jobId: string, operation: string, dropletId?: number, error?: Error) {
    if (error) {
      this.logger.error(`Droplet ${operation} failed: ${error.message}`, {
        jobId,
        service: 'DigitalOceanService',
        dropletId
      });
    } else {
      this.logger.info(`Droplet ${operation} successful`, {
        jobId,
        service: 'DigitalOceanService',
        dropletId,
      });
    }
  }

  // Log Coolify operations
  logCoolifyOperation(jobId: string, operation: string, serverId?: string, error?: Error) {
    if (error) {
      this.logger.error(`Coolify ${operation} failed: ${error.message}`, {
        jobId,
        service: 'CoolifyService',
        serverId
      });
    } else {
      this.logger.info(`Coolify ${operation} successful`, {
        jobId,
        service: 'CoolifyService',
        serverId
      });
    }
  }

  // Log queue operations
  logQueueOperation(jobId: string, operation: string, error?: Error) {
    if (error) {
      this.logger.error(`Queue ${operation} failed: ${error.message}`, {
        jobId,
        service: 'QueueService'
      });
    } else {
      this.logger.info(`Queue ${operation} successful`, {
        jobId,
        service: 'QueueService'
      });
    }
  }

  // Log cleanup operations
  logCleanup(jobId: string, message: string, error?: Error) {
    if (error) {
      this.logger.error(`Cleanup failed: ${error.message}`, {
        jobId,
        service: 'CleanupService'
      });
    } else {
      this.logger.info(`Cleanup: ${message}`, {
        jobId,
        service: 'CleanupService'
      });
    }
  }

  // General error logger
  logError(service: string, error: Error, jobId?: string) {
    this.logger.error(`${error.message}`, {
      jobId,
      service,
      stack: error.stack
    });
  }

  // Debug logger for development
  logDebug(service: string, message: string, jobId?: string, metadata?: any) {
    this.logger.debug(message, {
      jobId,
      service,
      ...metadata
    });
  }
}