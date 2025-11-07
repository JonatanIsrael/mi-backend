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
import * as ExcelJS from 'exceljs';

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
  ) {}

  // ------------------------------------------------
  // Crear proyecto completo (variables, tratamientos, repeticiones, muestras, lecturas, calendario)
  // ------------------------------------------------

  async crearProyectoCompleto(dto: CrearProyectoCompletoDto & { userId: number }) {
  if (!dto.nombre) throw new Error('El proyecto debe tener un nombre');
  if (!dto.fechaInicio || !dto.fechaFin) throw new Error('Debe proporcionar fechaInicio y fechaFin');

  if (!dto.fechasObservacion || dto.fechasObservacion.length === 0)
    throw new Error('Se deben proporcionar las fechas de observación desde el front');

  // 🔹 Obtener usuario investigador
  const investigador = await this.usuariosService.encontrarPorId(dto.userId);
  if (!investigador) throw new Error('Usuario no encontrado');

  // 1️⃣ Crear proyecto
  const proyecto = this.proyectosRepo.create({
    nombre: dto.nombre,
    descripcion: dto.descripcion,
    fechaInicio: new Date(dto.fechaInicio),
    fechaFin: new Date(dto.fechaFin),
    investigadorPrincipal: investigador,
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


        for (const variable of variablesGuardadas) {
          for (const fechaStr of dto.fechasObservacion || []) {
            const fecha = new Date(fechaStr);
            if (isNaN(fecha.getTime())) {
              continue;
            }

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
  for (const fecha of dto.fechasObservacion) {
    const evento = this.calendarioRepo.create({
      proyecto: proyectoGuardado,
      fecha: new Date(fecha),
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
      select: ['id', 'nombre', 'descripcion', 'tipoDisenio'],
      relations: ['investigadorPrincipal'],
    });
  }

async exportarProyectoExcel(proyectoId: number, userId: number): Promise<Buffer> {
  const proyecto = await this.obtenerProyectosConLecturas(proyectoId, userId);
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Proyecto');

  // Encabezados: Tratamiento | Repetición | Muestra | Variables
  const header = ['Tratamiento', 'Repetición', 'Muestra', ...proyecto.variablesDependientes.map((v: any) => v.clave)];
  sheet.addRow(header);

  proyecto.tratamientos.forEach((t: any) => {
    t.repeticiones.forEach((r: any) => {
      r.muestras.forEach((m: any) => {
        // Crear una fila por cada lectura de cada variable
        // Para esto agrupamos lecturas por variable
        const lecturasPorVariable: Record<number, number[]> = {};
        proyecto.variablesDependientes.forEach((v: any) => {
          lecturasPorVariable[v.id] = (m.lecturas || [])
            .filter((l: any) => l.variableDependiente.id === v.id)
            .map((l: any) => l.valor);
        });

        // Determinar cuántas filas necesitamos: la máxima cantidad de lecturas entre todas las variables
        const maxFilas = Math.max(...Object.values(lecturasPorVariable).map(arr => arr.length));

        for (let i = 0; i < maxFilas; i++) {
          const row = [
            t.nombre,
            r.numero,
            m.numero,
            ...proyecto.variablesDependientes.map((v: any) => {
              // Si no hay lectura en esta fila, dejamos 0
              return lecturasPorVariable[v.id][i] ?? 0;
            }),
          ];
          sheet.addRow(row);
        }
      });
    });
  });

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}



  // ------------------------------------------------
  // Colaboradores y permisos
  // ------------------------------------------------
  async agregarColaborador(proyectoId: number, usuarioId: number, rol: RolEquipo = RolEquipo.COLABORADOR) {
    const proyecto = await this.proyectosRepo.findOne({ where: { id: proyectoId } });
    if (!proyecto) throw new NotFoundException('Proyecto no encontrado');

    const usuario = await this.usuariosService.encontrarPorId(usuarioId);
    if (!usuario) throw new NotFoundException('Usuario no encontrado');

    const equipo = this.equipoRepo.create({
      proyecto,
      miembros: [usuario],
      rolEnEquipo: rol,
    });
    await this.equipoRepo.save(equipo);
    return { success: true, equipo };
  }

  async agregarColaboradorPorCorreo(proyectoId: number, correo: string, rol: RolEquipo = RolEquipo.COLABORADOR) {
    const proyecto = await this.proyectosRepo.findOne({ where: { id: proyectoId } });
    if (!proyecto) throw new NotFoundException('Proyecto no encontrado');

    const usuario = await this.usuariosService.encontrarPorCorreo(correo);
    if (!usuario) throw new NotFoundException('Usuario no encontrado');

    const equipo = this.equipoRepo.create({
      proyecto,
      miembros: [usuario],
      rolEnEquipo: rol,
    });
    await this.equipoRepo.save(equipo);
    return { success: true, equipo };
  }

  async agregarColaboradorPorUsuario(proyectoId: number, usuarioUnico: string, rol: RolEquipo = RolEquipo.COLABORADOR) {
    const proyecto = await this.proyectosRepo.findOne({ where: { id: proyectoId } });
    if (!proyecto) throw new NotFoundException('Proyecto no encontrado');

    const usuario = await this.usuarioRepo.findOne({ where: { usuario: usuarioUnico } });
    if (!usuario) throw new NotFoundException('Usuario no encontrado');

    const equipo = this.equipoRepo.create({
      proyecto,
      miembros: [usuario],
      rolEnEquipo: rol,
    });
    await this.equipoRepo.save(equipo);
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
}
