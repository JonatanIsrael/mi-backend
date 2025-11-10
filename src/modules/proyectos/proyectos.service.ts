import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Proyecto, TipoDisenio } from '../../entities/proyecto.entity';
import { CrearProyectoCompletoDto } from '../../dtos/proyecto.dto';
import { Tratamiento } from '../../entities/tratamiento.entity';
import { VariableDependiente } from '../../entities/variable-dependiente.entity';
import { Repeticion } from '../../entities/repeticion.entity';
import { Muestra } from '../../entities/muestra.entity';
import { Lectura } from '../../entities/lectura.entity';
import { Equipo, RolEquipo } from '../../entities/equipo.entity';
import { UsuariosService } from '../usuarios/usuarios.service';
import { Usuario } from '../../entities/usuario.entity';
import { Calendario, TipoEvento } from '../../entities/calendario.entity';
import { AlertasService } from '../alertas/alertas.service'; // ✅ Agregar este import
import * as ExcelJS from 'exceljs';
import * as PDFDocument from 'pdfkit';

@Injectable()
export class ProyectosService {
  constructor(
    @InjectRepository(Proyecto) private readonly proyectosRepo: Repository<Proyecto>,
    @InjectRepository(Tratamiento) private readonly tratamientoRepo: Repository<Tratamiento>,
    @InjectRepository(VariableDependiente) private readonly variableRepo: Repository<VariableDependiente>,
    @InjectRepository(Repeticion) private readonly repeticionRepo: Repository<Repeticion>,
    @InjectRepository(Muestra) private readonly muestraRepo: Repository<Muestra>,
    @InjectRepository(Lectura) private readonly lecturaRepo: Repository<Lectura>,
    @InjectRepository(Equipo) private readonly equipoRepo: Repository<Equipo>,
    @InjectRepository(Calendario) private readonly calendarioRepo: Repository<Calendario>,
    @InjectRepository(Usuario) private readonly usuarioRepo: Repository<Usuario>,
    private readonly usuariosService: UsuariosService,
    private readonly alertasService: AlertasService, // ✅ Agregar esta dependencia
  ) {}

  // ------------------------------------------------
  // Crear proyecto completo (variables, tratamientos, repeticiones, muestras, lecturas, calendario)
  // ------------------------------------------------

private parseLocalDate(dateStr: string): Date {
  if (!dateStr) return new Date();
  
  // ✅ Método más robusto para crear fecha local
  const [year, month, day] = dateStr.split('-').map(Number);
  
  // Crear fecha en hora local explícitamente, forzando hora 00:00:00 local
  const fechaLocal = new Date(year, month - 1, day, 0, 0, 0, 0);
  
  return fechaLocal;
}
async crearProyectoCompleto(dto: CrearProyectoCompletoDto & { userId: number }) {
  console.log('🔍 DEBUG Fechas recibidas del frontend:', {
    fechaInicio: dto.fechaInicio,
    fechaFin: dto.fechaFin,
    fechasObservacion: dto.fechasObservacion
  });

  if (!dto.nombre) throw new Error('El proyecto debe tener un nombre');
  if (!dto.fechaInicio || !dto.fechaFin) throw new Error('Debe proporcionar fechaInicio y fechaFin');
  if (!dto.fechasObservacion || dto.fechasObservacion.length === 0)
    throw new Error('Se deben proporcionar las fechas de observación desde el front');

  // 🔹 Obtener usuario investigador
  const investigador = await this.usuariosService.encontrarPorId(dto.userId);
  if (!investigador) throw new Error('Usuario no encontrado');

  // 1️⃣ Crear proyecto - ✅ NO USAR parseLocalDate para fechaInicio y fechaFin
  const proyecto = this.proyectosRepo.create({
    nombre: dto.nombre,
    descripcion: dto.descripcion,
     tipoDisenio: dto.tipoDisenio as TipoDisenio,
    fechaInicio: dto.fechaInicio as any,
    fechaFin: dto.fechaFin as any,
    investigadorPrincipal: investigador,
  });

  console.log('🔍 DEBUG Proyecto a guardar:', {
    fechaInicio: proyecto.fechaInicio,
    fechaFin: proyecto.fechaFin
  });

  const proyectoGuardado = await this.proyectosRepo.save(proyecto);


  // 2️⃣ Crear variables dependientes
  const variablesGuardadas: VariableDependiente[] = [];
  for (const v of dto.variablesDependientes || []) {
    const variable = this.variableRepo.create({
      nombreCompleto: v.nombreCompleto,
      clave: v.clave,
      unidad: v.unidad,
      proyecto: proyectoGuardado,
    });
    variablesGuardadas.push(await this.variableRepo.save(variable));
  }

  // 3️⃣ Crear tratamientos + repeticiones + muestras + lecturas
  // ✅ PARA LECTURAS SÍ usar parseLocalDate (porque ahí funciona bien)
  for (const t of dto.tratamientos || []) {
    const tratamiento = this.tratamientoRepo.create({
      nombre: t.nombre,
      variableIndependiente: t.variableIndependiente,
      factor: t.factor,
      nivel: t.nivel,
      proyecto: proyectoGuardado,
    });
    const tratamientoGuardado = await this.tratamientoRepo.save(tratamiento);

    const numeroRepeticiones = dto.numRepeticiones || 1;
    const numeroMuestras = dto.numMuestras || 1;

    for (let r = 1; r <= numeroRepeticiones; r++) {
      const repeticion = this.repeticionRepo.create({
        tratamiento: tratamientoGuardado,
        numero: r,
      });
      const repeticionGuardada = await this.repeticionRepo.save(repeticion);

      for (let m = 1; m <= numeroMuestras; m++) {
        const muestraGuardada = await this.muestraRepo.save(
          this.muestraRepo.create({
            repeticion: repeticionGuardada,
            numero: m,
            codigo: `T${tratamientoGuardado.id}-R${r}-M${m}`,
          })
        );

        // Crear lecturas para cada variable y cada fecha de observación
        for (const variable of variablesGuardadas) {
          for (const fechaStr of dto.fechasObservacion || []) {
            const fecha = this.parseLocalDate(fechaStr);

            const lectura = this.lecturaRepo.create({
              muestra: muestraGuardada,
              variableDependiente: variable,
              valor: null,
              fechaProgramada: fecha,
              fechaRealizada: null,
            });

            await this.lecturaRepo.save(lectura);
          }
        }
      }
    }
  }

  // ✅ Crear eventos de calendario para cada fecha de observación
  for (const fechaStr of dto.fechasObservacion) {
    const evento = this.calendarioRepo.create({
      proyecto: proyectoGuardado,
      fecha: this.parseLocalDate(fechaStr), // ✅ Usar fecha local
      descripcion: `Observación programada para el proyecto "${dto.nombre}"`,
      tipoEvento: TipoEvento.OBSERVACION,
    });
    await this.calendarioRepo.save(evento);
  }

  // 🔹 Devolver proyecto completo con relaciones
  return this.proyectosRepo.findOne({
    where: { id: proyectoGuardado.id },
    relations: [
      'investigadorPrincipal',
      'variablesDependientes',
      'tratamientos',
      'tratamientos.repeticiones',
      'tratamientos.repeticiones.muestras',
      'tratamientos.repeticiones.muestras.lecturas',
      'tratamientos.repeticiones.muestras.lecturas.variableDependiente',
      'calendarios',
    ],
  });
}

  // ------------------------------------------------
  // Obtener proyecto con lecturas (limpio) y verificar acceso (admin/propietario/miembro)
  // ------------------------------------------------
  async obtenerProyectosConLecturas(proyectoId: number, userId: number) {
    const usuario = await this.usuariosService.encontrarPorId(userId);
    if (!usuario) throw new NotFoundException('Usuario no encontrado');
    const esAdmin = usuario.rol === 'administrador';

    const proyecto = await this.proyectosRepo.findOne({
      where: { id: proyectoId },
      relations: [
        'investigadorPrincipal',
        'equipos',
        'equipos.miembros',
        'variablesDependientes',
        'tratamientos',
        'tratamientos.repeticiones',
        'tratamientos.repeticiones.muestras',
        'tratamientos.repeticiones.muestras.lecturas',
        'tratamientos.repeticiones.muestras.lecturas.variableDependiente',
        'calendarios',
      ],
    });

    if (!proyecto) throw new NotFoundException('Proyecto no encontrado');

    const esPropietario = proyecto.investigadorPrincipal?.id === userId;
    const esMiembro = proyecto.equipos?.some(e => e.miembros?.some(m => m.id === userId)) ?? false;

    if (!esAdmin && !esPropietario && !esMiembro) {
      throw new ForbiddenException('No autorizado para ver este proyecto');
    }

    const proyectoLimpio: any = {
      id: proyecto.id,
      nombre: proyecto.nombre,
      descripcion: proyecto.descripcion,
      fechaInicio: proyecto.fechaInicio,
      fechaFin: proyecto.fechaFin,
      tipoDisenio: proyecto.tipoDisenio,
      variablesDependientes: (proyecto.variablesDependientes || []).map((v) => ({
        id: v.id,
        nombreCompleto: v.nombreCompleto,
        clave: v.clave,
        unidad: v.unidad,
      })),
      calendarios: (proyecto.calendarios || []).map(c => ({
        id: c.id,
        fecha: c.fecha,
        descripcion: c.descripcion,
        tipoEvento: c.tipoEvento,
      })),
      tratamientos: [],
    };

    for (const t of proyecto.tratamientos || []) {
      const tClean: any = {
        id: t.id,
        nombre: t.nombre,
        variableIndependiente: t.variableIndependiente,
        factor: t.factor,
        nivel: t.nivel,
        repeticiones: [],
      };

      for (const r of t.repeticiones || []) {
        const rClean: any = {
          id: r.id,
          numero: r.numero,
          muestras: [],
        };

        for (const m of r.muestras || []) {
          const mClean: any = {
            id: m.id,
            numero: m.numero,
            codigo: m.codigo,
            lecturas: [],
          };

          for (const l of m.lecturas || []) {
            mClean.lecturas.push({
              id: l.id,
              valor: l.valor === null ? null : Number(l.valor),
              fechaLectura: l.fechaProgramada,
              variableDependiente: {
                id: l.variableDependiente?.id,
                clave: l.variableDependiente?.clave,
                nombreCompleto: l.variableDependiente?.nombreCompleto,
                unidad: l.variableDependiente?.unidad,
              },
            });
          }

          rClean.muestras.push(mClean);
        }
        tClean.repeticiones.push(rClean);
      }
      proyectoLimpio.tratamientos.push(tClean);
    }

    // 🔹 Tipar las funciones flatMap para evitar errores TS7006
    const totalLecturas = (proyectoLimpio.tratamientos as any[])
      .flatMap((t: any) => t.repeticiones)
      .flatMap((r: any) => r.muestras)
      .flatMap((m: any) => m.lecturas).length;

    return proyectoLimpio;
  }

  // ------------------------------------------------
  // Actualizar varias lecturas
  // ------------------------------------------------
  async actualizarLecturas(lecturas: { id: number; valor: number }[]) {
    for (const l of lecturas) {
      const lectura = await this.lecturaRepo.findOne({ where: { id: l.id } });
      if (!lectura) throw new NotFoundException(`Lectura con id ${l.id} no encontrada`);
      lectura.valor = l.valor;
      lectura.fechaRealizada = new Date();
      await this.lecturaRepo.save(lectura);
    }
    return { success: true };
  }

  async actualizarLectura(id: number, valor: number) {
    const lectura = await this.lecturaRepo.findOne({ where: { id } });
    if (!lectura) throw new NotFoundException(`Lectura con id ${id} no encontrada`);
    lectura.valor = valor;
    lectura.fechaRealizada = new Date();
    await this.lecturaRepo.save(lectura);
    return { success: true };
  }

  // ------------------------------------------------
  // Otros métodos utilitarios (listados, export)
  // ------------------------------------------------
  async obtenerTodos() {
    return this.proyectosRepo.find({ relations: ['investigadorPrincipal'] });
  }

  async obtenerProyectosParaCard(userId: number) {
    return this.proyectosRepo.find({
      where: { investigadorPrincipal: { id: userId } },
      relations: ['investigadorPrincipal'],
    });
  }

async exportarProyectoExcel(proyectoId: number, userId: number): Promise<Buffer> {
  const proyecto = await this.obtenerProyectosConLecturas(proyectoId, userId);
  const workbook = new ExcelJS.Workbook();
  
  // ✅ Configurar el workbook para usar hora local
  workbook.creator = 'Sistema';
  workbook.lastModifiedBy = 'Sistema';
  workbook.created = new Date();
  workbook.modified = new Date();
  
  const sheet = workbook.addWorksheet('Proyecto');

  // Encabezados
  const header = ['FechaRegistro', 'Tratamiento', 'Repetición', 'Muestra', ...proyecto.variablesDependientes.map((v: any) => v.clave)];
  sheet.addRow(header);

  // ✅ FUNCIÓN CORREGIDA: Mantener fecha local sin conversión UTC
  const formatLocalDate = (date: Date): string => {
    if (!date) return '';
    
    // Usar métodos locales explícitamente
    const fechaLocal = new Date(date);
    const year = fechaLocal.getFullYear();
    const month = String(fechaLocal.getMonth() + 1).padStart(2, '0');
    const day = String(fechaLocal.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
  };

  // Obtener todas las fechas únicas de las lecturas
  const todasFechas = new Set<string>();
  proyecto.tratamientos.forEach((t: any) => {
    t.repeticiones.forEach((r: any) => {
      r.muestras.forEach((m: any) => {
        m.lecturas.forEach((l: any) => {
          if (l.fechaLectura) {
            // ✅ Crear fecha local sin ajustes UTC
            const fecha = new Date(l.fechaLectura);
            // Usar la fecha tal como está, sin conversiones
            const fechaStr = formatLocalDate(fecha);
            todasFechas.add(fechaStr);
          }
        });
      });
    });
  });

  const fechasOrdenadas = Array.from(todasFechas).sort();

  // Crear filas por cada combinación
  proyecto.tratamientos.forEach((t: any) => {
    t.repeticiones.forEach((r: any) => {
      r.muestras.forEach((m: any) => {
        fechasOrdenadas.forEach(fechaStr => {
          const rowData = [
            fechaStr, // ✅ Ya está formateada correctamente
            t.nombre,
            r.numero,
            m.numero,
            ...proyecto.variablesDependientes.map((v: any) => {
              const lectura = m.lecturas.find((l: any) => {
                if (!l.fechaLectura) return false;
                const lecturaFecha = formatLocalDate(new Date(l.fechaLectura));
                return lecturaFecha === fechaStr && l.variableDependiente?.id === v.id;
              });
              return lectura ? lectura.valor : '';
            }),
          ];
          sheet.addRow(rowData);
        });
      });
    });
  });

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

  // Exportar PDF con plantillas ///

// Agrega este método en la clase ProyectosService, después de exportarProyectoExcel

async generarPDFProyecto(proyectoId: number, userId: number, fechas: string[]): Promise<Buffer> {
  const proyecto = await this.obtenerProyectosConLecturas(proyectoId, userId);
  
  // Usaremos pdfkit para generar el PDF
  const PDFDocument = require('pdfkit');
  const doc = new PDFDocument({ 
    margin: 40,
    size: 'A4',
    bufferPages: true 
  });

  const buffers: any[] = [];
  doc.on('data', (chunk: any) => buffers.push(chunk));
  
  return new Promise((resolve, reject) => {
    doc.on('end', () => {
      const pdfData = Buffer.concat(buffers);
      resolve(pdfData);
    });

    doc.on('error', reject);

    // Función para agregar página con header
    const addPageWithHeader = () => {
      doc.addPage();
      
      // Header en cada página
      doc.fontSize(10)
         .fillColor('#666666')
         .text(`Proyecto: ${proyecto.nombre}`, 50, 30, { align: 'left' });
      
      doc.text(`Generado: ${new Date().toLocaleDateString('es-MX')}`, 50, 45, { align: 'left' });
      
      doc.text(`Página ${doc.bufferedPageRange().count + 1}`, 400, 30, { align: 'right' });
      
      return 70; // Retorna la posición Y inicial para el contenido
    };

    // Página inicial
    let startY = 80;
    
    // Título principal
    doc.fontSize(18)
       .fillColor('#2c3e50')
       .text(proyecto.nombre, 50, startY, { align: 'center' });
    
    doc.fontSize(12)
       .fillColor('#666666')
       .text(`Reporte de lecturas - ${proyecto.descripcion || ''}`, 50, startY + 25, { align: 'center' });
    
    startY += 60;

    // Por cada fecha
    fechas.forEach((fecha, index) => {
      if (index > 0) {
        startY = addPageWithHeader();
      }

      // Título de la sección de fecha
      doc.fontSize(14)
         .fillColor('#34495e')
         .text(`Fecha de registro: ${this.formatearFechaParaPDF(fecha)}`, 50, startY);
      
      startY += 30;

      // Generar tabla para esta fecha
      startY = this.generarTablaFechaPDF(doc, proyecto, fecha, startY);
      
      // Espacio entre tablas
      startY += 20;
    });

    // Pie de página final
    doc.fontSize(8)
       .fillColor('#999999')
       .text('Reporte generado automáticamente por Nexus Research', 50, doc.page.height - 30, { 
         align: 'center' 
       });

    doc.end();
  });
}

// Y asegúrate de que este método también esté en la clase:
// ✅ MÉTODO CORREGIDO - Usar formato directo sin conversión de zona horaria
private formatearFechaParaPDF(fechaStr: string): string {
  // Si la fecha ya viene en formato YYYY-MM-DD, usarla directamente
  if (fechaStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
    const [year, month, day] = fechaStr.split('-');
    const fecha = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    
    return fecha.toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
  
  // Para otros formatos, usar el método seguro
  const fecha = new Date(fechaStr);
  
  // Ajustar a hora local explícitamente
  const fechaAjustada = new Date(
    fecha.getFullYear(),
    fecha.getMonth(),
    fecha.getDate()
  );
  
  return fechaAjustada.toLocaleDateString('es-MX', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

// Y el método generarTablaFechaPDF que ya tenemos mejorado:
private generarTablaFechaPDF(doc: any, proyecto: any, fecha: string, startY: number): number {
  const pageWidth = doc.page.width - 100;
  let currentY = startY;

  // 🔹 DEFINIR ENCABEZADOS UNA SOLA VEZ (para reutilizar en nuevas páginas)
  const columnWidths: { [key: string]: number } = {
    tratamiento: pageWidth * 0.25,
    repeticion: pageWidth * 0.15,
    muestra: pageWidth * 0.1
  };

  // Agregar anchos para variables
  proyecto.variablesDependientes.forEach((v: any, index: number) => {
    columnWidths[`var_${index}`] = pageWidth * 0.5 / proyecto.variablesDependientes.length;
  });

  const columnKeys = Object.keys(columnWidths);
  
  // ✅ MEJORADO: Mostrar clave y unidad en dos líneas separadas
  const headers = [
    'Tratamiento',
    'Repetición', 
    'Muestra',
    ...proyecto.variablesDependientes.map((v: any) => `${v.clave}\n${v.unidad}`)
  ];

  // ✅ FUNCIÓN REUTILIZABLE para dibujar encabezados
  const dibujarEncabezadosTabla = (yPosition: number) => {
    doc.fontSize(7).font('Helvetica-Bold');
    let x = 50;

    // Fondo encabezados
    doc.rect(50, yPosition, pageWidth, 25)
       .fillAndStroke('#5b4ace', '#000000')
       .fillColor('#ffffff');

    // Texto encabezados - centrado verticalmente para 2 líneas
    headers.forEach((header, i) => {
      const width = columnWidths[columnKeys[i]];
      doc.text(header, x + 2, yPosition + 5, {
        width: width - 4,
        align: 'center',
        lineGap: 1
      });
      x += width;
    });

    return yPosition + 25;
  };

  // ✅ DIBUJAR ENCABEZADOS INICIALES
  currentY = dibujarEncabezadosTabla(currentY);
  doc.fillColor('#000000');

  // Contenido de la tabla
  doc.font('Helvetica');
  
  proyecto.tratamientos.forEach((t: any) => {
    t.repeticiones.forEach((r: any) => {
      r.muestras.forEach((m: any) => {
        // Verificar espacio en página
        if (currentY + 25 > doc.page.height - 50) {
          doc.addPage();
          currentY = 70;
          
          // ✅ REPETIR ENCABEZADOS EN NUEVA PÁGINA
          currentY = dibujarEncabezadosTabla(currentY);
          doc.fillColor('#000000').font('Helvetica');
        }

        // Preparar datos de la fila
        const rowData = [
          t.nombre,
          `Rep ${r.numero}`,
          `Muestra ${m.numero}`
        ];

        // Agregar lecturas para cada variable
        proyecto.variablesDependientes.forEach((v: any) => {
          const lectura = m.lecturas?.find((l: any) => {
            const lecturaFecha = l.fechaLectura ? 
              new Date(l.fechaLectura).toISOString().split('T')[0] : null;
            return l.variableDependiente?.id === v.id && lecturaFecha === fecha;
          });
          rowData.push(lectura?.valor !== undefined && lectura?.valor !== null ? 
            parseFloat(lectura.valor).toFixed(2) : '');
        });

        // Dibujar fila
        let x = 50;
        doc.fontSize(8);

        rowData.forEach((text, i) => {
          const width = columnWidths[columnKeys[i]];
          
          // Alternar colores de fondo para filas
          const fillColor = (currentY % 40 === 0) ? '#f8f9fa' : '#ffffff';
          doc.rect(x, currentY, width, 20).fill(fillColor);
          
          // Borde de celda
          doc.rect(x, currentY, width, 20).stroke();
          
          // Texto
          doc.fillColor('#2c3e50')
             .text(String(text), x + 3, currentY + 6, {
               width: width - 6,
               align: 'center'
             });
          
          x += width;
        });

        currentY += 20;
      });
    });
  });

  return currentY;
}
  // ------------------------------------------------
  // Colaboradores y permisos - CON NOTIFICACIONES
  // ------------------------------------------------

  async agregarColaborador(proyectoId: number, usuarioId: number, rol: RolEquipo = RolEquipo.COLABORADOR, usuarioQueComparteId: number) {
    const proyecto = await this.proyectosRepo.findOne({ 
      where: { id: proyectoId },
      relations: ['investigadorPrincipal'] 
    });
    if (!proyecto) throw new NotFoundException('Proyecto no encontrado');

    const usuario = await this.usuariosService.encontrarPorId(usuarioId);
    if (!usuario) throw new NotFoundException('Usuario no encontrado');

    const usuarioQueComparte = await this.usuariosService.encontrarPorId(usuarioQueComparteId);
    if (!usuarioQueComparte) throw new NotFoundException('Usuario que comparte no encontrado');

    // Verificar si ya es miembro
    const equipoExistente = await this.equipoRepo.findOne({
      where: {
        proyecto: { id: proyectoId },
        miembros: { id: usuarioId }
      }
    });

    if (equipoExistente) {
      throw new ForbiddenException('El usuario ya es miembro de este proyecto');
    }

    const equipo = this.equipoRepo.create({
      proyecto,
      miembros: [usuario],
      rolEnEquipo: rol,
    });
    await this.equipoRepo.save(equipo);

    // ✅ GENERAR NOTIFICACIÓN para agregarColaborador
    await this.alertasService.crearNotificacionProyectoCompartido({
      usuarioId: usuarioId,
      proyectoId: proyectoId,
      proyectoNombre: proyecto.nombre,
      compartidoPor: `${usuarioQueComparte.nombre} ${usuarioQueComparte.apellido_p}`,
      compartidoPorId: usuarioQueComparteId
    });
    

    return { success: true, equipo };
  }

  async agregarColaboradorPorCorreo(proyectoId: number, correo: string, rol: RolEquipo = RolEquipo.COLABORADOR, usuarioQueComparteId: number) {
    const proyecto = await this.proyectosRepo.findOne({ 
      where: { id: proyectoId },
      relations: ['investigadorPrincipal'] 
    });
    if (!proyecto) throw new NotFoundException('Proyecto no encontrado');

    const usuario = await this.usuariosService.encontrarPorCorreo(correo);
    if (!usuario) throw new NotFoundException('Usuario no encontrado');

    const usuarioQueComparte = await this.usuariosService.encontrarPorId(usuarioQueComparteId);
    if (!usuarioQueComparte) throw new NotFoundException('Usuario que comparte no encontrado');

    // Verificar si ya es miembro
    const equipoExistente = await this.equipoRepo.findOne({
      where: {
        proyecto: { id: proyectoId },
        miembros: { id: usuario.id }
      }
    });

    if (equipoExistente) {
      throw new ForbiddenException('El usuario ya es miembro de este proyecto');
    }

    const equipo = this.equipoRepo.create({
      proyecto,
      miembros: [usuario],
      rolEnEquipo: rol,
    });
    await this.equipoRepo.save(equipo);

    // ✅ GENERAR NOTIFICACIÓN para agregarColaboradorPorCorreo
    await this.alertasService.crearNotificacionProyectoCompartido({
      usuarioId: usuario.id,
      proyectoId: proyectoId,
      proyectoNombre: proyecto.nombre,
      compartidoPor: `${usuarioQueComparte.nombre} ${usuarioQueComparte.apellido_p}`,
      compartidoPorId: usuarioQueComparteId
    });

    return { success: true, equipo };
  }

  async agregarColaboradorPorUsuario(proyectoId: number, usuarioUnico: string, rol: RolEquipo = RolEquipo.COLABORADOR, usuarioQueComparteId: number) {
    const proyecto = await this.proyectosRepo.findOne({ 
      where: { id: proyectoId },
      relations: ['investigadorPrincipal'] 
    });
    if (!proyecto) throw new NotFoundException('Proyecto no encontrado');

    const usuario = await this.usuarioRepo.findOne({ where: { usuario: usuarioUnico } });
    if (!usuario) throw new NotFoundException('Usuario no encontrado');

    const usuarioQueComparte = await this.usuariosService.encontrarPorId(usuarioQueComparteId);
    if (!usuarioQueComparte) throw new NotFoundException('Usuario que comparte no encontrado');

    // Verificar si ya es miembro
    const equipoExistente = await this.equipoRepo.findOne({
      where: {
        proyecto: { id: proyectoId },
        miembros: { id: usuario.id }
      }
    });

    if (equipoExistente) {
      throw new ForbiddenException('El usuario ya es miembro de este proyecto');
    }

    const equipo = this.equipoRepo.create({
      proyecto,
      miembros: [usuario],
      rolEnEquipo: rol,
    });
    await this.equipoRepo.save(equipo);

    // ✅ GENERAR NOTIFICACIÓN para agregarColaboradorPorUsuario
    await this.alertasService.crearNotificacionProyectoCompartido({
      usuarioId: usuario.id,
      proyectoId: proyectoId,
      proyectoNombre: proyecto.nombre,
      compartidoPor: `${usuarioQueComparte.nombre} ${usuarioQueComparte.apellido_p}`,
      compartidoPorId: usuarioQueComparteId
    });

    return { success: true, equipo };
  }

  async obtenerProyectosCompartidos(userId: number) {
    return this.equipoRepo
      .find({
        where: { miembros: { id: userId } },
        relations: ['proyecto', 'proyecto.investigadorPrincipal'],
      })
      .then((equipos) => equipos.map((e) => e.proyecto));
  }

  async obtenerProyectosPorUsuario(actualUserId: number, userId?: number) {
    const usuario = await this.usuariosService.encontrarPorId(actualUserId);
    if (!usuario) throw new NotFoundException('Usuario no encontrado');

    const esAdmin = usuario.rol === 'administrador';
    if (esAdmin) {
      if (userId) {
        return this.proyectosRepo.find({
          where: { investigadorPrincipal: { id: userId } },
          relations: ['investigadorPrincipal', 'equipos'],
        });
      }
      return this.proyectosRepo.find({
        relations: ['investigadorPrincipal', 'equipos'],
      });
    }

    return this.proyectosRepo.find({
      where: { investigadorPrincipal: { id: actualUserId } },
      relations: ['equipos'],
    });
  }

  async puedeEditarProyecto(userId: number, proyectoId: number) {
    const proyecto = await this.proyectosRepo.findOne({
      where: { id: proyectoId },
      relations: ['investigadorPrincipal', 'equipos', 'equipos.miembros'],
    });
    if (!proyecto) return false;
    if (proyecto.investigadorPrincipal.id === userId) return true;
    const enEquipo = proyecto.equipos.some(e => e.miembros.some(m => m.id === userId && e.rolEnEquipo === RolEquipo.RESPONSABLE));
    return enEquipo;
  }

  async puedeComentarProyecto(userId: number, proyectoId: number) {
    const proyecto = await this.proyectosRepo.findOne({
      where: { id: proyectoId },
      relations: ['investigadorPrincipal', 'equipos', 'equipos.miembros'],
    });
    if (!proyecto) throw new NotFoundException('Proyecto no encontrado');

    const usuario = await this.usuariosService.encontrarPorId(userId);
    const esAdmin = usuario.rol === 'administrador';
    if (esAdmin) return true;
    if (proyecto.investigadorPrincipal.id === userId) return true;
    const esMiembro = proyecto.equipos.some(e => e.miembros.some(m => m.id === userId));
    return esMiembro;
  }

  async actualizar(id: number, body: Partial<Proyecto>, userId: number) {
    const proyecto = await this.encontrarPorId(id, userId);
    Object.assign(proyecto, body);
    return this.proyectosRepo.save(proyecto);
  }

  async encontrarPorId(id: number, userId: number) {
    const proyecto = await this.proyectosRepo.findOne({
      where: { id, investigadorPrincipal: { id: userId } },
      relations: ['investigadorPrincipal'],
    });
    if (!proyecto) throw new NotFoundException(`Proyecto con ID ${id} no encontrado`);
    return proyecto;
  }

  async obtenerUsuariosConProyectos() {
    return this.usuarioRepo.find({
      relations: ['proyectos'],
    });
  }

// En proyectos.service.ts - Agrega este método
async obtenerResumenEstadistico(proyectoId: number, userId: number) {
  const proyecto = await this.obtenerProyectosConLecturas(proyectoId, userId);
  
  const resumen: any[] = [];

  // Por cada variable dependiente
  proyecto.variablesDependientes.forEach((variable: any) => {
    const lecturasVariable: number[] = [];
    
    // Recopilar todas las lecturas para esta variable
    proyecto.tratamientos.forEach((tratamiento: any) => {
      tratamiento.repeticiones.forEach((repeticion: any) => {
        repeticion.muestras.forEach((muestra: any) => {
          muestra.lecturas.forEach((lectura: any) => {
            if (lectura.variableDependiente?.id === variable.id && 
                lectura.valor !== null && 
                lectura.valor !== undefined) {
              lecturasVariable.push(Number(lectura.valor));
            }
          });
        });
      });
    });

    if (lecturasVariable.length > 0) {
      // Calcular estadísticas
      const media = lecturasVariable.reduce((a, b) => a + b, 0) / lecturasVariable.length;
      const sorted = [...lecturasVariable].sort((a, b) => a - b);
      const mediana = sorted[Math.floor(sorted.length / 2)];
      const minimo = Math.min(...lecturasVariable);
      const maximo = Math.max(...lecturasVariable);
      
      // Desviación estándar
      const varianza = lecturasVariable.reduce((acc, val) => acc + Math.pow(val - media, 2), 0) / lecturasVariable.length;
      const desviacionEstandar = Math.sqrt(varianza);
      
      // Cuartiles
      const q1 = sorted[Math.floor(sorted.length * 0.25)];
      const q3 = sorted[Math.floor(sorted.length * 0.75)];

      resumen.push({
        variable: variable.clave,
        unidad: variable.unidad,
        n: lecturasVariable.length,
        media: Number(media.toFixed(2)),
        mediana: Number(mediana.toFixed(2)),
        desviacionEstandar: Number(desviacionEstandar.toFixed(2)),
        minimo: Number(minimo.toFixed(2)),
        maximo: Number(maximo.toFixed(2)),
        q1: Number(q1.toFixed(2)),
        q3: Number(q3.toFixed(2)),
        rango: Number((maximo - minimo).toFixed(2))
      });
    }
  });

  return {
    proyecto: proyecto.nombre,
    totalMuestras: proyecto.tratamientos.reduce((total: number, t: any) => 
      total + t.repeticiones.reduce((repTotal: number, r: any) => 
        repTotal + r.muestras.length, 0), 0),
    totalLecturas: resumen.reduce((total, item) => total + item.n, 0),
    resumen
  };
}

// En ProyectosService - CORRIGE este método
// En ProyectosService - CORRIGE los tipos de error
async generarResumenEstadisticoPDF(proyectoId: number, userId: number, body: any): Promise<Buffer> {
  try {
    // Verificar que el usuario tenga acceso al proyecto
    const proyecto = await this.obtenerProyectosConLecturas(proyectoId, userId);
    
    // ✅ EXTRAER los datos del resumen del body
    const resumenData = body.resumenData || body;
    
    console.log('🔍 DEBUG - Proyecto:', proyecto.nombre);
    console.log('🔍 DEBUG - Resumen data recibida:', resumenData);
    
    const PDFDocument = require('pdfkit');
    const doc = new PDFDocument({ 
      margin: 40,
      size: 'A4',
      bufferPages: true 
    });

    const buffers: any[] = [];
    doc.on('data', (chunk: any) => buffers.push(chunk));
    
    return new Promise((resolve, reject) => {
      doc.on('end', () => {
        const pdfData = Buffer.concat(buffers);
        resolve(pdfData);
      });

      // ✅ CORREGIDO: Especificar tipo para error
      doc.on('error', (error: Error) => {
        console.error('❌ Error en PDFDocument:', error);
        reject(new Error(`Error generando PDF: ${error.message || 'Error desconocido'}`));
      });

      try {
        // Título principal
        doc.fontSize(18)
           .fillColor('#2c3e50')
           .text(`Resumen Estadístico - ${proyecto.nombre}`, 50, 80, { align: 'center' });
        
        doc.fontSize(12)
           .fillColor('#666666')
           .text('Análisis estadístico de las variables del proyecto', 50, 110, { align: 'center' });
        
        let startY = 150;

        // Información general
        doc.fontSize(14)
           .fillColor('#34495e')
           .text('Información General', 50, startY);
        
        startY += 30;
        
        // ✅ USAR los datos correctos del resumen
        const resumenArray = resumenData.resumen || resumenData.resumenData?.resumen || [];
        const totalMuestras = resumenData.totalMuestras || resumenData.resumenData?.totalMuestras || 0;
        const totalLecturas = resumenData.totalLecturas || resumenData.resumenData?.totalLecturas || 0;
        
        doc.fontSize(10)
           .fillColor('#000000')
           .text(`• Proyecto: ${proyecto.nombre}`, 50, startY)
           .text(`• Descripción: ${proyecto.descripcion || 'Sin descripción'}`, 50, startY + 15)
           .text(`• Total de muestras: ${totalMuestras}`, 50, startY + 30)
           .text(`• Total de lecturas con valores: ${totalLecturas}`, 50, startY + 45)
           .text(`• Variables analizadas: ${resumenArray.length}`, 50, startY + 60);
        
        startY += 100;

        // Tabla de resumen estadístico
        if (resumenArray.length > 0) {
          doc.fontSize(14)
             .fillColor('#34495e')
             .text('Resumen Estadístico por Variable', 50, startY);
          
          startY += 30;
          
          // Generar tabla
          startY = this.generarTablaResumenPDF(doc, resumenArray, startY);
        } else {
          doc.fontSize(12)
             .fillColor('#666666')
             .text('No hay datos suficientes para el análisis estadístico', 50, startY, { align: 'center' });
        }

        // Pie de página
        doc.fontSize(8)
           .fillColor('#999999')
           .text('Resumen generado automáticamente por Nexus Research', 50, doc.page.height - 30, { 
             align: 'center' 
           });

        doc.end();
      } catch (innerError: unknown) {
        console.error('❌ Error en la generación del PDF:', innerError);
        // ✅ CORREGIDO: Manejo seguro de error unknown
        const errorMessage = innerError instanceof Error ? innerError.message : 
                            typeof innerError === 'string' ? innerError : 
                            'Error desconocido en la generación del PDF';
        reject(new Error(`Error en la generación del PDF: ${errorMessage}`));
      }
    });
  } catch (error: unknown) {
    console.error('❌ Error generando PDF de resumen:', error);
    // ✅ CORREGIDO: Manejo seguro de error unknown
    const errorMessage = error instanceof Error ? error.message : 
                        typeof error === 'string' ? error : 
                        'Error desconocido al generar PDF del resumen estadístico';
    throw new Error(errorMessage);
  }
}

private generarTablaResumenPDF(doc: any, resumen: any[], startY: number): number {
  try {
    const pageWidth = doc.page.width - 100;
    let currentY = startY;

    // Definir anchos de columnas
    const columnWidths: { [key: string]: number } = {
      variable: pageWidth * 0.25,
      n: pageWidth * 0.08,
      media: pageWidth * 0.12,
      mediana: pageWidth * 0.12,
      desviacion: pageWidth * 0.12,
      minimo: pageWidth * 0.10,
      maximo: pageWidth * 0.10,
      rango: pageWidth * 0.11
    };

    const headers = ['Variable', 'n', 'Media', 'Mediana', 'Desv. Est.', 'Mínimo', 'Máximo', 'Rango'];
    const columnKeys = Object.keys(columnWidths);

    // Dibujar encabezados
    doc.fontSize(8).font('Helvetica-Bold');
    let x = 50;

    // Fondo encabezados
    doc.rect(50, currentY, pageWidth, 20)
       .fillAndStroke('#5b4ace', '#000000')
       .fillColor('#ffffff');

    // Texto encabezados
    headers.forEach((header, i) => {
      const width = columnWidths[columnKeys[i]];
      doc.text(header, x + 2, currentY + 6, {
        width: width - 4,
        align: 'center'
      });
      x += width;
    });

    currentY += 20;
    doc.fillColor('#000000');

    // Contenido de la tabla
    doc.font('Helvetica').fontSize(7);

    resumen.forEach((item, index) => {
      // Verificar espacio en página
      if (currentY + 15 > doc.page.height - 50) {
        doc.addPage();
        currentY = 70;
        
        // Redibujar encabezados en nueva página
        doc.fontSize(8).font('Helvetica-Bold');
        x = 50;
        doc.rect(50, currentY, pageWidth, 20)
           .fillAndStroke('#5b4ace', '#000000')
           .fillColor('#ffffff');
        
        headers.forEach((header, i) => {
          const width = columnWidths[columnKeys[i]];
          doc.text(header, x + 2, currentY + 6, {
            width: width - 4,
            align: 'center'
          });
          x += width;
        });
        
        currentY += 20;
        doc.fillColor('#000000').font('Helvetica').fontSize(7);
      }

      // ✅ VALIDAR que los datos existan antes de usarlos
      const rowData = [
        `${item.variable || 'N/A'} (${item.unidad || 'N/A'})`,
        (item.n || 0).toString(),
        typeof item.media === 'number' ? item.media.toFixed(2) : 'N/A',
        typeof item.mediana === 'number' ? item.mediana.toFixed(2) : 'N/A',
        typeof item.desviacionEstandar === 'number' ? item.desviacionEstandar.toFixed(2) : 'N/A',
        typeof item.minimo === 'number' ? item.minimo.toFixed(2) : 'N/A',
        typeof item.maximo === 'number' ? item.maximo.toFixed(2) : 'N/A',
        typeof item.rango === 'number' ? item.rango.toFixed(2) : 'N/A'
      ];

      // Dibujar fila
      x = 50;
      
      // Color de fondo alternado
      const fillColor = (index % 2 === 0) ? '#ffffff' : '#f8f9fa';
      doc.rect(50, currentY, pageWidth, 15).fill(fillColor);

      rowData.forEach((text, i) => {
        const width = columnWidths[columnKeys[i]];
        
        // Borde de celda
        doc.rect(x, currentY, width, 15).stroke();
        
        // Texto
        doc.fillColor('#2c3e50')
           .text(text, x + 2, currentY + 4, {
             width: width - 4,
             align: 'center'
           });
        
        x += width;
      });

      currentY += 15;
    });

    return currentY;
  } catch (error: unknown) {
    console.error('❌ Error en generarTablaResumenPDF:', error);
    // ✅ CORREGIDO: Manejo seguro de error unknown
    const errorMessage = error instanceof Error ? error.message : 
                        typeof error === 'string' ? error : 
                        'Error desconocido generando tabla PDF';
    throw new Error(`Error generando tabla PDF: ${errorMessage}`);
  }
}

}