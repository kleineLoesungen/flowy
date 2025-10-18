export interface User {
    id: string;
    name: string;
    email: string;
    role: 'member' | 'admin';
    teamIds: string[]; // List of team IDs the user belongs to
}

export interface TeamMembership {
    userId: string;
    teamId: string;
    role: 'member' | 'lead' | 'manager';
    joinedAt: string;
}
