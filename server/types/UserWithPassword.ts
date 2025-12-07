import type { User } from '../../types_old/User'

export interface UserWithPassword extends User {
    passwordHash: string;
}