import express from 'express';
import { createStaff } from '../controllers/staffController.js';


const router = express.Router();

// POST /api/staff/create
router.post('/create', createStaff);

export default router;
