import {
  Controller,
  Get,
  Query,
  Res,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { ReportesService } from './reportes.service';
import { Response } from 'express';

@Controller('reportes')
export class ReportesController {
  constructor(private readonly reportesService: ReportesService) {}

  // PDF DE LECTURAS
  @Get('lecturas/pdf')
  async generarPdfLecturas(
    @Query('inicio') inicio: string,
    @Query('fin') fin: string,
    @Res() res: Response,
  ) {
    try {
      const buffer = await this.reportesService.generarPdfLecturas(inicio, fin);

      const filename = `reporte_lecturas_${inicio}_a_${fin}.pdf`;

      res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': buffer.length,
      });

      res.send(buffer);
    } catch (error) {
      console.error('Error generando PDF:', error);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException('Error generando el PDF');
    }
  }

  // EXCEL DE CALENDARIO
  @Get('calendario/excel')
  async generarExcelCalendario(
    @Query('inicio') inicio: string,
    @Query('fin') fin: string,
    @Res() res: Response,
  ) {
    try {
      const data = await this.reportesService.generarExcelCalendario(inicio, fin);
      const buffer = Buffer.from(data); // Forzar Buffer

      const filename = `calendario_${inicio}_a_${fin}.xlsx`;

      res.set({
        'Content-Type':
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': buffer.length,
      });

      res.send(buffer);
    } catch (error) {
      console.error('Error generando Excel:', error);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException('Error generando el archivo Excel');
    }
  }
} // <-- ESTA ES LA LLAVE QUE FALTABA