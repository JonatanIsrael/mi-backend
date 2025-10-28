import { Injectable, NotFoundException } from '@nestjs/common';
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
    @InjectRepository(Usuario) private readonly usuarioRepo: Repository<Usuario>, // 🔹 Inyección agregada
    private readonly usuariosService: UsuariosService,
  ) {}

  // 🔹 TODAS TUS FUNCIONES ORIGINALES
  async crearProyectoCompleto(dto: CrearProyectoCompletoDto) {
    const usuario = await this.usuariosService.encontrarPorId(dto.userId);
    const proyecto = this.proyectosRepo.create({
      nombre: dto.nombre,
      descripcion: dto.descripcion ?? '',
      tipoDisenio: dto.tipo_disenio as TipoDisenio,
      investigadorPrincipal: usuario,
    });
    await this.proyectosRepo.save(proyecto);

    const variablesGuardadas: VariableDependiente[] = [];
    for (const v of dto.variablesDependientes) {
      const variable = this.variableRepo.create({ ...v, proyecto });
      await this.variableRepo.save(variable);
      variablesGuardadas.push(variable);
    }

    const tratamientosGuardados: Tratamiento[] = [];
    for (const t of dto.tratamientos) {
      const tratamiento = this.tratamientoRepo.create({ ...t, proyecto });
      await this.tratamientoRepo.save(tratamiento);
      tratamientosGuardados.push(tratamiento);

      for (let i = 1; i <= dto.numRepeticiones; i++) {
        const repeticion = this.repeticionRepo.create({ tratamiento, numero: i });
        await this.repeticionRepo.save(repeticion);

        const numMuestras = dto.numMuestras && dto.numMuestras > 0 ? dto.numMuestras : 1;
        for (let j = 1; j <= numMuestras; j++) {
          const muestra = this.muestraRepo.create({
            repeticion,
            numero: j,
            codigo: `T${tratamiento.id}-R${i}-M${j}`,
          });
          await this.muestraRepo.save(muestra);

          for (const v of variablesGuardadas) {
            const lectura = this.lecturaRepo.create({
              muestra,
              variableDependiente: v,
              valor: 0,
              fechaLectura: new Date(),
            });
            await this.lecturaRepo.save(lectura);
          }
        }
      }
    }

    return { proyecto, tratamientos: tratamientosGuardados, variables: variablesGuardadas };
  }

 async obtenerProyectosConLecturas(proyectoId: number, userId: number) {
  // Primero obtenemos al usuario autenticado
  const usuario = await this.usuariosService.encontrarPorId(userId);

  // Verificamos si es admin
  const esAdmin = usuario.rol === 'administrador';

  // Buscamos el proyecto, con todas sus relaciones
  const proyecto = await this.proyectosRepo.findOne({
    where: { id: proyectoId },
    relations: [
      'investigadorPrincipal',
      'equipos',
      'equipos.miembros',
      'tratamientos',
      'tratamientos.repeticiones',
      'tratamientos.repeticiones.muestras',
      'tratamientos.repeticiones.muestras.lecturas',
      'tratamientos.repeticiones.muestras.lecturas.variableDependiente',
      'variablesDependientes',
    ],
  });

  if (!proyecto) throw new NotFoundException('Proyecto no encontrado');

  // Permitir acceso si:
  // 1. Es admin
  // 2. Es el investigador principal
  // 3. Está en el equipo del proyecto
  const esPropietario = proyecto.investigadorPrincipal.id === userId;
  const esMiembro = proyecto.equipos.some(e => e.miembros.some(m => m.id === userId));

  if (!esAdmin && !esPropietario && !esMiembro) {
    throw new NotFoundException('No autorizado para ver este proyecto');
  }

  return proyecto;
}


  async encontrarPorId(id: number, userId: number) {
    const proyecto = await this.proyectosRepo.findOne({
      where: { id, investigadorPrincipal: { id: userId } },
      relations: ['investigadorPrincipal'],
    });
    if (!proyecto) throw new NotFoundException(`Proyecto con ID ${id} no encontrado`);
    return proyecto;
  }

  async actualizarLecturas(lecturas: { id: number; valor: number }[]) {
    for (const l of lecturas) {
      const lectura = await this.lecturaRepo.findOne({ where: { id: l.id } });
      if (!lectura) throw new NotFoundException(`Lectura con id ${l.id} no encontrada`);
      lectura.valor = l.valor;
      lectura.fechaLectura = new Date();
      await this.lecturaRepo.save(lectura);
    }
    return { success: true };
  }

  async actualizarLectura(id: number, valor: number) {
    const lectura = await this.lecturaRepo.findOne({ where: { id } });
    if (!lectura) throw new NotFoundException(`Lectura con id ${id} no encontrada`);
    lectura.valor = valor;
    lectura.fechaLectura = new Date();
    await this.lecturaRepo.save(lectura);
    return { success: true };
  }

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
    const header = ['Tratamiento', 'Repetición', 'Muestra', ...proyecto.variablesDependientes.map((v: any) => v.clave)];
    sheet.addRow(header);
    proyecto.tratamientos.forEach((t: any) => {
      t.repeticiones.forEach((r: any) => {
        r.muestras.forEach((m: any) => {
          const row = [
            t.nombre,
            r.numero,
            m.numero,
            ...proyecto.variablesDependientes.map((v: any) => {
              const lectura = m.lecturas.find((l: any) => l.variableDependiente.id === v.id);
              return lectura ? lectura.valor : 0;
            }),
          ];
          sheet.addRow(row);
        });
      });
    });
    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  // 🔹 NUEVO: Agregar colaborador / compartir proyecto
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

  async agregarColaboradorPorCorreo(
  proyectoId: number,
  correo: string,
  rol: RolEquipo = RolEquipo.COLABORADOR,
) {
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

async agregarColaboradorPorUsuario(
  proyectoId: number,
  usuarioUnico: string,
  rol: RolEquipo = RolEquipo.COLABORADOR
) {
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
  return this.equipoRepo.find({
    where: { miembros: { id: userId } },
    relations: ['proyecto', 'proyecto.investigadorPrincipal'],
  }).then(equipos => equipos.map(e => e.proyecto))
}

async obtenerProyectosPorUsuario(actualUserId: number, userId?: number) {
  const usuario = await this.usuariosService.encontrarPorId(actualUserId);
  if (!usuario) throw new NotFoundException('Usuario no encontrado');

  const esAdmin = usuario.rol === 'administrador';

  if (esAdmin) {
    // Admin puede ver todos los proyectos o de un usuario específico
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

  // Usuario normal: devuelve solo sus proyectos
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

  const enEquipo = proyecto.equipos.some(e => 
    e.miembros.some(m => m.id === userId && e.rolEnEquipo === RolEquipo.RESPONSABLE)
  );
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

  if (esAdmin) return true; // Admin puede ver/comentar

  // Propietario puede comentar
  if (proyecto.investigadorPrincipal.id === userId) return true;

  // Colaborador puede comentar
  const esMiembro = proyecto.equipos.some(e =>
    e.miembros.some(m => m.id === userId)
  );
  return esMiembro;
}

async actualizar(id: number, body: Partial<Proyecto>, userId: number) {
  const proyecto = await this.encontrarPorId(id, userId);
  Object.assign(proyecto, body);
  return this.proyectosRepo.save(proyecto);
}

async obtenerUsuariosConProyectos() {
  return this.usuarioRepo.find({
    relations: ['proyectos'], // así traes los proyectos de cada usuario
  });
}


}
