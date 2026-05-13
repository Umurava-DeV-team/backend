import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UsersService } from './users.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly usersService: UsersService,
    config: ConfigService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get<string>('JWT_SECRET') ?? 'fallback_secret',
    });
  }

  async validate(payload: { sub: string; email: string; role: string }) {
    try {
      const user = await this.usersService.findById(payload.sub);
      return { id: user.id, email: user.email, role: user.role, name: user.name, company: user.company };
    } catch {
      throw new UnauthorizedException();
    }
  }
}
