import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Comentario } from '../../entities/comentario.entity';
import { Proyecto } from '../../entities/proyecto.entity';
import { Equipo } from '../../entities/equipo.entity';
import { CrearComentarioDto } from '../../dtos/comentario.dto';
import { Alerta, TipoAlerta } from '../../entities/alerta.entity';
import { Usuario } from '../../entities/usuario.entity';

@Injectable()
export class ComentariosService {
  constructor(
    @InjectRepository(Comentario)
    private readonly comentarioRepo: Repository<Comentario>,

    @InjectRepository(Proyecto)
    private readonly proyectoRepo: Repository<Proyecto>,

    @InjectRepository(Alerta)
    private readonly alertaRepo: Repository<Alerta>,
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

    const comentario = this.comentarioRepo.create({
      comentario: dto.comentario,
      usuario: { id: usuarioId } as Usuario, 
      proyecto: { id: proyectoId } as Proyecto,  
    });

    const comentarioGuardado = await this.comentarioRepo.save(comentario);

 
    const usuariosIds = new Set<number>();
    usuariosIds.add(proyecto.investigadorPrincipal.id);

    proyecto.equipos?.forEach((equipo: any) => {
      equipo.miembros?.forEach((miembro: any) => {
        usuariosIds.add(miembro.id);
      });
    });

    const alertas = Array.from(usuariosIds)
      .filter((id) => id !== usuarioId)
      .map((id) =>
        this.alertaRepo.create({
          usuario: { id } as any,
          proyecto: { id: proyectoId } as any,
          descripcion: `Nuevo comentario en el proyecto "${proyecto.nombre}"`,
          tipo: TipoAlerta.RECORDATORIO,
        }),
      );

    if (alertas.length > 0) {
      await this.alertaRepo.save(alertas);
    }


    const comentarioConUsuario = await this.comentarioRepo.findOne({
      where: { id: comentarioGuardado.id },
      relations: ['usuario', 'proyecto'],
    });

    if (!comentarioConUsuario) {
      throw new NotFoundException('Error al recuperar el comentario creado');
    }

    return comentarioConUsuario;
  }


  async obtenerComentarios(proyectoId: number, usuarioId: number): Promise<any[]> {
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

   
    const comentarios = await this.comentarioRepo.find({
      where: { proyecto: { id: proyectoId } },
      relations: ['usuario'],
      order: { fecha_comentario: 'DESC' },
    });


    return comentarios.map((c) => ({
      ...c,
      fecha_comentario: c.fecha_comentario
        ? new Date(c.fecha_comentario).toISOString()
        : null,
      usuario: c.usuario
        ? {
            id: c.usuario.id,
            usuario: c.usuario.usuario,
            nombre: c.usuario.nombre,
            apellido_p: c.usuario.apellido_p,
            apellido_m: c.usuario.apellido_m,
          }
        : { id: 0, usuario: 'desconocido', nombre: 'Usuario desconocido' },
    }));
  }
}
