import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';

@Injectable()
export class RolesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.adminRole.findMany({
      orderBy: { created_at: 'desc' },
    });
  }

  async createRole(data: { name: string; value: string; description?: string; permissions: any }) {
    // Ensure value is lowercase and snake_case
    const roleValue = data.value.toLowerCase().replace(/\s+/g, '_');
    
    const existing = await this.prisma.adminRole.findUnique({
      where: { value: roleValue },
    });

    if (existing) {
      throw new BadRequestException(`Role with value '${roleValue}' already exists.`);
    }

    return this.prisma.adminRole.create({
      data: {
        name: data.name,
        value: roleValue,
        description: data.description,
        permissions: data.permissions,
        is_active: true,
      },
    });
  }

  async assignRoleToAdmin(adminId: string, roleValue: string) {
    const role = await this.prisma.adminRole.findUnique({
      where: { value: roleValue },
    });

    if (!role) {
      throw new NotFoundException(`Role '${roleValue}' not found.`);
    }

    return this.prisma.adminMember.update({
      where: { id: adminId },
      data: {
        role_id: role.id,
        role_value: role.value,
      },
    });
  }
}
