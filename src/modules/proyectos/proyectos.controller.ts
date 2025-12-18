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
  ParseIntPipe,
} from '@nestjs/common';
import type { Request as ExpressRequest, Response as ExpressResponse } from 'express';
import { ProyectosService } from './proyectos.service';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { CrearProyectoCompletoDto } from '../../dtos/proyecto.dto';
import { RolEquipo } from '../../entities/equipo.entity';
import * as ExcelJS from 'exceljs';
import { ComentariosService } from './comentarios.service';
import { CrearComentarioDto } from '../../dtos/comentario.dto';
import { StreamableFile } from '@nestjs/common';
@Controller('proyectos')
export class ProyectosController {
  constructor(
    private readonly proyectosService: ProyectosService,
    private readonly comentariosService: ComentariosService,
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

   
    if (!dto.fechaInicio || !dto.fechaFin) {
      throw new HttpException('fechaInicio y fechaFin son requeridos', HttpStatus.BAD_REQUEST);
    }

    const data = await this.proyectosService.crearProyectoCompleto({ ...dto, userId });
    return { success: true, proyecto: data };
  } catch (error: any) {
    console.error('ERROR en crearProyectoCompleto:', error);
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
  @Res() res: ExpressResponse,
) {
  try {
    const userId = req.user?.id;
    const proyecto = await this.proyectosService.obtenerProyectosConLecturas(+id, userId);

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Proyecto');
    
    
    const header = ['Fecha Registro', 'Tratamiento', 'Repetición', 'Muestra', ...proyecto.variablesDependientes.map((v: any) => `${v.clave} (${v.unidad})`)];
    sheet.addRow(header);

  
    const formatLocalDate = (fechaStr: string): string => {
      if (!fechaStr) return '';
      
      
      if (/^\d{4}-\d{2}-\d{2}$/.test(fechaStr)) {
        return fechaStr;
      }
      
      if (typeof fechaStr === 'string') {
        if (fechaStr.includes('T')) {
          const [datePart] = fechaStr.split('T');
          return datePart;
        } else if (fechaStr.includes('/')) {
          const [day, month, year] = fechaStr.split('/');
          return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
        }
      }
      
      const fecha = new Date(fechaStr);
      const fechaCompensada = new Date(fecha.getTime() + (fecha.getTimezoneOffset() * 60000));
      const year = fechaCompensada.getFullYear();
      const month = String(fechaCompensada.getMonth() + 1).padStart(2, '0');
      const day = String(fechaCompensada.getDate()).padStart(2, '0');
      
      return `${year}-${month}-${day}`;
    };

    proyecto.tratamientos.forEach((t: any) => {
      t.repeticiones.forEach((r: any) => {
        r.muestras.forEach((m: any) => {
          m.lecturas.forEach((l: any) => {
            if (l.fechaLectura) {
              const fechaStr = formatLocalDate(l.fechaLectura);
              
              const existingRow = this.findRow(sheet, t.nombre, r.numero, m.numero, fechaStr);
              
              if (existingRow) {
                const variableIndex = proyecto.variablesDependientes.findIndex((v: any) => v.id === l.variableDependiente?.id);
                if (variableIndex !== -1) {
                  existingRow.getCell(5 + variableIndex).value = l.valor || 0;
                }
              } else {
                const rowData = [
                  fechaStr,
                  t.nombre,
                  r.numero,
                  m.numero,
                  ...proyecto.variablesDependientes.map((v: any) => {
                    return l.variableDependiente?.id === v.id ? (l.valor || 0) : 0;
                  })
                ];
                sheet.addRow(rowData);
              }
            }
          });
        });
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();
    
    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename=Proyecto-${id}.xlsx`
    });

    res.end(Buffer.from(buffer));
    
  } catch (error: any) {
    console.error('Error exportando Excel:', error);
    throw new HttpException(
      error.message || 'Error al exportar Excel',
      error.status || HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }
}

private findRow(sheet: ExcelJS.Worksheet, tratamiento: string, repeticion: number, muestra: number, fecha: string): ExcelJS.Row | null {
  for (let i = 2; i <= sheet.rowCount; i++) {
    const row = sheet.getRow(i);
    if (row.getCell(1).value === fecha &&
        row.getCell(2).value === tratamiento &&
        row.getCell(3).value === repeticion &&
        row.getCell(4).value === muestra) {
      return row;
    }
  }
  return null;
}

@Post(':id/generar-pdf')
@UseGuards(JwtAuthGuard)
async generarPDF(
  @Param('id', ParseIntPipe) proyectoId: number,
  @Body() body: { fechas: string[] },
  @Request() req: ExpressRequest & { user: { id: number }}
) {
  const userId = req.user.id;
  
  const pdfBuffer = await this.proyectosService.generarPDFProyecto(
    proyectoId, 
    userId, 
    body.fechas
  );

  const filename = `Proyecto-${proyectoId}-${new Date().toISOString().split('T')[0]}.pdf`;

  return new StreamableFile(pdfBuffer, {
    type: 'application/pdf',
    disposition: `attachment; filename="${filename}"`,
  });
}

  @Post(':id/compartir')
  @UseGuards(JwtAuthGuard)
  async compartirProyecto(
    @Param('id') id: string,
    @Body() body: { correo?: string; usuario?: string; rol?: string; usuarioId?: number },
    @Request() req: ExpressRequest & { user: { id: number } },
  ) {
    const puedeEditar = await this.proyectosService.puedeEditarProyecto(req.user.id, +id);
    if (!puedeEditar) throw new HttpException('No autorizado para compartir', HttpStatus.FORBIDDEN);

    const rol = body.rol === 'responsable' ? RolEquipo.RESPONSABLE : RolEquipo.COLABORADOR;
    const usuarioQueComparteId = req.user.id;

    let equipo;
    if (body.correo) {
      equipo = await this.proyectosService.agregarColaboradorPorCorreo(
        +id, 
        body.correo, 
        rol, 
        usuarioQueComparteId 
      );
    } else if (body.usuario) {
      equipo = await this.proyectosService.agregarColaboradorPorUsuario(
        +id, 
        body.usuario, 
        rol, 
        usuarioQueComparteId 
      );
    } else if (body.usuarioId) {
      equipo = await this.proyectosService.agregarColaborador(
        +id, 
        body.usuarioId, 
        rol, 
        usuarioQueComparteId 
      );
    } else {
      throw new HttpException('Debe enviar correo, usuario o usuarioId', HttpStatus.BAD_REQUEST);
    }

    return { success: true, equipo };
  }

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

@Get(':id/resumen-estadistico')
@UseGuards(JwtAuthGuard)
async obtenerResumenEstadistico(
  @Param('id') id: string,
  @Request() req: ExpressRequest & { user: { id: number } }
) {
  try {
    const userId = req.user?.id;
    const resumen = await this.proyectosService.obtenerResumenEstadistico(+id, userId);
    return { success: true, ...resumen };
  } catch (error: any) {
    throw new HttpException(
      error.message || 'Error al obtener resumen estadístico',
      error.status || HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }
}

@Post(':id/exportar-resumen-pdf')
@UseGuards(JwtAuthGuard)
async exportarResumenPDF(
  @Param('id', ParseIntPipe) proyectoId: number,
  @Body() body: { resumen: any[]; proyecto: any },
  @Request() req: ExpressRequest & { user: { id: number } }
) {
  const userId = req.user.id;
  
  const pdfBuffer = await this.proyectosService.generarResumenEstadisticoPDF(
    proyectoId, 
    userId, 
    body
  );

  const filename = `Resumen-Estadistico-${body.proyecto.nombre}-${new Date().toISOString().split('T')[0]}.pdf`;

  return new StreamableFile(pdfBuffer, {
    type: 'application/pdf',
    disposition: `attachment; filename="${filename}"`,
  });
}

@Post(':id/generar-resumen-pdf')
@UseGuards(JwtAuthGuard)
async generarResumenPDF(
  @Param('id', ParseIntPipe) proyectoId: number,
  @Body() body: { resumenData: any },  
  @Request() req: ExpressRequest & { user: { id: number } }
) {
  try {
    
    const userId = req.user.id;
    
    const pdfBuffer = await this.proyectosService.generarResumenEstadisticoPDF(
      proyectoId, 
      userId, 
      body  
    );

    const filename = `Resumen-Estadistico-${new Date().toISOString().split('T')[0]}.pdf`;

    return new StreamableFile(pdfBuffer, {
      type: 'application/pdf',
      disposition: `attachment; filename="${filename}"`,
    });
  } catch (error: any) {
    throw new HttpException(
      error.message || 'Error al generar PDF del resumen',
      error.status || HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }
}
}