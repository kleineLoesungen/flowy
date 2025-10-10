export interface Element {
    id: string;
    name: string;
    description: string;
    ownerId: string | null;
    teamId: string | null;
    startedAt: number | null;
    endedAt: number | null;
    completedAt: number | null;
    status: 'pending' | 'in-progress' | 'completed' | 'aborted';
    comments: ElementComment[];
}

export interface ElementComment {
    timestamp: number;
    comment: string;
    userId: string;
}