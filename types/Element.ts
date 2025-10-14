export interface Element {
    id: string;
    name: string;
    description: string;
    ownerId: string | null;
    consultedUserIds: string[];
    completedAt: number | null; // real completion
    expectedEndedAt: number | null; // generated based on duration
    type: 'action' | 'state' | 'artefact';
    status: 'pending' | 'in-progress' | 'completed' | 'aborted';
    comments: ElementComment[];
}

export interface ElementComment {
    timestamp: number;
    comment: string;
    userId: string;
}