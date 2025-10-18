export interface Element {
    id: string;
    name: string;
    description: string;
    ownerTeamId: string | null;
    consultedTeamIds: string[];
    completedAt: string | null; // real completion
    expectedEndedAt: string | null; // generated based on duration
    type: 'action' | 'state' | 'artefact';
    status: 'pending' | 'in-progress' | 'completed' | 'aborted';
    comments: ElementComment[];
}

export interface ElementComment {
    id: string;
    timestamp: string;
    comment: string;
    userId: string;
    userName?: string;
    userEmail?: string;
    statusTag?: 'pending' | 'in-progress' | 'completed' | 'aborted';
}