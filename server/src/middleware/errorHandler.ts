import { Request, Response, NextFunction } from 'express';

export interface AppError extends Error {
    statusCode?: number;
    isOperational?: boolean;
}

export const errorHandler = (err: AppError, req: Request, res: Response, _next: NextFunction): void => {
    const statusCode = err.statusCode || 500;
    const isDev = process.env.NODE_ENV === 'development';

    // DB connection errors
    if (err.message && err.message.toLowerCase().includes('buffertimeout')) {
        res.status(503).json({
            success: false,
            message: 'Database is temporarily unavailable. Please try again shortly.',
        });
        return;
    }

    // MongoDB duplicate-key
    if (err.message && err.message.includes('E11000')) {
        res.status(409).json({ success: false, message: 'You have already voted on this poll' });
        return;
    }

    console.error(`[Error] ${err.message}`, isDev ? err.stack : '');

    res.status(statusCode).json({
        success: false,
        message: err.isOperational ? err.message : 'An unexpected error occurred',
        ...(isDev && { stack: err.stack }),
    });
};

export const notFound = (req: Request, res: Response) => {
    res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
};
