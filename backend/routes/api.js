import express from 'express';
import multer from 'multer';
import { register, login } from '../controllers/authController.js';
import { requireAuth } from '../middleware/auth.js';
import { onboardDocument, getDashboardStats, createCampaign, getCampaigns, getAIDiagnostics, simulateCampaign } from '../controllers/businessController.js';
import { stressTestREST } from '../controllers/telemetryCtrl.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// Clinician Auth Routes
router.post('/auth/register', register);
router.post('/auth/login', login);

// Secured Strategy & Management Routes
router.post('/business/onboard', requireAuth, upload.single('file'), onboardDocument);
router.get('/business/dashboard-stats', requireAuth, getDashboardStats);
router.post('/business/campaigns', requireAuth, createCampaign);
router.get('/business/campaigns', requireAuth, getCampaigns);
router.get('/business/diagnostics', requireAuth, getAIDiagnostics);
router.post('/business/campaigns/:id/simulate', requireAuth, simulateCampaign);
router.post('/business/stress-test', requireAuth, stressTestREST);

export default router;
