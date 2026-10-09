import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  private readonly username = 'johndoe';
  private readonly password = 'susiairtest';

  constructor(private readonly jwtService: JwtService) {}

  async login(dto: LoginDto): Promise<{ access_token: string }> {
    if (dto.username !== this.username || dto.password !== this.password) {
      throw new UnauthorizedException('Invalid username or password');
    }

    const accessToken = await this.jwtService.signAsync({
      sub: 'pilot-1',
      username: this.username,
    });

    return { access_token: accessToken };
  }
}
