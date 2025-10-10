export interface ElementTemplate {
    id: string;
    name: string;
    description: string;
    ownerId: string | null;
    teamId: string | null;
    durationDays: number | null;
}