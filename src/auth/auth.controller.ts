import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  async login(@Body() body: { nombre: string; contrasena: string }) {
    return this.authService.login(body.nombre, body.contrasena);
  }
}
