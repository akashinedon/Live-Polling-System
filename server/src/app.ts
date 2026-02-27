import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import pollRoutes from './routes/poll.routes';
import { errorHandler, notFound } from './middleware/errorHandler';

dotenv.config();

const app = express();

// ─── Middleware ──────────────────────────────────────────
const allowedOrigins = [
    process.env.CLIENT_URL || 'http://localhost:5173',
    'http://localhost:5173',
    'https://live-polling-system-meao.vercel.app',
    'https://live-polling-system-lac-alpha.vercel.app',
].filter(Boolean);

app.use(
    cors({
        origin: (origin, callback) => {
            // Allow requests with no origin (mobile apps, curl, etc)
            // Allow all vercel.app preview deployments
            if (!origin || allowedOrigins.includes(origin) || origin.endsWith('.vercel.app')) {
                callback(null, true);
            } else {
                callback(new Error('Not allowed by CORS'));
            }
        },
        credentials: true,
        methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── Health Check ────────────────────────────────────────
app.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ─── API Routes ──────────────────────────────────────────
app.use('/api/polls', pollRoutes);

// ─── 404 & Error Handling ────────────────────────────────
app.use(notFound);
app.use(errorHandler);

export default app;
