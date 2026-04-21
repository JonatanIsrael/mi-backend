import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsuariosService } from '../modules/usuarios/usuarios.service';
import * as bcrypt from 'bcrypt';
import { LoginUsuarioDto } from '../dtos/usuario.dto';
import * as jwt from 'jsonwebtoken';
import { MailerService } from '@nestjs-modules/mailer';
import { randomBytes } from 'crypto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Usuario } from '../entities/usuario.entity';
@Injectable()
export class AuthService {
  constructor(private readonly usuariosService: UsuariosService,
    private readonly jwtService: JwtService,
    private readonly mailerService:MailerService,

    @InjectRepository(Usuario)
    private userRepo:Repository<Usuario>
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
        fecha_registro: user.fecha_registro
      },
      token,
    };
  }

  async forgotPassword(correo:string){

    const user=
    await this.userRepo.findOne({
    where:{correo}
    });

    if(!user){

    return{
      message:
    'Si existe la cuenta se enviará correo'
    };

    }

    const token=
    randomBytes(32).toString('hex');

    user.resetToken=token;

    user.resetTokenExpires=
    new Date(
    Date.now()+15*60*1000
    );

    await this.userRepo.save(user);

    await this.mailerService.sendMail({

    to:user.correo,

    subject:
    'Recuperación de contraseña',

    html:`

    <h2>Restablecer contraseña</h2>

    <a href="
    http://localhost:5173/reset-password?token=${token}
    ">

    Cambiar contraseña

    </a>

    `

    });

    return{
    message:'Correo enviado'
    };

  }

  async resetPassword(body: {
    token: string;
    password: string;
  }
){

    const user=
    await this.userRepo.findOne({

    where:{
      resetToken:body.token
    }

    });

    if(
    !user ||
    !user.resetTokenExpires ||
    user.resetTokenExpires < new Date()
    ){

    throw new Error(
      'Token inválido o expirado'
    );

    }

    user.contrasena=
    await bcrypt.hash(
    body.password,
    10
    );

    user.resetToken=null;

    user.resetTokenExpires=null;

    await this.userRepo.save(user);

    return{
    message:
    'Contraseña actualizada'
    };

  }
}