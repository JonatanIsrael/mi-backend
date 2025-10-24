import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Request,
  HttpException,
  HttpStatus,
  UseGuards,
  Res,
} from '@nestjs/common';
import type { Request as ExpressRequest, Response as ExpressResponse } from 'express';
import { ProyectosService } from './proyectos.service';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { CrearProyectoCompletoDto } from '../../dtos/proyecto.dto';
import { RolEquipo } from '../../entities/equipo.entity';

@Controller('proyectos')
export class ProyectosController {
  constructor(private readonly proyectosService: ProyectosService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  async crearProyectoCompleto(
    @Body() dto: CrearProyectoCompletoDto,
    @Request() req: ExpressRequest & { user: { id: number } },
  ) {
    try {
      const userId = req.user?.id;
      if (!userId) throw new HttpException('No autorizado', HttpStatus.UNAUTHORIZED);

      const data = await this.proyectosService.crearProyectoCompleto({ ...dto, userId });
      return { success: true, proyecto: data.proyecto };
    } catch (error: any) {
      throw new HttpException(
        error.message || 'Error al crear el proyecto',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('mis-proyectos')
  @UseGuards(JwtAuthGuard)
  async obtenerMisProyectos(@Request() req: ExpressRequest & { user: { id: number } }) {
    const userId = req.user?.id;
    if (!userId) throw new HttpException('No autorizado', HttpStatus.UNAUTHORIZED);

    return this.proyectosService.obtenerProyectosParaCard(userId);
  }

  @Get(':id/lecturas')
  @UseGuards(JwtAuthGuard)
  async obtenerLecturas(@Param('id') id: string, @Request() req: ExpressRequest & { user: { id: number } }) {
    const userId = req.user?.id;
    if (!userId) throw new HttpException('No autorizado', HttpStatus.UNAUTHORIZED);

    const proyecto = await this.proyectosService.obtenerProyectosConLecturas(+id, userId);
    if (!proyecto) throw new HttpException('Proyecto no encontrado', HttpStatus.NOT_FOUND);

    return proyecto;
  }

  @Put('lecturas')
  @UseGuards(JwtAuthGuard)
  async actualizarVariasLecturas(@Body() body: { lecturas: { id: number; valor: number }[] }) {
    return this.proyectosService.actualizarLecturas(body.lecturas);
  }

  @Put('lecturas/:id')
  @UseGuards(JwtAuthGuard)
  async actualizarLectura(@Param('id') id: string, @Body() body: { valor: number }) {
    return this.proyectosService.actualizarLectura(+id, body.valor);
  }

  @Get(':id/exportar')
  @UseGuards(JwtAuthGuard)
  async exportarExcel(
    @Param('id') id: string,
    @Request() req: ExpressRequest & { user: { id: number } },
    @Res({ passthrough: true }) res: ExpressResponse,
  ) {
    try {
      const userId = req.user?.id;
      const buffer = await this.proyectosService.exportarProyectoExcel(+id, userId);

      res.set({
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename=Proyecto-${id}.xlsx`,
      });

      return res.send(buffer);
    } catch (error: any) {
      throw new HttpException(
        error.message || 'Error al exportar Excel',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // 🔹 Compartir proyecto
  // 🔹 Compartir proyecto por correo
@Post(':id/compartir')
@UseGuards(JwtAuthGuard)
async compartirProyecto(
  @Param('id') id: string,
  @Body() body: { correo: string; rol?: string },
  @Request() req: ExpressRequest & { user: { id: number } }
) {
  const puedeEditar = await this.proyectosService.puedeEditarProyecto(req.user.id, +id);
  if (!puedeEditar) throw new HttpException('No autorizado para compartir', HttpStatus.FORBIDDEN);

  const rol = body.rol === 'responsable' ? RolEquipo.RESPONSABLE : RolEquipo.COLABORADOR;
  const equipo = await this.proyectosService.agregarColaboradorPorCorreo(+id, body.correo, rol);
  return { success: true, equipo };
}

@Get('compartidos')
@UseGuards(JwtAuthGuard)
async proyectosCompartidos(@Request() req: ExpressRequest & { user: { id: number } }) {
  const userId = req.user.id
  return this.proyectosService.obtenerProyectosCompartidos(userId)
}

@Get('admin/usuarios')
@UseGuards(JwtAuthGuard)
async obtenerUsuarios() {
  // Esto debería traer los usuarios con sus proyectos si quieres
  return this.proyectosService.obtenerUsuariosConProyectos();
}

@Get('admin/proyectos/:userId')
@UseGuards(JwtAuthGuard)
async obtenerProyectosUsuario(
  @Param('userId') userId: string,
  @Request() req: ExpressRequest & { user: { id: number } }
) {
  const actualUserId = req.user.id;
  return this.proyectosService.obtenerProyectosPorUsuario(actualUserId, +userId);
}

}
