import { Injectable, NotFoundException, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Usuario } from '../../entities/usuario.entity';
import { CrearUsuarioDto, LoginUsuarioDto, ActualizarUsuarioDto } from '../../dtos/usuario.dto';
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

async actualizarUsuario(id: number, dto: ActualizarUsuarioDto): Promise<Usuario> {
    const usuario = await this.encontrarPorId(id);
    
    if (dto.correo && dto.correo !== usuario.correo) {
      const existe = await this.usuarioRepository.findOne({ 
        where: { correo: dto.correo } 
      });
      if (existe) {
        throw new UnauthorizedException('El correo ya está registrado.');
      }
    }

    Object.assign(usuario, dto);
    return await this.usuarioRepository.save(usuario);
  }

  async eliminarUsuario(id: number): Promise<void> {
    const usuario = await this.encontrarPorId(id);
    await this.usuarioRepository.remove(usuario);
  }

  async cambiarRol(id: number, nuevoRol: string): Promise<Usuario> {
    const rolesPermitidos = ['administrador', 'investigador', 'alumno'];
    if (!rolesPermitidos.includes(nuevoRol)) {
      throw new BadRequestException('Rol no válido');
    }

    const usuario = await this.encontrarPorId(id);
    usuario.rol = nuevoRol;
    return await this.usuarioRepository.save(usuario);
  }

  async buscarPorNombre(nombre: string): Promise<Usuario | null> {
    return await this.usuarioRepository.findOne({
      where: [
        { correo: nombre},
        {nombre},
      ]
    })
  }
}
