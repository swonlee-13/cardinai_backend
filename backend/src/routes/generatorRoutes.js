import express from 'express';
import { summarize, generateImage } from '../controllers/generatorController.js';

const router = express.Router();

router.post('/summarize', summarize);
router.post('/image', generateImage);

export default router;