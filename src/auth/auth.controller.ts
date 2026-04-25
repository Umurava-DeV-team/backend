import { Body, Controller, Get, Post, UseGuards, Request } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { LoginDto, RegisterCandidateDto, RegisterRecruiterDto, UserRole } from './auth.dto';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register/candidate')
  @ApiOperation({ summary: 'Register a candidate account' })
  registerCandidate(@Body() dto: RegisterCandidateDto) {
    return this.authService.register({
      name: dto.name,
      email: dto.email,
      password: dto.password,
      role: UserRole.CANDIDATE,
    });
  }

  @Post('register/recruiter')
  @ApiOperation({ summary: 'Register a recruiter account' })
  registerRecruiter(@Body() dto: RegisterRecruiterDto) {
    return this.authService.register({
      name: dto.name,
      email: dto.email,
      password: dto.password,
      role: UserRole.RECRUITER,
      company: dto.company,
    });
  }

  @Post('login')
  @ApiOperation({ summary: 'Login and receive a JWT token' })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Get current authenticated user' })
  me(@Request() req: any) {
    // req.user is set by JwtStrategy.validate() — { id, email, role, name }
    return {
      id: req.user.id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
      company: req.user.company,
    };
  }
}
