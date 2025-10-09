import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { UsuariosService } from './usuarios.service';
import { CrearUsuarioDto, LoginUsuarioDto } from '../../dtos/usuario.dto';

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
}
