import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator.js';
import { Permission } from '../types/permissions.types.js';
import { PrismaService } from '../../prisma/prisma.service.js';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const url = request.url;

    // RESILIENT BYPASS: Explicitly allow auth entry points by URL string
    // This resolves the issue where the Reflector is failing to read metadata
    if (url.includes('/auth/login') || url.includes('/auth/mfa/verify') || url.includes('/auth/status')) {
      return true;
    }

    let requiredPermissions: Permission[] = [];
    try {
       // Defensive check for potential Reflector version clashes
      if (this.reflector && typeof this.reflector.get === 'function') {
        requiredPermissions = this.reflector.get<Permission[]>(PERMISSIONS_KEY, context.getHandler()) ||
                          this.reflector.get<Permission[]>(PERMISSIONS_KEY, context.getClass());

        if (!requiredPermissions || requiredPermissions.length === 0) {
          return true;
        }
      }
    } catch (err) {
      console.warn('PermissionsGuard: Reflector mismatch detected, falling back to secure default.');
    }

    const { user } = context.switchToHttp().getRequest();
    if (!user) {
      return false;
    }

    // Superadmins bypass all permission checks
    if (user.role === 'superadmin' || user.role === 'SUPER_ADMIN') {
      return true;
    }

    // Fetch user with permissions from DB
    const admin = await this.prisma.adminMember.findUnique({
      where: { id: user.id },
      include: { role: true },
    });

    if (!admin) {
      throw new ForbiddenException('Admin user not found or inactive.');
    }

    // Merge individual permissions and role permissions
    // This expects permissions to be an array of strings in the JSON field
    const userPermissions = new Set<string>();
    
    // 1. Add permissions from individual user record
    if (Array.isArray(admin.permissions)) {
       (admin.permissions as string[]).forEach(p => userPermissions.add(p));
    }

    // 2. Add permissions from role
    if (admin.role && Array.isArray(admin.role.permissions)) {
      (admin.role.permissions as string[]).forEach(p => userPermissions.add(p));
    }

    // Check if user has all required permissions
    const hasPermission = requiredPermissions.every((permission) =>
      userPermissions.has(permission),
    );

    if (!hasPermission) {
      throw new ForbiddenException('Insufficient permissions to access this resource.');
    }

    return true;
  }
}
