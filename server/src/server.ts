// Live Polling System — Server Entry Point v2
import { createServer } from 'http';
import { Server as SocketServer } from 'socket.io';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import app from './app';
import { registerPollSocketHandlers } from './sockets/poll.socket';
import { pollService, setIo } from './services/poll.service';

dotenv.config();

const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/live-polling';
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

// ─── HTTP + Socket.io Server ─────────────────────────────
const httpServer = createServer(app);
const io = new SocketServer(httpServer, {
    cors: {
        origin: CLIENT_URL,
        methods: ['GET', 'POST'],
        credentials: true,
    },
    pingTimeout: 60000,
    pingInterval: 25000,
});

// Inject io into service for broadcasting
setIo(io);

// Register socket handlers
registerPollSocketHandlers(io);

// ─── MongoDB Connection ──────────────────────────────────
const connectDB = async () => {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('[DB] MongoDB connected successfully');

        // Recover timers for any active polls on restart
        await pollService.recoverActiveTimers();
        console.log('[Server] Timer recovery complete');
    } catch (err) {
        console.error('[DB] MongoDB connection failed:', err);
        console.warn('[Server] Running without database — some features unavailable');
        // Don't crash — allow server to run with degraded functionality
    }
};

// ─── Start Server ────────────────────────────────────────
const startServer = async () => {
    await connectDB();

    httpServer.listen(PORT, () => {
        console.log(`[Server] Running on http://localhost:${PORT}`);
        console.log(`[Server] Environment: ${process.env.NODE_ENV || 'development'}`);
    });
};

// Handle unhandled rejections
process.on('unhandledRejection', (err: Error) => {
    console.error('[Server] Unhandled rejection:', err.message);
});

process.on('uncaughtException', (err: Error) => {
    console.error('[Server] Uncaught exception:', err.message);
    process.exit(1);
});

startServer();
