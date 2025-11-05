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
import * as ExcelJS from 'exceljs';

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
      return { success: true, proyecto: data };
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
  async obtenerLecturas(
    @Param('id') id: string,
    @Request() req: ExpressRequest & { user: { id: number } },
  ) {
    try {
      const userId = req.user?.id;
      if (!userId) throw new HttpException('No autorizado', HttpStatus.UNAUTHORIZED);
      const proyecto = await this.proyectosService.obtenerProyectosConLecturas(+id, userId);
      return proyecto;
    } catch (error: any) {
      throw new HttpException(error.message || 'Error al obtener lecturas', error.status || HttpStatus.INTERNAL_SERVER_ERROR);
    }
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
      const proyecto = await this.proyectosService.obtenerProyectosConLecturas(+id, userId);

      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet('Proyecto');

      const header = ['FechaRegistro','Tratamiento', 'Repetición', 'Muestra', ...proyecto.variablesDependientes.map((v: any) => v.clave)];
      sheet.addRow(header);

      // recorrer fechas + tratamientos para poblar filas (si usas fechas agrupadas, se puede adaptar)
      // Aquí simplificamos y generamos filas por cada muestra basadas en la estructura limpia:
      proyecto.tratamientos.forEach((t: any) => {
        t.repeticiones.forEach((r: any) => {
          r.muestras.forEach((m: any) => {
            const row = [
              (m.lecturas && m.lecturas[0]) ? (m.lecturas[0].fechaLectura ? new Date(m.lecturas[0].fechaLectura).toISOString().split('T')[0] : '') : '',
              t.nombre,
              r.numero,
              m.numero,
              ...proyecto.variablesDependientes.map((v: any) => {
                const lect = (m.lecturas || []).find((lx: any) => lx.variableDependiente?.id === v.id);
                return lect ? lect.valor : 0;
              }),
            ];
            sheet.addRow(row);
          });
        });
      });

      const buffer = await workbook.xlsx.writeBuffer();
      res.set({
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename=Proyecto-${id}.xlsx`,
      });

      return res.send(Buffer.from(buffer));
    } catch (error: any) {
      throw new HttpException(
        error.message || 'Error al exportar Excel',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Compartir proyecto (por correo o usuario)
  @Post(':id/compartir')
  @UseGuards(JwtAuthGuard)
  async compartirProyecto(
    @Param('id') id: string,
    @Body() body: { correo?: string; usuario?: string; rol?: string },
    @Request() req: ExpressRequest & { user: { id: number } },
  ) {
    const puedeEditar = await this.proyectosService.puedeEditarProyecto(req.user.id, +id);
    if (!puedeEditar) throw new HttpException('No autorizado para compartir', HttpStatus.FORBIDDEN);

    const rol = body.rol === 'responsable' ? RolEquipo.RESPONSABLE : RolEquipo.COLABORADOR;

    let equipo;
    if (body.correo) {
      equipo = await this.proyectosService.agregarColaboradorPorCorreo(+id, body.correo, rol);
    } else if (body.usuario) {
      equipo = await this.proyectosService.agregarColaboradorPorUsuario(+id, body.usuario, rol);
    } else {
      throw new HttpException('Debe enviar correo o usuario', HttpStatus.BAD_REQUEST);
    }

    return { success: true, equipo };
  }

  @Get('compartidos')
  @UseGuards(JwtAuthGuard)
  async proyectosCompartidos(@Request() req: ExpressRequest & { user: { id: number } }) {
    const userId = req.user.id;
    return this.proyectosService.obtenerProyectosCompartidos(userId);
  }

  @Get('admin/usuarios')
  @UseGuards(JwtAuthGuard)
  async obtenerUsuarios() {
    return this.proyectosService.obtenerUsuariosConProyectos();
  }

  @Get('admin/proyectos/:userId')
  @UseGuards(JwtAuthGuard)
  async obtenerProyectosUsuario(
    @Param('userId') userId: string,
    @Request() req: ExpressRequest & { user: { id: number } },
  ) {
    const actualUserId = req.user.id;
    return this.proyectosService.obtenerProyectosPorUsuario(actualUserId, +userId);
  }
}
