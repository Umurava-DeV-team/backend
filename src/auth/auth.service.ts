import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { LoginDto, RegisterDto } from './auth.dto';
import { UsersService } from './users.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const user = await this.usersService.create(dto);
    const id = user._id.toString();
    const token = this.jwtService.sign({ sub: id, email: user.email, role: user.role });
    return {
      user: { id, name: user.name, email: user.email, role: user.role, phone: user.phone, company: user.company, jobTitle: user.jobTitle },
      token,
    };
  }

  async login(dto: LoginDto) {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const valid = await this.usersService.validatePassword(dto.password, user.passwordHash);
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    const id = user._id.toString();
    const token = this.jwtService.sign({ sub: id, email: user.email, role: user.role });
    return {
      user: { id, name: user.name, email: user.email, role: user.role, phone: user.phone, company: user.company, jobTitle: user.jobTitle },
      token,
    };
  }
}
