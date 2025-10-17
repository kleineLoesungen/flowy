export interface ElementTemplate {
    id: string;
    name: string;
    description: string;
    type: 'action' | 'state' | 'artefact';
    // The following fields are only used for 'action' type elements:
    ownerId: string | null;        // null for non-action elements
    durationDays: number | null;   // null for non-action elements  
    consultedUserIds: string[];    // empty array for non-action elements
}