import { Router } from 'express';
import { lookupDonorByPhone } from '../controllers/publicController';

const router = Router();

// POST /api/public/donor-lookup — no auth required; phone-based donor lookup
router.post('/donor-lookup', lookupDonorByPhone);

export default router;
