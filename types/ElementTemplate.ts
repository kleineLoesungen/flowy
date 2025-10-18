export interface ElementTemplate {
    id: string;
    name: string;
    description: string;
    type: 'action' | 'state' | 'artefact';
    // The following fields are only used for 'action' type elements:
    ownerTeamId: string | null;        // null for non-action elements
    durationDays: number | null;       // null for non-action elements  
    consultedTeamIds: string[];        // empty array for non-action elements
}