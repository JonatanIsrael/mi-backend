import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Usuario } from '../../entities/usuario.entity';
import { CrearUsuarioDto, LoginUsuarioDto } from '../../dtos/usuario.dto';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class UsuariosService {
  constructor(
    @InjectRepository(Usuario)
    private readonly usuarioRepository: Repository<Usuario>,
  ) {}

  async crearUsuario(dto: CrearUsuarioDto): Promise<Usuario> {
    const { correo, contrasena } = dto;
    const existe = await this.usuarioRepository.findOne({ 
      where: [
        { correo },
        { nombre: dto.nombre } // También verificar que el nombre no exista
      ] 
    });

    if (existe) {
      throw new UnauthorizedException('El correo o nombre de usuario ya está registrado.');
    }

    const hash = await bcrypt.hash(contrasena, 10);
    const nuevoUsuario = this.usuarioRepository.create({
      ...dto,
      contrasena: hash,
    });

    return await this.usuarioRepository.save(nuevoUsuario);
  }

  async login(dto: LoginUsuarioDto): Promise<Usuario> {
    const { correo, contrasena } = dto;
    
    // Buscar por correo O por nombre de usuario
    const usuario = await this.usuarioRepository.findOne({
      where: [
        { correo }, // Buscar por correo
        { nombre: correo } // También buscar por nombre (usando el mismo campo)
      ]
    });

    if (!usuario) {
      throw new UnauthorizedException('Credenciales inválidas.');
    }

    const esValida = await bcrypt.compare(contrasena, usuario.contrasena);
    if (!esValida) {
      throw new UnauthorizedException('Credenciales inválidas.');
    }

    return usuario;
  }


  async encontrarPorId(id: number): Promise<Usuario> {
    const usuario = await this.usuarioRepository.findOne({ where: { id } });
    if (!usuario) throw new NotFoundException('Usuario no encontrado');
    return usuario;
  }

  async listar(): Promise<Usuario[]> {
    return await this.usuarioRepository.find();
  }
}
