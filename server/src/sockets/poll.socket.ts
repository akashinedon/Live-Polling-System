import { Server as SocketServer, Socket } from 'socket.io';
import { pollService } from '../services/poll.service';

// Track connected students: socketId -> studentName
const connectedStudents = new Map<string, string>();
// Track teachers
const connectedTeachers = new Set<string>();

export const registerPollSocketHandlers = (io: SocketServer) => {
    io.on('connection', (socket: Socket) => {
        console.log(`[Socket] Client connected: ${socket.id}`);

        // ─── Role registration ───────────────────────────────
        socket.on('register:teacher', () => {
            connectedTeachers.add(socket.id);
            socket.join('teachers');
            emitStudentCount(io);
            console.log(`[Socket] Teacher registered: ${socket.id}`);
        });

        socket.on('register:student', async ({ studentName }: { studentName: string }) => {
            connectedStudents.set(socket.id, studentName);
            socket.join('students');
            emitStudentCount(io);
            console.log(`[Socket] Student registered: ${studentName} (${socket.id})`);

            // Send current active poll state for state recovery
            try {
                const activePoll = await pollService.getActivePoll();
                if (activePoll) {
                    const hasVoted = await pollService.hasStudentVoted(activePoll.poll._id.toString(), studentName);
                    socket.emit('poll:state', {
                        poll: activePoll.poll,
                        remainingTime: activePoll.remainingTime,
                        results: activePoll.results,
                        totalVotes: activePoll.totalVotes,
                        hasVoted,
                    });
                }
            } catch (err) {
                console.error('[Socket] Error sending state to student:', err);
            }
        });

        // ─── Poll creation (teacher) ─────────────────────────
        socket.on('poll:create', async (data: { question: string; options: string[]; duration: number; createdBy: string }, callback) => {
            try {
                const poll = await pollService.createPoll(data);
                // Broadcast to everyone
                io.emit('poll:new', {
                    poll,
                    remainingTime: data.duration * 1000,
                    serverTime: Date.now(),
                });
                if (typeof callback === 'function') callback({ success: true, poll });
            } catch (err: unknown) {
                const message = err instanceof Error ? err.message : 'Failed to create poll';
                console.error('[Socket] poll:create error:', message);
                if (typeof callback === 'function') callback({ success: false, message });
                socket.emit('error:poll', { message });
            }
        });

        // ─── Voting (student) ────────────────────────────────
        socket.on('poll:vote', async (data: { pollId: string; studentName: string; optionId: string }, callback) => {
            try {
                const results = await pollService.castVote(data.pollId, data.studentName, data.optionId);
                // Broadcast updated results to everyone
                const { totalVotes } = await pollService.getResults(data.pollId);
                io.emit('poll:results_update', { pollId: data.pollId, results, totalVotes });
                if (typeof callback === 'function') callback({ success: true, results });
            } catch (err: unknown) {
                const message = err instanceof Error ? err.message : 'Vote failed';
                console.error('[Socket] poll:vote error:', message);
                if (typeof callback === 'function') callback({ success: false, message });
                socket.emit('error:vote', { message });
            }
        });

        // ─── Manual poll end (teacher) ───────────────────────
        socket.on('poll:end', async ({ pollId }: { pollId: string }, callback) => {
            try {
                const result = await pollService.endPoll(pollId, false);
                // poll:ended is emitted inside pollService.endPoll via io
                if (typeof callback === 'function') callback({ success: true, result });
            } catch (err: unknown) {
                const message = err instanceof Error ? err.message : 'Failed to end poll';
                if (typeof callback === 'function') callback({ success: false, message });
            }
        });

        // ─── Chat ────────────────────────────────────────────
        socket.on('chat:message', ({ name, message, role }: { name: string; message: string; role: string }) => {
            io.emit('chat:message', {
                id: Date.now().toString(),
                name,
                message,
                role,
                timestamp: new Date().toISOString(),
            });
        });

        // ─── Remove student (teacher) ────────────────────────
        socket.on('poll:remove_student', async ({ pollId, studentName }: { pollId: string; studentName: string }) => {
            try {
                await pollService.removeStudent(pollId, studentName);
                io.emit('poll:student_removed', { studentName });
            } catch (err) {
                console.error('[Socket] remove_student error:', err);
            }
        });

        // ─── Disconnect ──────────────────────────────────────
        socket.on('disconnect', () => {
            connectedStudents.delete(socket.id);
            connectedTeachers.delete(socket.id);
            emitStudentCount(io);
            console.log(`[Socket] Client disconnected: ${socket.id}`);
        });
    });
};

function emitStudentCount(io: SocketServer) {
    io.emit('students:count', { count: connectedStudents.size });
}
