import { Request, Response, NextFunction } from 'express';
import { pollService } from '../services/poll.service';

export class PollController {
    async createPoll(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { question, options, duration, createdBy } = req.body;

            if (!question || !options || !Array.isArray(options) || options.length < 2) {
                res.status(400).json({ success: false, message: 'Question and at least 2 options are required' });
                return;
            }
            if (options.length > 6) {
                res.status(400).json({ success: false, message: 'Maximum 6 options allowed' });
                return;
            }

            const poll = await pollService.createPoll({
                question: String(question).trim(),
                options: options.map((o: string) => String(o).trim()),
                duration: Number(duration) || 60,
                createdBy: String(createdBy || 'Teacher'),
            });

            res.status(201).json({ success: true, data: poll });
        } catch (err) {
            next(err);
        }
    }

    async getActivePoll(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const activePoll = await pollService.getActivePoll();
            if (!activePoll) {
                res.json({ success: true, data: null });
                return;
            }

            let hasVoted = false;
            const studentNameParam = req.query.studentName;
            if (studentNameParam && typeof studentNameParam === 'string') {
                hasVoted = await pollService.hasStudentVoted(activePoll.poll._id.toString(), studentNameParam);
            }

            res.json({
                success: true,
                data: {
                    ...activePoll.poll.toObject(),
                    remainingTime: activePoll.remainingTime,
                    results: activePoll.results,
                    totalVotes: activePoll.totalVotes,
                    hasVoted,
                },
            });
        } catch (err) {
            next(err);
        }
    }

    async vote(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const pollId = String(req.params.id);
            const { studentName, optionId } = req.body;

            if (!studentName || !optionId) {
                res.status(400).json({ success: false, message: 'studentName and optionId are required' });
                return;
            }

            const results = await pollService.castVote(pollId, String(studentName).trim(), String(optionId));
            res.json({ success: true, data: { results } });
        } catch (err) {
            next(err);
        }
    }

    async getResults(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const pollId = String(req.params.id);
            const result = await pollService.getResults(pollId);
            res.json({ success: true, data: result });
        } catch (err) {
            next(err);
        }
    }

    async getPollHistory(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const page = parseInt(String(req.query.page || '1')) || 1;
            const limit = parseInt(String(req.query.limit || '10')) || 10;
            const history = await pollService.getPollHistory(page, limit);
            res.json({ success: true, data: history });
        } catch (err) {
            next(err);
        }
    }

    async endPoll(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const pollId = String(req.params.id);
            const result = await pollService.endPoll(pollId);
            res.json({ success: true, data: result });
        } catch (err) {
            next(err);
        }
    }

    async removeStudent(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const pollId = String(req.params.id);
            const studentName = String(req.params.studentName);
            await pollService.removeStudent(pollId, decodeURIComponent(studentName));
            res.json({ success: true, message: 'Student removed from poll' });
        } catch (err) {
            next(err);
        }
    }
}

export const pollController = new PollController();
