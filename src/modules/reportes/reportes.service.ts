// src/modules/reportes/reportes.service.ts
import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Lectura } from '../../entities/lectura.entity';
import { Calendario } from '../../entities/calendario.entity';
import * as pdfMake from 'pdfmake/build/pdfmake';
import * as pdfFonts from 'pdfmake/build/vfs_fonts';
import * as ExcelJS from 'exceljs';
import * as moment from 'moment';

// Configurar fuentes PDF (una sola vez)
(pdfMake as any).vfs = (pdfFonts as any).pdfMake?.vfs;

@Injectable()
export class ReportesService {
  constructor(
    @InjectRepository(Lectura)
    private lecturaRepo: Repository<Lectura>,
    @InjectRepository(Calendario)
    private calendarioRepo: Repository<Calendario>,
  ) {}

  // GENERAR PDF DE LECTURAS
  async generarPdfLecturas(fechaInicio: string, fechaFin: string): Promise<Buffer> {
    if (!fechaInicio || !fechaFin) {
      throw new BadRequestException('Faltan parámetros: inicio y fin');
    }

    // 🔹 Validar formatos flexibles
    const formatosAceptados = ['YYYY-MM-DD', 'DD/MM/YYYY', 'YYYY/MM/DD'];
    const inicioMoment = moment(fechaInicio, formatosAceptados, true);
    const finMoment = moment(fechaFin, formatosAceptados, true);

    if (!inicioMoment.isValid() || !finMoment.isValid()) {
      throw new BadRequestException(
        'Formato de fecha inválido. Usa YYYY-MM-DD, DD/MM/YYYY o YYYY/MM/DD',
      );
    }

    const inicio = inicioMoment.toDate();
    const fin = finMoment.toDate();

    if (inicio > fin) {
      throw new BadRequestException('La fecha de inicio debe ser menor que la fecha de fin');
    }

    const lecturas = await this.lecturaRepo.find({
      where: {
        fechaProgramada: Between(inicio, fin),
      },
      relations: [
        'muestra',
        'variableDependiente',
        'muestra.repeticion',
        'muestra.repeticion.tratamiento',
        'muestra.repeticion.tratamiento.proyecto',
      ],
    });

    const lecturasValidas = lecturas.filter(
      (l) =>
        l.muestra &&
        l.muestra.repeticion &&
        l.muestra.repeticion.tratamiento &&
        l.muestra.repeticion.tratamiento.proyecto,
    );

    const docDefinition: any = {
      pageSize: 'A4',
      pageOrientation: 'landscape',
      pageMargins: [40, 60, 40, 60],
      header: {
        text: 'Sistema de Fenología',
        alignment: 'center',
        margin: [0, 20, 0, 0],
        fontSize: 10,
        color: '#666',
      },
      content: [
        { text: 'REPORTE DE LECTURAS', style: 'header' },
        {
          text: `Del ${inicio.toLocaleDateString('es-ES')} al ${fin.toLocaleDateString('es-ES')}`,
          style: 'subheader',
        },
        lecturasValidas.length === 0
          ? { text: 'No se encontraron lecturas en este rango de fechas.', style: 'noData' }
          : {
              table: {
                headerRows: 1,
                widths: ['*', '*', '*', '*', '*', '*'],
                body: [
                  [
                    { text: 'Proyecto', style: 'tableHeader' },
                    { text: 'Tratamiento', style: 'tableHeader' },
                    { text: 'Variable', style: 'tableHeader' },
                    { text: 'Valor', style: 'tableHeader' },
                    { text: 'Muestra', style: 'tableHeader' },
                    { text: 'Fecha', style: 'tableHeader' },
                  ],
                  ...lecturasValidas.map((l) => [
                    l.muestra.repeticion.tratamiento.proyecto.nombre || 'N/A',
                    l.muestra.repeticion.tratamiento.nombre || 'N/A',
                    l.variableDependiente.nombreCompleto || 'N/A',
                    l.valor?.toString() || 'N/A',
                    `Muestra ${l.muestra.id}`,
                    new Date(l.fechaProgramada).toLocaleDateString('es-ES'),
                  ]),
                ],
              },
              layout: {
                fillColor: (rowIndex: number) => (rowIndex === 0 ? '#4CAF50' : null),
                hLineWidth: () => 0.5,
                vLineWidth: () => 0.5,
                hLineColor: () => '#aaa',
                vLineColor: () => '#aaa',
                paddingLeft: () => 8,
                paddingRight: () => 8,
              },
            },
      ],
      styles: {
        header: {
          fontSize: 20,
          bold: true,
          margin: [0, 0, 0, 15],
          alignment: 'center',
          color: '#2E7D32',
        },
        subheader: {
          fontSize: 14,
          italics: true,
          margin: [0, 0, 0, 20],
          alignment: 'center',
        },
        noData: {
          fontSize: 16,
          italics: true,
          color: '#999',
          alignment: 'center',
          margin: [0, 50, 0, 0],
        },
        tableHeader: {
          bold: true,
          fontSize: 12,
          color: 'white',
          fillColor: '#4CAF50',
        },
      },
      defaultStyle: { fontSize: 11 },
    };

    return new Promise<Buffer>((resolve, reject) => {
      try {
        const pdf = pdfMake.createPdf(docDefinition);

        const timeout = setTimeout(() => {
          reject(new Error('Tiempo agotado generando el PDF'));
        }, 15000);

        pdf.getBuffer((buffer: Buffer) => {
          clearTimeout(timeout);
          resolve(buffer);
        });

        (pdf as any).on('error', (err: any) => {
          clearTimeout(timeout);
          reject(err);
        });
      } catch (err) {
        reject(err);
      }
    });
  }

  // GENERAR EXCEL DE CALENDARIO
  async generarExcelCalendario(fechaInicio: string, fechaFin: string): Promise<ExcelJS.Buffer> {
    if (!fechaInicio || !fechaFin) {
      throw new BadRequestException('Faltan parámetros: inicio y fin');
    }

    // 🔹 Validar formatos flexibles
    const formatosAceptados = ['YYYY-MM-DD', 'DD/MM/YYYY', 'YYYY/MM/DD'];
    const inicioMoment = moment(fechaInicio, formatosAceptados, true);
    const finMoment = moment(fechaFin, formatosAceptados, true);

    if (!inicioMoment.isValid() || !finMoment.isValid()) {
      throw new BadRequestException(
        'Formato de fecha inválido. Usa YYYY-MM-DD, DD/MM/YYYY o YYYY/MM/DD',
      );
    }

    const inicio = inicioMoment.toDate();
    const fin = finMoment.toDate();

    const eventos = await this.calendarioRepo.find({
      where: {
        fecha: Between(inicio, fin),
      },
      relations: ['proyecto'],
    });

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Calendario Fenológico', {
      pageSetup: { paperSize: 9, orientation: 'landscape' },
    });

    sheet.columns = [
      { header: 'Proyecto', key: 'proyecto', width: 30 },
      { header: 'Descripción', key: 'descripcion', width: 50 },
      { header: 'Fecha', key: 'fecha', width: 15 },
      { header: 'Tipo', key: 'tipo', width: 20 },
      { header: 'Notificado', key: 'notificado', width: 15 },
    ];

    eventos.forEach((e) => {
      sheet.addRow({
        proyecto: e.proyecto?.nombre || 'N/A',
        descripcion: e.descripcion,
        fecha: new Date(e.fecha).toLocaleDateString('es-ES'),
        tipo: e.tipoEvento,
        notificado: e.notificado ? 'Sí' : 'No',
      });
    });

    const headerRow = sheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4CAF50' },
    };
    headerRow.alignment = { vertical: 'middle', horizontal: 'center' };

    sheet.autoFilter = 'A1:E1';

    return workbook.xlsx.writeBuffer();
  }
}
