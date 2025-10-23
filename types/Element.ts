export interface Element {
    id: string;
    name: string;
    description: string;
    ownerTeamId: string | null; // null for state and artefact
    consultedTeamIds: string[]; // null for state and artefact
    completedAt: string | null; // real completion & null for state and artefact
    expectedEndedAt: string | null; // generated based on duration & null for state and artefact
    type: 'action' | 'state' | 'artefact';
    status: 'pending' | 'in-progress' | 'completed' | 'aborted'; // completed for state and artefact
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