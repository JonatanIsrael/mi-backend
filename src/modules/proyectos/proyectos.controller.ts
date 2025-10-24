import {
  Controller,
  Get,
  Post,
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
      if (!userId) {
        throw new HttpException('No autorizado', HttpStatus.UNAUTHORIZED);
      }

      const data = await this.proyectosService.crearProyectoCompleto({
        ...dto,
        userId,
      });

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
    if (!userId) {
      throw new HttpException('No autorizado', HttpStatus.UNAUTHORIZED);
    }

    return this.proyectosService.obtenerProyectosParaCard(userId);
  }

  @Get(':id/lecturas')
  @UseGuards(JwtAuthGuard)
  async obtenerLecturas(
    @Param('id') id: string,
    @Request() req: ExpressRequest & { user: { id: number } },
  ) {
    const userId = req.user?.id;
    if (!userId) {
      throw new HttpException('No autorizado', HttpStatus.UNAUTHORIZED);
    }

    const proyecto = await this.proyectosService.obtenerProyectosConLecturas(+id, userId);

    if (!proyecto) {
      throw new HttpException('Proyecto no encontrado', HttpStatus.NOT_FOUND);
    }

    return proyecto;
  }

  @Get(':id/exportar')
  @UseGuards(JwtAuthGuard)
  async exportarMatriz(
    @Param('id') id: string,
    @Request() req: ExpressRequest & { user: { id: number } },
    @Res({ passthrough: true }) res: ExpressResponse,
  ) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new HttpException('No autorizado', HttpStatus.UNAUTHORIZED);
      }

      const buffer = await this.proyectosService.exportarMatriz(parseInt(id), userId);

      res.set({
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename=matriz_proyecto_${id}.xlsx`,
      });

      return res.send(buffer);
    } catch (error: any) {
      throw new HttpException(
        error.message || 'Error al exportar la matriz',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('test-db')
  async testDB() {
    try {
      const proyectos = await this.proyectosService.obtenerTodos();
      return { success: true, proyectos };
    } catch (error: any) {
      throw new HttpException(
        'Error al conectar con la base de datos: ' + error.message,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
