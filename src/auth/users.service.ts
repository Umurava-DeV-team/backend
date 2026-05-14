import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { RegisterDto } from './auth.dto';
import { User, UserRole } from '../entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepo: Repository<User>,
  ) { }

  async create(dto: RegisterDto): Promise<User> {
    const existing = await this.userRepo.findOne({
      where: { email: dto.email.toLowerCase() }
    });
    if (existing) throw new ConflictException('Email already registered');

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = this.userRepo.create({
      name: dto.name,
      email: dto.email.toLowerCase(),
      passwordHash,
      role: dto.role,
      company: dto.company,
    });
    return await this.userRepo.save(user);
  }

  async findByEmail(email: string): Promise<User | null> {
    return await this.userRepo.findOne({
      where: { email: email.toLowerCase() }
    });
  }

  async findById(id: string): Promise<User> {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async findFirstByRole(role: UserRole): Promise<User | null> {
    return await this.userRepo.findOne({
      where: { role },
      order: { createdAt: 'ASC' }
    });
  }

  async validatePassword(plain: string, hash: string): Promise<boolean> {
    return bcrypt.compare(plain, hash);
  }
}
