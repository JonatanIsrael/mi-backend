import { Controller, Get, Post, Body, Param, Put, Delete } from '@nestjs/common';
import { UsuariosService } from './usuarios.service';
import { CrearUsuarioDto, LoginUsuarioDto, ActualizarUsuarioDto } from '../../dtos/usuario.dto';

@Controller('usuarios')
export class UsuariosController {
  constructor(private readonly usuariosService: UsuariosService) {}

  @Post('register')
  async crear(@Body() dto: CrearUsuarioDto) {
    const user = await this.usuariosService.crearUsuario(dto);
    return { message: 'Usuario registrado con éxito', user };
  }

  @Post('login')
  async login(@Body() dto: LoginUsuarioDto) {
    const user = await this.usuariosService.login(dto);
    return { message: 'Inicio de sesión exitoso', user };
  }

  @Get(':id')
  async obtenerPorId(@Param('id') id: string) {
    // convierto id a number para que coincida con el tipo que espera el service
    return await this.usuariosService.encontrarPorId(+id);
  }

  @Get()
  async listar() {
    return await this.usuariosService.listar();
  }

  @Put(':id')
  async actualizar(@Param('id') id: string, @Body() dto: ActualizarUsuarioDto) {
    const user = await this.usuariosService.actualizarUsuario(+id, dto);
    return { message: 'Usuario actualizado con éxito', user };
  }

  @Put(':id/rol')
  async cambiarRol(@Param('id') id: string, @Body() body: { rol: string }) {
    const user = await this.usuariosService.cambiarRol(+id, body.rol);
    return { message: 'Rol actualizado con éxito', user };
  }

  @Delete(':id')
  async eliminar(@Param('id') id: string) {
    await this.usuariosService.eliminarUsuario(+id);
    return { message: 'Usuario eliminado con éxito' };
  }
}
