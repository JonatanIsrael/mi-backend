// src/modules/proyectos/comentarios.service.ts
import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Comentario } from '../../entities/comentario.entity';
import { Proyecto } from '../../entities/proyecto.entity';
import { Equipo } from '../../entities/equipo.entity';
import { CrearComentarioDto } from '../../dtos/comentario.dto';
import { Alerta, TipoAlerta } from '../../entities/alerta.entity'; // AÑADE TipoAlerta

@Injectable()
export class ComentariosService {
  constructor(
    @InjectRepository(Comentario)
    private readonly comentarioRepo: Repository<Comentario>,
    @InjectRepository(Proyecto)
    private readonly proyectoRepo: Repository<Proyecto>,
    @InjectRepository(Alerta) 
    private readonly alertaRepo: Repository<Alerta>, // CORREGIDO: Alerta (no ALerta)
  ) {}

  async crearComentario(
    proyectoId: number,
    usuarioId: number,
    dto: CrearComentarioDto,
  ): Promise<Comentario> {
    const proyecto = await this.proyectoRepo.findOne({
      where: { id: proyectoId },
      relations: ['investigadorPrincipal', 'equipos', 'equipos.miembros'],
    });

    if (!proyecto) throw new NotFoundException('Proyecto no encontrado');

    const esPropietario = proyecto.investigadorPrincipal.id === usuarioId;
    const esMiembro = proyecto.equipos?.some((equipo: Equipo) =>
      equipo.miembros?.some((miembro: any) => miembro.id === usuarioId),
    );

    if (!esPropietario && !esMiembro) {
      throw new ForbiddenException('No tienes permiso para comentar');
    }

    // === GUARDAR COMENTARIO ===
    const comentario = this.comentarioRepo.create({
      comentario: dto.comentario,
      usuario_id: usuarioId,
      proyecto_id: proyectoId,
    });
    const comentarioGuardado = await this.comentarioRepo.save(comentario);

    // === CREAR ALERTAS PARA TODOS LOS MIEMBROS (excepto el que comentó) ===
    const usuariosIds = new Set<number>();
    usuariosIds.add(proyecto.investigadorPrincipal.id);
    proyecto.equipos?.forEach((equipo: any) => {
      equipo.miembros?.forEach((miembro: any) => {
        usuariosIds.add(miembro.id);
      });
    });

    const alertas = Array.from(usuariosIds)
      .filter(id => id !== usuarioId)
      .map(id => this.alertaRepo.create({
        usuario: { id } as any,
        proyecto: { id: proyectoId } as any,
        descripcion: `Nuevo comentario en el proyecto "${proyecto.nombre}"`, // CORREGIDO
        tipo: TipoAlerta.RECORDATORIO, // CORREGIDO
      }));

    if (alertas.length > 0) {
      await this.alertaRepo.save(alertas);
    }

    return comentarioGuardado;
  }

  async obtenerComentarios(proyectoId: number, usuarioId: number): Promise<Comentario[]> {
    const proyecto = await this.proyectoRepo.findOne({
      where: { id: proyectoId },
      relations: ['investigadorPrincipal', 'equipos', 'equipos.miembros'],
    });

    if (!proyecto) throw new NotFoundException('Proyecto no encontrado');

    const esPropietario = proyecto.investigadorPrincipal.id === usuarioId;
    const esMiembro = proyecto.equipos?.some((e: any) =>
      e.miembros?.some((m: any) => m.id === usuarioId),
    );

    if (!esPropietario && !esMiembro) {
      throw new ForbiddenException('No tienes permiso para ver comentarios');
    }

    return this.comentarioRepo.find({
      where: { proyecto_id: proyectoId },
      relations: ['usuario'],
      order: { fecha_comentario: 'DESC' },
    });
  }
}