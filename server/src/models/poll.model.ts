import mongoose, { Document, Schema } from 'mongoose';

export interface IOption {
    id: string;
    text: string;
}

export interface IPoll extends Document {
    question: string;
    options: IOption[];
    duration: number; // seconds
    startTime: Date;
    endTime: Date;
    isActive: boolean;
    createdBy: string;
    createdAt: Date;
}

const OptionSchema = new Schema<IOption>({
    id: { type: String, required: true },
    text: { type: String, required: true },
});

const PollSchema = new Schema<IPoll>(
    {
        question: { type: String, required: true, trim: true },
        options: { type: [OptionSchema], required: true, validate: [(v: IOption[]) => v.length >= 2, 'At least 2 options required'] },
        duration: { type: Number, required: true, default: 60, min: 5, max: 300 },
        startTime: { type: Date, required: true },
        endTime: { type: Date, required: true },
        isActive: { type: Boolean, default: true },
        createdBy: { type: String, required: true },
    },
    { timestamps: true }
);

// Only one active poll at a time — partial unique index
PollSchema.index({ isActive: 1 }, { partialFilterExpression: { isActive: true } });

export const Poll = mongoose.model<IPoll>('Poll', PollSchema);
