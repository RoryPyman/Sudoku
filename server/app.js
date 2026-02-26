import express       from 'express';
import cors          from 'cors';
import cookieParser  from 'cookie-parser';
import { apiLimiter }    from './middleware/rateLimiter.js';
import { errorHandler }  from './middleware/errorHandler.js';
import authRouter        from './routes/auth.routes.js';
import gamesRouter       from './routes/games.routes.js';
import statsRouter       from './routes/stats.routes.js';

const app = express();

app.use(cors({
  origin:      process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());
app.use('/api', apiLimiter);

app.use('/api/auth',  authRouter);
app.use('/api/games', gamesRouter);
app.use('/api/stats', statsRouter);

// 404
app.use((_req, res) => res.status(404).json({ error: 'NotFound', message: 'Route not found' }));

app.use(errorHandler);

export default app;
