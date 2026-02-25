import { Poll, IPoll, IOption } from '../models/poll.model';
import { Vote } from '../models/vote.model';
import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { Server as SocketServer } from 'socket.io';

// We'll inject io from server.ts
let _io: SocketServer | null = null;
// Timer map: pollId -> NodeJS.Timeout
const pollTimers = new Map<string, NodeJS.Timeout>();

export const setIo = (io: SocketServer) => {
    _io = io;
};

export interface CreatePollDto {
    question: string;
    options: string[];
    duration: number;
    createdBy: string;
}

export interface VoteResultItem {
    optionId: string;
    text: string;
    votes: number;
    percentage: number;
}

export interface PollResult {
    pollId: string;
    question: string;
    options: IOption[];
    results: VoteResultItem[];
    totalVotes: number;
    isActive: boolean;
}

export interface ActivePollResponse {
    poll: IPoll;
    remainingTime: number; // ms
    results: VoteResultItem[];
    totalVotes: number;
}

class PollService {
    async createPoll(dto: CreatePollDto): Promise<IPoll> {
        // Ensure no active poll exists
        const existing = await Poll.findOne({ isActive: true });
        if (existing) {
            throw new Error('A poll is already active. End it before creating a new one.');
        }

        const options: IOption[] = dto.options.map((text) => ({ id: uuidv4(), text }));
        const startTime = new Date();
        const endTime = new Date(startTime.getTime() + dto.duration * 1000);

        const poll = await Poll.create({
            question: dto.question,
            options,
            duration: dto.duration,
            startTime,
            endTime,
            isActive: true,
            createdBy: dto.createdBy,
        });

        // Schedule auto-end
        this.schedulePollEnd(poll._id.toString(), dto.duration * 1000);

        return poll;
    }

    schedulePollEnd(pollId: string, delayMs: number) {
        const timer = setTimeout(async () => {
            await this.endPoll(pollId, true);
        }, delayMs);
        pollTimers.set(pollId, timer);
    }

    async endPoll(pollId: string, auto = false): Promise<PollResult> {
        const poll = await Poll.findByIdAndUpdate(
            pollId,
            { isActive: false },
            { new: true }
        );
        if (!poll) throw new Error('Poll not found');

        // Clear any pending timer
        const timer = pollTimers.get(pollId);
        if (timer) {
            clearTimeout(timer);
            pollTimers.delete(pollId);
        }

        const result = await this.getResults(pollId);

        if (_io) {
            _io.emit('poll:ended', { pollId, results: result.results, totalVotes: result.totalVotes, auto });
        }

        return result;
    }

    async getActivePoll(): Promise<ActivePollResponse | null> {
        const poll = await Poll.findOne({ isActive: true });
        if (!poll) return null;

        const now = Date.now();
        const endTime = poll.endTime.getTime();
        const remainingTime = Math.max(0, endTime - now);

        // If time has expired but not yet marked inactive (edge case recovery)
        if (remainingTime <= 0 && poll.isActive) {
            await this.endPoll(poll._id.toString(), true);
            return null;
        }

        const results = await this.computeResults(poll);

        return {
            poll,
            remainingTime,
            results: results.results,
            totalVotes: results.totalVotes,
        };
    }

    async castVote(pollId: string, studentName: string, optionId: string): Promise<VoteResultItem[]> {
        const poll = await Poll.findById(pollId);
        if (!poll) throw new Error('Poll not found');
        if (!poll.isActive) throw new Error('Poll has ended');

        const now = Date.now();
        if (now > poll.endTime.getTime()) {
            // Auto-end if time expired
            await this.endPoll(pollId, true);
            throw new Error('Poll time has expired');
        }

        // Validate optionId
        const validOption = poll.options.find((o) => o.id === optionId);
        if (!validOption) throw new Error('Invalid option selected');

        // Duplicate vote prevention — compound unique index will throw if duplicate
        try {
            await Vote.create({ pollId: new mongoose.Types.ObjectId(pollId), studentName, optionId, votedAt: new Date() });
        } catch (err: unknown) {
            if (err instanceof Error && err.message.includes('E11000')) {
                throw new Error('You have already voted on this poll');
            }
            throw err;
        }

        const results = await this.computeResults(poll);
        return results.results;
    }

    async getResults(pollId: string): Promise<PollResult> {
        const poll = await Poll.findById(pollId);
        if (!poll) throw new Error('Poll not found');
        const results = await this.computeResults(poll);
        return { pollId, question: poll.question, options: poll.options, ...results, isActive: poll.isActive };
    }

    private async computeResults(poll: IPoll): Promise<{ results: VoteResultItem[]; totalVotes: number }> {
        const votes = await Vote.find({ pollId: poll._id });
        const totalVotes = votes.length;

        const countMap: Record<string, number> = {};
        poll.options.forEach((o) => (countMap[o.id] = 0));
        votes.forEach((v) => {
            if (countMap[v.optionId] !== undefined) countMap[v.optionId]++;
        });

        const results: VoteResultItem[] = poll.options.map((o) => ({
            optionId: o.id,
            text: o.text,
            votes: countMap[o.id],
            percentage: totalVotes > 0 ? Math.round((countMap[o.id] / totalVotes) * 100) : 0,
        }));

        return { results, totalVotes };
    }

    async hasStudentVoted(pollId: string, studentName: string): Promise<boolean> {
        const vote = await Vote.findOne({ pollId: new mongoose.Types.ObjectId(pollId), studentName });
        return vote !== null;
    }

    async getPollHistory(page = 1, limit = 10): Promise<{ polls: PollResult[]; total: number; page: number }> {
        const skip = (page - 1) * limit;
        const [polls, total] = await Promise.all([
            Poll.find({ isActive: false }).sort({ createdAt: -1 }).skip(skip).limit(limit),
            Poll.countDocuments({ isActive: false }),
        ]);

        const resultsArr = await Promise.all(polls.map((p) => this.computeResults(p)));

        const pollResults: PollResult[] = polls.map((p, i) => ({
            pollId: p._id.toString(),
            question: p.question,
            options: p.options,
            results: resultsArr[i].results,
            totalVotes: resultsArr[i].totalVotes,
            isActive: false,
        }));

        return { polls: pollResults, total, page };
    }

    async removeStudent(pollId: string, studentName: string): Promise<void> {
        // Remove the student's vote for this poll
        await Vote.deleteOne({ pollId: new mongoose.Types.ObjectId(pollId), studentName });
    }

    // Recover timer on server restart for active polls
    async recoverActiveTimers() {
        const activePoll = await Poll.findOne({ isActive: true });
        if (!activePoll) return;
        const remaining = activePoll.endTime.getTime() - Date.now();
        if (remaining > 0) {
            this.schedulePollEnd(activePoll._id.toString(), remaining);
        } else {
            await this.endPoll(activePoll._id.toString(), true);
        }
    }
}

export const pollService = new PollService();
