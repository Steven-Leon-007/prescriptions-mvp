import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PrismaService } from 'src/prisma/prisma.service';
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
              create: { birthDate: createUserDto.birthDate }
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
