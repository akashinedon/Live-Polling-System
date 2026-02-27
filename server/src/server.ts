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

const allowedOrigins = [
    CLIENT_URL,
    'http://localhost:5173',
    'https://live-polling-system-meao.vercel.app',
    'https://live-polling-system-lac-alpha.vercel.app',
].filter(Boolean);

const httpServer = createServer(app);
const io = new SocketServer(httpServer, {
    cors: {
        origin: allowedOrigins,
        methods: ['GET', 'POST'],
        credentials: true,
    },
    pingTimeout: 60000,
    pingInterval: 25000,
});

setIo(io);
registerPollSocketHandlers(io);

const connectDB = async () => {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('MongoDB connected');

        await pollService.recoverActiveTimers();
        console.log('Timer recovery complete');
    } catch (err) {
        console.error('MongoDB connection failed:', err);
        console.warn('Running without database — some features unavailable');
    }
};

const startServer = async () => {
    await connectDB();

    httpServer.listen(Number(PORT), '0.0.0.0', () => {
        console.log(`Server running on port ${PORT}`);
        console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    });
};

process.on('unhandledRejection', (err: Error) => {
    console.error('Unhandled rejection:', err.message);
});

process.on('uncaughtException', (err: Error) => {
    console.error('Uncaught exception:', err.message);
    process.exit(1);
});

startServer();
