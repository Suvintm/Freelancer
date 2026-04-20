export enum Permission {
  // Users
  USERS_VIEW = 'users:view',
  USERS_EDIT = 'users:edit',
  USERS_DELETE = 'users:delete',
  USERS_BAN = 'users:ban',

  // Content
  CONTENT_VIEW = 'content:view',
  CONTENT_DELETE = 'content:delete',
  CONTENT_FEATURE = 'content:feature',

  // Roles & Admins
  ADMINS_VIEW = 'admins:view',
  ADMINS_MANAGE = 'admins:manage',
  ROLES_MANAGE = 'roles:manage',

  // Audit & Settings
  AUDIT_VIEW = 'audit:view',
  SETTINGS_EDIT = 'settings:edit',
}

export interface RolePermissions {
  [resource: string]: string[]; // e.g. { "users": ["view", "edit"] }
}
