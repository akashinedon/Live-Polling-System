export interface PollOption {
    id: string;
    text: string;
}

export interface Poll {
    _id: string;
    question: string;
    options: PollOption[];
    duration: number; // seconds
    startTime: string; // ISO string
    endTime: string;   // ISO string
    isActive: boolean;
    createdBy: string;
    createdAt: string;
}

export interface VoteResult {
    optionId: string;
    text: string;
    votes: number;
    percentage: number;
}

export interface PollState {
    poll: Poll | null;
    remainingTime: number; // ms
    results: VoteResult[];
    totalVotes: number;
    hasVoted: boolean;
    selectedOptionId: string | null;
}

export interface ChatMessage {
    id: string;
    name: string;
    message: string;
    role: 'teacher' | 'student';
    timestamp: string;
}

export interface PollHistoryItem {
    pollId: string;
    question: string;
    options: PollOption[];
    results: VoteResult[];
    totalVotes: number;
    isActive: boolean;
}

export type AppRole = 'teacher' | 'student' | null;

export interface AppState {
    role: AppRole;
    studentName: string;
    connectionStatus: 'connected' | 'disconnected' | 'connecting';
    studentCount: number;
}
