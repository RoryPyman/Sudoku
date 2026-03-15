import express       from 'express';
import cors          from 'cors';
import cookieParser  from 'cookie-parser';
import path          from 'path';
import { fileURLToPath } from 'url';
import { apiLimiter }    from './middleware/rateLimiter.js';
import { errorHandler }  from './middleware/errorHandler.js';
import authRouter         from './routes/auth.routes.js';
import gamesRouter        from './routes/games.routes.js';
import statsRouter        from './routes/stats.routes.js';
import friendsRouter      from './routes/friends.routes.js';
import profileRouter      from './routes/profile.routes.js';
import dailyRouter        from './routes/daily.routes.js';
import notificationsRouter from './routes/notifications.routes.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();

// Trust the first proxy hop (Fly.io, nginx, etc.) so express-rate-limit
// sees real client IPs from X-Forwarded-For rather than the proxy IP.
app.set('trust proxy', 1);

app.use(cors({
  origin:      process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());
app.use('/api', apiLimiter);

app.use('/api/auth',    authRouter);
app.use('/api/games',   gamesRouter);
app.use('/api/stats',   statsRouter);
app.use('/api/friends',       friendsRouter);
app.use('/api/users',         profileRouter);
app.use('/api/daily',         dailyRouter);
app.use('/api/notifications', notificationsRouter);

if (process.env.NODE_ENV === 'production') {
  // Serve the built React app
  const distPath = path.join(__dirname, '../dist');
  app.use(express.static(distPath));
  // SPA fallback — let React Router handle client-side routes
  app.get('*', (_req, res) => res.sendFile(path.join(distPath, 'index.html')));
} else {
  app.use((_req, res) => res.status(404).json({ error: 'NotFound', message: 'Route not found' }));
}

app.use(errorHandler);

export default app;
