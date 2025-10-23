export interface ElementTemplate {
    id: string;
    name: string;
    description: string;
    type: 'action' | 'state' | 'artefact';
    ownerTeamId: string | null;        // null for state and artefact elements
    durationDays: number | null;       // null for state and artefact elements
    consultedTeamIds: string[];        // empty array for state and artefact elements
}