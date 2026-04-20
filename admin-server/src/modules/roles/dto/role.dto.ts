import { IsString, IsNotEmpty, IsOptional, IsArray } from 'class-validator';

export class CreateRoleDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsNotEmpty()
  value!: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsArray()
  @IsNotEmpty()
  permissions!: string[];
}

export class AssignRoleDto {
  @IsString()
  @IsNotEmpty()
  adminId!: string;

  @IsString()
  @IsNotEmpty()
  roleValue!: string;
}
