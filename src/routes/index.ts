import express from 'express';
import { DeploymentController } from '../controllers/deployment';

const router = express.Router();
const deploymentController = new DeploymentController();

router.post('/deploy', deploymentController.deployEliza);
router.get('/deploy/:jobId/status', deploymentController.getDeploymentStatus);
router.get('/droplets/count', deploymentController.getActiveDroplets);

export default router;