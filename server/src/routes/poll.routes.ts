import { Router } from 'express';
import { pollController } from '../controllers/poll.controller';

const router = Router();

// POST /api/polls - Create a new poll
router.post('/', pollController.createPoll.bind(pollController));

// GET /api/polls/active - Get active poll (with optional ?studentName= for hasVoted check)
router.get('/active', pollController.getActivePoll.bind(pollController));

// GET /api/polls/history - Paginated poll history
router.get('/history', pollController.getPollHistory.bind(pollController));

// GET /api/polls/:id/results - Get results for a specific poll
router.get('/:id/results', pollController.getResults.bind(pollController));

// POST /api/polls/:id/vote - Submit a vote
router.post('/:id/vote', pollController.vote.bind(pollController));

// PATCH /api/polls/:id/end - Manually end a poll
router.patch('/:id/end', pollController.endPoll.bind(pollController));

// DELETE /api/polls/:id/students/:studentName - Remove student from poll
router.delete('/:id/students/:studentName', pollController.removeStudent.bind(pollController));

export default router;
