import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { UsuariosService } from '../modules/usuarios/usuarios.service';

@Injectable()
export class AuthService {
  constructor(
    private usuariosService: UsuariosService,
    private jwtService: JwtService
  ) {}

  async login(nombre: string, contrasena: string) {
    const usuario = await this.usuariosService.buscarPorNombre(nombre);
    if (!usuario) throw new UnauthorizedException('Usuario no encontrado');

    const valid = await bcrypt.compare(contrasena, usuario.contrasena);
    if (!valid) throw new UnauthorizedException('Contraseña incorrecta');

    const payload = { sub: usuario.id, rol: usuario.rol };
    const token = this.jwtService.sign(payload);
    
    return {
      access_token: token,
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        rol: usuario.rol,
      },
    };
  }
}

