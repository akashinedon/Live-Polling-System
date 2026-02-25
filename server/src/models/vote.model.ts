import mongoose, { Document, Schema } from 'mongoose';

export interface IVote extends Document {
    pollId: mongoose.Types.ObjectId;
    studentName: string;
    optionId: string;
    votedAt: Date;
}

const VoteSchema = new Schema<IVote>({
    pollId: { type: Schema.Types.ObjectId, ref: 'Poll', required: true, index: true },
    studentName: { type: String, required: true, trim: true },
    optionId: { type: String, required: true },
    votedAt: { type: Date, default: Date.now },
});

// Prevent duplicate votes: one student per poll
VoteSchema.index({ pollId: 1, studentName: 1 }, { unique: true });

export const Vote = mongoose.model<IVote>('Vote', VoteSchema);
