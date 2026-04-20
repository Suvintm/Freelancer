export type AdminRole = 'superadmin' | 'admin' | 'manager' | 'editor';

export interface AdminUser {
    id: string;
    email: string;
    name: string;
    role?: string;
    role_value?: string;
    permissions?: any;
    is_active?: boolean;
    current_session_token?: string | null;
}

export interface AuthPayload {
    id: string;
    email: string;
    role: string;
    permissions: any;
}
