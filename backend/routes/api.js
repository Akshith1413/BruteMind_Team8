import express from 'express';
import multer from 'multer';
import { register, login } from '../controllers/authController.js';
import { requireAuth } from '../middleware/auth.js';
import { onboardDocument, getDashboardStats, createCampaign, getCampaigns, getAIDiagnostics, simulateCampaign } from '../controllers/businessController.js';
import { stressTestREST } from '../controllers/telemetryCtrl.js';

import { strategyEngine, marketingEngine, leadGenEngine, salesEngine, analyticsEngine, customerSuccessEngine } from '../controllers/enginesController.js';

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

// Global Model Routing Config
import { getSystemConfig, updateSystemConfig } from '../controllers/systemConfigController.js';
router.get('/system/config', requireAuth, getSystemConfig);
router.post('/system/config', requireAuth, updateSystemConfig);

// 6 Core AI Engines Routes
router.post('/engines/strategy', requireAuth, strategyEngine);
router.post('/engines/marketing', requireAuth, marketingEngine);
router.post('/engines/lead-gen', requireAuth, leadGenEngine);
router.post('/engines/sales', requireAuth, salesEngine);
router.post('/engines/analytics', requireAuth, analyticsEngine);
router.post('/engines/customer-success', requireAuth, customerSuccessEngine);

export default router;
// Refactor: clean unused dependencies

// Refactor: stress test route config
