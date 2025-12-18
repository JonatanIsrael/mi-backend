import { Controller, Get, Post, Put, Delete, Body, Param } from '@nestjs/common';
import { UsuariosService } from './usuarios.service';
import { CrearUsuarioDto, LoginUsuarioDto, ActualizarUsuarioDto } from '../../dtos/usuario.dto';

@Controller('usuarios')
export class UsuariosController {
  constructor(private readonly usuariosService: UsuariosService) {}

  @Post('register')
  async crearUsuario(@Body() dto: CrearUsuarioDto) {
    const user = await this.usuariosService.crearUsuario(dto);
    
    return {
      message: 'Usuario creado correctamente',
      user: {
        id: user.id,
        usuario: user.usuario,
        nombre: user.nombre,
        apellido_p: user.apellido_p,
        apellido_m: user.apellido_m,
        correo: user.correo,
        rol: user.rol,
        fecha_registro: user.fecha_registro
      }
    };
  }

  @Post('login')
  async login(@Body() dto: LoginUsuarioDto) {
    const user = await this.usuariosService.login(dto);
    
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
      token: 'tu-token-jwt'
    };
  }

  @Put(':id')
  async actualizarUsuario(
    @Param('id') id: number,
    @Body() dto: ActualizarUsuarioDto,
  ) {
    const user = await this.usuariosService.actualizarUsuario(id, dto);
    
    return {
      message: 'Usuario actualizado correctamente',
      user: {
        id: user.id,
        usuario: user.usuario,
        nombre: user.nombre,
        apellido_p: user.apellido_p,
        apellido_m: user.apellido_m,
        correo: user.correo,
        rol: user.rol,
        fecha_registro: user.fecha_registro
      }
    };
  }

  @Get(':id')
  async encontrarPorId(@Param('id') id: number) {
    const user = await this.usuariosService.encontrarPorId(id);
    
    return {
      id: user.id,
      usuario: user.usuario,
      nombre: user.nombre,
      apellido_p: user.apellido_p,
      apellido_m: user.apellido_m,
      correo: user.correo,
      rol: user.rol,
      fecha_registro: user.fecha_registro
    };
  }

  @Get()
  async listar() {
    const usuarios = await this.usuariosService.listar();
    
    return usuarios.map(user => ({
      id: user.id,
      usuario: user.usuario,
      nombre: user.nombre,
      apellido_p: user.apellido_p,
      apellido_m: user.apellido_m,
      correo: user.correo,
      rol: user.rol,
      fecha_registro: user.fecha_registro
    }));
  }

  @Put(':id/rol')
  async cambiarRol(@Param('id') id: string, @Body() body: { rol: string }) {
    const user = await this.usuariosService.cambiarRol(+id, body.rol);
    
    return { 
      message: 'Rol actualizado con éxito', 
      user: {
        id: user.id,
        usuario: user.usuario,
        nombre: user.nombre,
        apellido_p: user.apellido_p,
        apellido_m: user.apellido_m,
        correo: user.correo,
        rol: user.rol,
        fecha_registro: user.fecha_registro
      }
    };
  }

  @Delete(':id')
  async eliminar(@Param('id') id: string) {
    await this.usuariosService.eliminarUsuario(+id);
    return { message: 'Usuario eliminado con éxito' };
  }
}