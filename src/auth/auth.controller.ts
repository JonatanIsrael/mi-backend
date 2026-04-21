import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginUsuarioDto } from '../dtos/usuario.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(@Body() dto: LoginUsuarioDto) {
    return this.authService.login(dto);
  }
  
  @Post('forgot-password')
  async forgotPassword(
  @Body('correo') correo:string
  ){
  return this.authService
  .forgotPassword(correo);
  }

  @Post('reset-password')
  async resetPassword(
  @Body() body: {
    token: string;
    password:string;
  }
  ){
  return this.authService
  .resetPassword(body);
  }
}
