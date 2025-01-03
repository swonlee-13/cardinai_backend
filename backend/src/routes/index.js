import express from 'express';
import generatorRouter from './generatorRoutes.js';

const router = express.Router();

// API 상태 체크
router.get('/status', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date(),
        services: {
            generator: 'active'
        }
    });
});

// 생성기 라우터 등록
router.use('/generator', generatorRouter);

export default router;