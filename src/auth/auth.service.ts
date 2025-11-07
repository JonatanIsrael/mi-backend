import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsuariosService } from '../modules/usuarios/usuarios.service';
import * as bcrypt from 'bcrypt';
import { LoginUsuarioDto } from '../dtos/usuario.dto';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class AuthService {
  constructor(private readonly usuariosService: UsuariosService,
    private readonly jwtService: JwtService,
  ) {}

  async login(dto: LoginUsuarioDto) {
    const user = await this.usuariosService.login(dto);

    const token = this.jwtService.sign({ id: user.id, rol: user.rol });

    return {
      message: 'Login exitoso',
      user: {
        id: user.id,
        usuario: user.usuario,
        nombre: user.nombre,
        apellido_p: user.apellido_p,
        apellido_m: user.apellido_m,
        correo: user.correo,
        rol: user.rol,
      },
      token,
    };
  }
}


