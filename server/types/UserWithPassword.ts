import type { User } from '../../types/User'

export interface UserWithPassword extends User {
    passwordHash: string;
}