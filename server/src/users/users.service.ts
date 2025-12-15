import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { QueryUserDto } from './dto/query-user.dto';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {

  constructor(private prisma: PrismaService) { }

  async create(createUserDto: CreateUserDto) {
    try {
      const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

      const user = await this.prisma.user.create({
        data: {
          email: createUserDto.email,
          password: hashedPassword,
          name: createUserDto.name,
          role: createUserDto.role,
          ...(createUserDto.role === 'doctor' && {
            doctor: {
              create: { specialty: createUserDto.specialty }
            }
          }),
          ...(createUserDto.role === 'patient' && {
            patient: {
              create: { 
                birthDate: createUserDto.birthDate ? new Date(createUserDto.birthDate) : undefined 
              }
            }
          })
        },
        include: { doctor: true, patient: true }
      });

      const { password, ...result } = user;
      return result;

    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ConflictException('Unable to create user');
        }
      }
      throw error;
    }
  }

  findAll() {
    return this.prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        doctor: true,
        patient: true,
      }
    });
  }

  async findAllWithFilters(query: QueryUserDto) {
    const { role, query: searchQuery, page = 1, limit = 10 } = query;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (role) {
      where.role = role;
    }

    if (searchQuery) {
      where.OR = [
        { name: { contains: searchQuery, mode: 'insensitive' } },
        { email: { contains: searchQuery, mode: 'insensitive' } },
      ];
    }

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          createdAt: true,
          doctor: {
            select: {
              id: true,
              specialty: true,
            },
          },
          patient: {
            select: {
              id: true,
              birthDate: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      data: users,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findDoctors(page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    const [doctors, total] = await Promise.all([
      this.prisma.doctor.findMany({
        skip,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
              createdAt: true,
            },
          },
        },
        orderBy: { user: { createdAt: 'desc' } },
      }),
      this.prisma.doctor.count(),
    ]);

    return {
      data: doctors,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findPatients(page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    const [patients, total] = await Promise.all([
      this.prisma.patient.findMany({
        skip,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
              createdAt: true,
            },
          },
        },
        orderBy: { user: { createdAt: 'desc' } },
      }),
      this.prisma.patient.count(),
    ]);

    return {
      data: patients,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id }, include: { doctor: true, patient: true } });

    if (!user) {
      throw new NotFoundException(`User with id ${id} not found`);
    }

    return user;
  }

  async update(id: string, updateUserDto: UpdateUserDto) {

    const user = await this.findOne(id);

    if (updateUserDto.role && updateUserDto.role !== user.role) {
      throw new ConflictException('Cannot change user role');
    }

    const { specialty, birthDate, password, ...userData } = updateUserDto;

    const hashedPassword = password ? await bcrypt.hash(password, 10) : undefined;

    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: {
        ...userData,
        ...(hashedPassword && { password: hashedPassword }),
        ...(user.role === 'doctor' && specialty && {
          doctor: {
            update: {
              specialty,
            },
          },
        }),
        ...(user.role === 'patient' && birthDate && {
          patient: {
            update: {
              birthDate: new Date(birthDate),
            },
          },
        }),
      },
      include: {
        doctor: true,
        patient: true,
      },
    });

    const { password: _, ...result } = updatedUser;
    return result;

  }

  async remove(id: string) {
    const deletedUser = await this.prisma.user.delete({ where: { id } });

    if (!deletedUser) {
      throw new NotFoundException(`User with id ${id} not found`);
    }

    return deletedUser;
  }
}
