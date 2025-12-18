import { Injectable, NotFoundException, ForbiddenException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, LessThanOrEqual, In } from 'typeorm'; // ✅ Agregar In aquí
import { Calendario, TipoEvento } from '../../entities/calendario.entity';
import { CrearCalendarioDto } from '../../dtos/calendario.dto';
import { ProyectosService } from '../proyectos/proyectos.service';
import { Alerta, TipoAlerta } from '../../entities/alerta.entity';
import { Cron, CronExpression } from '@nestjs/schedule';
import { UsuariosService } from '../usuarios/usuarios.service';

@Injectable()
export class CalendariosService {
  private readonly logger = new Logger(CalendariosService.name);

  constructor(
    @InjectRepository(Calendario)
    private readonly calendariosRepo: Repository<Calendario>,
    @InjectRepository(Alerta)
    private readonly alertaRepo: Repository<Alerta>,
    private readonly proyectosService: ProyectosService,
    private readonly usuariosService: UsuariosService, // Agregar
  ) {}

  // ============================================
  // 1. CREAR EVENTO EN CALENDARIO CON NOTIFICACIONES PROGRAMADAS
  // ============================================
  async crear(crearCalendarioDto: CrearCalendarioDto, userId: number) {
    const proyecto = await this.proyectosService.encontrarPorId(
      crearCalendarioDto.id_proyecto,
      userId,
    );
    
    const fechaEvento = new Date(crearCalendarioDto.fecha);
    
    const calendario = this.calendariosRepo.create({
      fecha: fechaEvento,
      descripcion: crearCalendarioDto.descripcion,
      tipoEvento: crearCalendarioDto.tipoEvento,
      proyecto: proyecto,
      notificado: false,
      notificado24h: false,
      notificado1h: false,
    });
    
    const calendarioGuardado = await this.calendariosRepo.save(calendario);
    
    if (crearCalendarioDto.crearNotificacionInmediata) {
      await this.crearAlertaParaEvento(calendarioGuardado, 'inmediata');
    }
    
    return calendarioGuardado;
  }

  // ============================================
  // 2. CRON JOBS MEJORADOS
  // ============================================

  @Cron('0 */6 * * *')
  async verificarEventos24hAntes() {
    
    const ahora = new Date();
    const dentroDe24h = new Date(ahora.getTime() + 24 * 60 * 60 * 1000);
    
    const inicioVentana = new Date(dentroDe24h.getTime() - 6 * 60 * 60 * 1000);
    const finVentana = new Date(dentroDe24h.getTime() + 6 * 60 * 60 * 1000);
    
    const eventos = await this.calendariosRepo.find({
      where: {
        fecha: Between(inicioVentana, finVentana),
        notificado: false,
        notificado24h: false,
      },
      relations: [
        'proyecto',
        'proyecto.investigadorPrincipal',
        'proyecto.equipos',
        'proyecto.equipos.miembros',
      ],
    });
        
    for (const evento of eventos) {
      const diferenciaHoras = Math.abs(
        (evento.fecha.getTime() - ahora.getTime()) / (1000 * 60 * 60)
      );
      
      if (diferenciaHoras >= 18 && diferenciaHoras <= 30) {
        await this.crearAlertaParaEvento(evento, '24h_antes');
        
        await this.calendariosRepo.update(evento.id, { 
          notificado24h: true 
        });
        
      }
    }
  }

  @Cron(CronExpression.EVERY_HOUR) 
  async verificarEventosHoy() {
    
    const hoy = new Date();
    const inicioDia = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate(), 0, 0, 0);
    const finDia = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate(), 23, 59, 59);
    
    const eventos = await this.calendariosRepo.find({
      where: {
        fecha: Between(inicioDia, finDia),
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
      await this.crearAlertaParaEvento(evento, 'hoy');
      
      await this.calendariosRepo.update(evento.id, { 
        notificado: true,
        notificado24h: true, 
      });
      
    }
  }

  @Cron(CronExpression.EVERY_WEEK)
  async limpiarEventosAntiguos() {    
    const hace30Dias = new Date();
    hace30Dias.setDate(hace30Dias.getDate() - 30);
    
    await this.calendariosRepo.update(
      {
        fecha: LessThanOrEqual(hace30Dias),
        notificado: false,
      },
      { notificado: true }
    );
    
  }

  // ============================================
  // 3. FUNCIÓN AUXILIAR PARA CREAR ALERTAS
  // ============================================
  private async crearAlertaParaEvento(evento: Calendario, tipoNotificacion: 'inmediata' | '24h_antes' | 'hoy') {
    const proyecto = evento.proyecto;
    const usuariosIds = new Set<number>();

    // Dueño del proyecto
    usuariosIds.add(proyecto.investigadorPrincipal.id);

    // Miembros de los equipos
    if (proyecto.equipos) {
      for (const equipo of proyecto.equipos) {
        if (equipo.miembros) {
          for (const miembro of equipo.miembros) {
            usuariosIds.add(miembro.id);
          }
        }
      }
    }

    // Formatear mensaje según tipo de notificación
    let mensaje = '';
    const fechaEvento = this.formatearFecha(evento.fecha);
    
    switch (tipoNotificacion) {
      case 'inmediata':
        mensaje = `Nuevo evento programado: "${evento.descripcion}" para el ${fechaEvento}`;
        break;
      case '24h_antes':
        mensaje = `Recordatorio: "${evento.descripcion}" es mañana (${fechaEvento})`;
        break;
      case 'hoy':
        mensaje = `¡Hoy es el día! "${evento.descripcion}" - ${fechaEvento}`;
        break;
    }

    // Crear alertas para cada usuario
    const alertasPromises = Array.from(usuariosIds).map(async (usuarioId) => {
      const alerta = this.alertaRepo.create({
        usuario: { id: usuarioId } as any,
        proyecto: { id: proyecto.id } as any,
        descripcion: mensaje,
        tipo: TipoAlerta.RECORDATORIO,
        fechaEnvio: new Date(Date.UTC(
          new Date().getUTCFullYear(),
          new Date().getUTCMonth(),
          new Date().getUTCDate(),
          new Date().getUTCHours(),
          new Date().getUTCMinutes(),
          new Date().getUTCSeconds()
        )),
      });
      
      return await this.alertaRepo.save(alerta);
    });

    if (alertasPromises.length > 0) {
      await Promise.all(alertasPromises);
      return true;
    }
    
    return false;
  }

  // ============================================
  // 4. FUNCIONES UTILITARIAS
  // ============================================
  private formatearFecha(fecha: Date): string {
    return fecha.toLocaleDateString('es-MX', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  async encontrarPorProyecto(idProyecto: number, userId: number) {
    await this.proyectosService.obtenerProyectosConLecturas(idProyecto, userId);
    
    return this.calendariosRepo.find({ 
      where: { proyecto: { id: idProyecto } },
      relations: ['proyecto'],
      order: { fecha: 'ASC' },
    });
  }

  async obtenerEventosProximosUsuario(userId: number, dias: number = 7) {
    const hoy = new Date();
    const limite = new Date();
    limite.setDate(hoy.getDate() + dias);
    
    try {
      const proyectosUsuario = await this.proyectosService.obtenerProyectosCompartidos(userId);
      const proyectosIds = proyectosUsuario.map(p => p.id);
      
      if (proyectosIds.length === 0) {
        return [];
      }
      
      return this.calendariosRepo.find({
        where: {
          proyecto: { id: In(proyectosIds) },
          fecha: Between(hoy, limite),
        },
        relations: ['proyecto'],
        order: { fecha: 'ASC' },
      });
    } catch (error) {
      this.logger.error('Error obteniendo eventos próximos:', error);
      return [];
    }
  }

  async reiniciarNotificacion(eventoId: number, userId: number) {
    const evento = await this.calendariosRepo.findOne({
      where: { id: eventoId },
      relations: ['proyecto', 'proyecto.investigadorPrincipal']
    });
    
    if (!evento) {
      throw new NotFoundException('Evento no encontrado');
    }
    
    if (evento.proyecto.investigadorPrincipal.id !== userId) {
      throw new ForbiddenException('No tienes permiso para modificar este evento');
    }
    
    await this.calendariosRepo.update(eventoId, {
      notificado: false,
      notificado24h: false,
      notificado1h: false,
    });
    
    return { success: true, message: 'Notificaciones reiniciadas' };
  }

  async ejecutarVerificacionManual() {    
    await this.verificarEventos24hAntes();
    await this.verificarEventosHoy();
    
    return { 
      success: true, 
      message: 'Verificación manual completada' 
    };
  }
}