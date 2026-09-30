import { Router } from 'express';
import { lookupDonorByPhone, lookupDonorById } from '../controllers/publicController';

const router = Router();

// POST /api/public/donor-lookup — no auth required; phone-based donor lookup
router.post('/donor-lookup', lookupDonorByPhone);

// GET /api/public/donor/:id — no auth required; ID-based donor lookup (used by QR links)
router.get('/donor/:id', lookupDonorById);

export default router;
