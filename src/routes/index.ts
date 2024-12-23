import express, { Router } from 'express';
import { DeploymentController } from '../controllers/deployment';
import { EnvironmentService } from '@/services/environment.variables';
import { EnvironmentController } from '@/controllers/environment';
import { TokenController } from '@/controllers/token';

const router: Router = express.Router();
const deploymentController = new DeploymentController();
const tokenController = new TokenController();

// Initialize service with just the base URL and auth token
const envService = new EnvironmentService(
    process.env.COOLIFY_API_URL || 'https://api.coolify.io',
    process.env.COOLIFY_API_KEY || ''
);

const envController = new EnvironmentController(envService);

// Health check endpoint
router.get('/health', (req, res) => {
    res.status(200).json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        version: process.env.npm_package_version || '1.0.0'
    });
});

router.post('/deploy', deploymentController.deployEliza);
router.get('/deploy/:jobId/status', deploymentController.getDeploymentStatus);
router.get('/droplets/count', deploymentController.getActiveDroplets);

router.post('/env', envController.updateVariable);
router.put('/env/bulk', envController.bulkUpdate);
router.delete('/env/:applicationUuid/:key', envController.deleteVariable);

router.get('/balance/:userId', tokenController.getBalance);
router.post('/deduct', tokenController.deductTokens);
router.post('/credit', tokenController.creditTokens);
router.get('/history/:userId', tokenController.getTransactionHistory);

export default router;