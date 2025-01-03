import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import helmet from 'helmet';

import generatorRouter from './routes/generatorRoutes.js';
import { errorHandler } from './middlewares/errorHandler.js';

const app = express();

// 미들웨어 설정
app.use(cors());
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API 라우트 설정
app.use('/api/generator', generatorRouter);

// 404 처리
app.use((req, res) => {
    res.status(404).json({ 
        status: 'error',
        message: '요청하신 리소스를 찾을 수 없습니다.' 
    });
});

// 에러 핸들링 미들웨어
app.use(errorHandler);

export default app;