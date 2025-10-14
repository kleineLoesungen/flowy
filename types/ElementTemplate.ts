export interface ElementTemplate {
    id: string;
    name: string;
    description: string;
    ownerId: string | null;
    durationDays: number | null;
    type: 'action' | 'state' | 'artefact';
    consultedUserIds: string[];
}