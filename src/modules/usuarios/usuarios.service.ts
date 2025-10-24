import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Usuario } from '../../entities/usuario.entity';
import {
  CrearUsuarioDto,
  LoginUsuarioDto,
  ActualizarUsuarioDto,
} from '../../dtos/usuario.dto';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class UsuariosService {
  constructor(
    @InjectRepository(Usuario)
    private readonly usuarioRepository: Repository<Usuario>,
  ) {}

  async crearUsuario(dto: CrearUsuarioDto): Promise<Usuario> {
    const { correo, usuario, contrasena } = dto;

    // Verificar duplicados en correo o usuario
    const existe = await this.usuarioRepository.findOne({
      where: [{ correo }, { usuario }],
    });

    if (existe) {
      throw new UnauthorizedException(
        'El correo o nombre de usuario ya está registrado.',
      );
    }

    const hash = await bcrypt.hash(contrasena, 10);
    const nuevoUsuario = this.usuarioRepository.create({
      ...dto,
      contrasena: hash,
    });

    return await this.usuarioRepository.save(nuevoUsuario);
  }

  async login(dto: LoginUsuarioDto): Promise<Usuario> {
    const { correo, usuario, contrasena } = dto;

    if (!correo && !usuario) {
      throw new BadRequestException(
        'Debe proporcionar un correo o un nombre de usuario.',
      );
    }

    // Construir condiciones para la búsqueda
    const conditions = [];
    if (correo) conditions.push({ correo });
    if (usuario) conditions.push({ usuario });

    const user = await this.usuarioRepository.findOne({
      where: conditions.length ? conditions : undefined,
    });

    if (!user) {
      throw new UnauthorizedException('Credenciales inválidas.');
    }

    const esValida = await bcrypt.compare(contrasena, user.contrasena);
    if (!esValida) {
      throw new UnauthorizedException('Credenciales inválidas.');
    }

    return user;
  }

  async encontrarPorId(id: number): Promise<Usuario> {
    const usuario_id = await this.usuarioRepository.findOne({ where: { id } });
    if (!usuario_id) throw new NotFoundException('Usuario no encontrado');
    return usuario_id;
  }

  async listar(): Promise<Usuario[]> {
    return await this.usuarioRepository.find();
  }

  async actualizarUsuario(
    id: number,
    dto: ActualizarUsuarioDto,
  ): Promise<Usuario> {
    const user = await this.encontrarPorId(id);

    if (dto.correo && dto.correo !== user.correo) {
      const existe = await this.usuarioRepository.findOne({
        where: { correo: dto.correo },
      });
      if (existe) {
        throw new UnauthorizedException('El correo ya está registrado.');
      }
    }

    Object.assign(user, dto);
    return await this.usuarioRepository.save(user);
  }

  async eliminarUsuario(id: number): Promise<void> {
    const user = await this.encontrarPorId(id);
    await this.usuarioRepository.remove(user);
  }

  async cambiarRol(id: number, nuevoRol: string): Promise<Usuario> {
    const rolesPermitidos = ['administrador', 'investigador', 'alumno'];
    if (!rolesPermitidos.includes(nuevoRol)) {
      throw new BadRequestException('Rol no válido');
    }

    const user = await this.encontrarPorId(id);
    user.rol = nuevoRol;
    return await this.usuarioRepository.save(user);
  }

  async buscarPorNombre(usuario: string): Promise<Usuario | null> {
    // Evitar null en el array para TypeScript
    const conditions = [{ correo: usuario }, { usuario }];
    const user = await this.usuarioRepository.findOne({
      where: conditions,
    });
    return user || null;
  }

  // 🔹 Buscar usuario por correo
async encontrarPorCorreo(correo: string): Promise<Usuario> {
  const usuario = await this.usuarioRepository.findOne({ where: { correo } });
  if (!usuario) {
    throw new NotFoundException(`Usuario con correo ${correo} no encontrado`);
  }
  return usuario;
}

}
