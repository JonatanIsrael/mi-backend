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
import { ComentariosService } from './comentarios.service';
import { CrearComentarioDto } from '../../dtos/comentario.dto'; // CORREGIDO

@Controller('proyectos')
export class ProyectosController {
  constructor(
    private readonly proyectosService: ProyectosService,
    private readonly comentariosService: ComentariosService, // NUEVO 
) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  async crearProyectoCompleto(
    @Body() dto: CrearProyectoCompletoDto,
    @Request() req: ExpressRequest & { user: { id: number } },
  ) {
    try {
      const userId = req.user?.id;
      if (!userId) throw new HttpException('No autorizado', HttpStatus.UNAUTHORIZED);

      // NORMALIZAR FECHAS: DD/MM/YYYY → YYYY-MM-DD, y compensar desfase +1 día
      const parseFecha = (fechaStr: string): string => {
        let date: Date;
        if (/^\d{4}-\d{2}-\d{2}$/.test(fechaStr)) {
          const [y, m, d] = fechaStr.split('-').map(Number);
          date = new Date(y, m - 1, d);
        } else {
          const [d, m, y] = fechaStr.split('/').map(Number);
          date = new Date(y, m - 1, d);
        }
        if (isNaN(date.getTime())) throw new Error('Formato de fecha inválido');
        date.setDate(date.getDate() + 1); // Compensar desfase de zona horaria
        const y = date.getFullYear();
        const mStr = String(date.getMonth() + 1).padStart(2, '0');
        const dStr = String(date.getDate()).padStart(2, '0');
        return `${y}-${mStr}-${dStr}`;
      };

      const normalizedDto = {
        ...dto,
        fechaInicio: parseFecha(dto.fechaInicio),
        fechaFin: parseFecha(dto.fechaFin),
      };

      const data = await this.proyectosService.crearProyectoCompleto({ ...normalizedDto, userId });
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
      const header = ['FechaRegistro', 'Tratamiento', 'Repetición', 'Muestra', ...proyecto.variablesDependientes.map((v: any) => v.clave)];
      sheet.addRow(header);

      // PARSEAR FECHAS DE DB A LOCAL
      const parseDBDate = (dateStr: string): Date => {
        const [year, month, day] = dateStr.split('-').map(Number);
        return new Date(year, month - 1, day);
      };

      const startDate = parseDBDate(proyecto.fechaInicio);
      const endDate = parseDBDate(proyecto.fechaFin);
      const intervalo = 7;

      const dates: Date[] = [];
      for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + intervalo)) {
        dates.push(new Date(d));
      }

      // FORMATEAR LOCAL
      const formatLocalDate = (date: Date): string => {
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
      };

      const datesAreEqual = (date1: Date, date2: Date): boolean => {
        return formatLocalDate(date1) === formatLocalDate(date2);
      };

      proyecto.tratamientos.forEach((t: any) => {
        t.repeticiones.forEach((r: any) => {
          r.muestras.forEach((m: any) => {
            dates.forEach((date) => {
              const fechaRegistro = formatLocalDate(date);
              const rowData = [
                fechaRegistro,
                t.nombre,
                r.numero,
                m.numero,
                ...proyecto.variablesDependientes.map((v: any) => {
                  const lectura = m.lecturas.find((l: any) => {
                    if (!l.fechaLectura) return false;
                    const lecturaDateStr = new Date(l.fechaLectura).toISOString().split('T')[0];
                    const lecturaDate = parseDBDate(lecturaDateStr);
                    return datesAreEqual(lecturaDate, date) && l.variableDependiente?.id === v.id;
                  });
                  return lectura ? lectura.valor : 0;
                }),
              ];
              sheet.addRow(rowData);
            });
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

// === RUTAS DE COMENTARIOS ===
@Post(':id/comentarios')
@UseGuards(JwtAuthGuard)
async crearComentario(
  @Param('id') proyectoId: string,
  @Body() dto: CrearComentarioDto,
  @Request() req: ExpressRequest & { user: { id: number } },
) {
  try {
    const comentario = await this.comentariosService.crearComentario(
      +proyectoId,
      req.user.id,
      dto,
    );
    return { success: true, comentario };
  } catch (error: any) {
    throw new HttpException(
      error.message || 'Error al crear comentario',
      error.status || HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }
}

@Get(':id/comentarios')
@UseGuards(JwtAuthGuard)
async obtenerComentariosProyecto(
  @Param('id') proyectoId: string,
  @Request() req: ExpressRequest & { user: { id: number } },
) {
  try {
    const comentarios = await this.comentariosService.obtenerComentarios(
      +proyectoId,
      req.user.id,
    );
    return { success: true, comentarios };
  } catch (error: any) {
    throw new HttpException(
      error.message || 'Error al obtener comentarios',
      error.status || HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }
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