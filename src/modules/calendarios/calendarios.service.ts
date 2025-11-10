// src/modules/calendarios/calendarios.service.ts
import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual } from 'typeorm';
import { Calendario } from '../../entities/calendario.entity';
import { CrearCalendarioDto } from '../../dtos/calendario.dto';
import { ProyectosService } from '../proyectos/proyectos.service';
import { Alerta, TipoAlerta } from '../../entities/alerta.entity';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class CalendariosService {
  constructor(
    @InjectRepository(Calendario)
    private readonly calendariosRepo: Repository<Calendario>,
    @InjectRepository(Alerta)
    private readonly alertaRepo: Repository<Alerta>,
    private readonly proyectosService: ProyectosService,
  ) {}

  // Crear evento en el calendario
  async crear(crearCalendarioDto: CrearCalendarioDto, userId: number) {
    const proyecto = await this.proyectosService.encontrarPorId(
      crearCalendarioDto.id_proyecto,
      userId,
    );
    const calendario = this.calendariosRepo.create({
      ...crearCalendarioDto,
      proyecto,
      notificado: false,
    });
    return this.calendariosRepo.save(calendario);
  }

  // ✅ CORREGIDO: Obtener eventos por proyecto - VERIFICA COLABORADORES
  async encontrarPorProyecto(idProyecto: number, userId: number) {
    // Usar obtenerProyectosConLecturas que SÍ verifica colaboradores
    const proyecto = await this.proyectosService.obtenerProyectosConLecturas(idProyecto, userId);
    
    return this.calendariosRepo.find({ 
      where: { proyecto: { id: idProyecto } },
      relations: ['proyecto']
    });
  }

  // CRON: Ejecuta cada día a las 00:00
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async verificarFechasPendientes() {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const eventos = await this.calendariosRepo.find({
      where: {
        fecha: LessThanOrEqual(hoy),
        notificado: false,
      },
      relations: [
        'proyecto',
        'proyecto.investigadorPrincipal',
        'proyecto.equipos',
        'proyecto.equipos.miembros',
      ],
    });

    for (const evento of eventos) {
      const proyecto = evento.proyecto;
      const usuariosIds = new Set<number>();

      // Dueño del proyecto
      usuariosIds.add(proyecto.investigadorPrincipal.id);

      // Miembros de los equipos
      proyecto.equipos?.forEach((equipo: any) => {
        equipo.miembros?.forEach((miembro: any) => {
          usuariosIds.add(miembro.id);
        });
      });

      // Crear alerta para cada usuario
      const alertas = Array.from(usuariosIds).map((id) =>
        this.alertaRepo.create({
          usuario: { id } as any,
          proyecto: { id: proyecto.id } as any,
          descripcion: `Recordatorio: "${evento.descripcion}" - Hoy`,
          tipo: TipoAlerta.RECORDATORIO,
        }),
      );

      if (alertas.length > 0) {
        await this.alertaRepo.save(alertas);
      }

      // Marcar como notificado
      await this.calendariosRepo.update(evento.id, { notificado: true });
    }
  }
}