export interface User {
    id: string;
    name: string;
    email: string;
    role: 'member' | 'admin';
    hasPassword?: boolean; // Optional for backward compatibility
}
