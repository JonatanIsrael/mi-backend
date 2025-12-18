import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Alerta, TipoAlerta } from '../../entities/alerta.entity';
import { Proyecto } from '../../entities/proyecto.entity';
import { CrearAlertaDto } from '../../dtos/alerta.dto';
import { UsuariosService } from '../usuarios/usuarios.service';

@Injectable()
export class AlertasService {
  constructor(
    @InjectRepository(Alerta)
    private readonly alertasRepo: Repository<Alerta>,
    @InjectRepository(Proyecto)
    private readonly proyectosRepo: Repository<Proyecto>,
    private readonly usuariosService: UsuariosService,
  ) {}

  async crear(crearAlertaDto: CrearAlertaDto, userId: number) {
    const proyecto = await this.proyectosRepo.findOne({
      where: { id: crearAlertaDto.id_proyecto },
      relations: ['investigadorPrincipal']
    });

    if (!proyecto || proyecto.investigadorPrincipal.id !== userId) {
      throw new NotFoundException(`Proyecto con ID ${crearAlertaDto.id_proyecto} no encontrado o no autorizado`);
    }

    const alerta = this.alertasRepo.create({ ...crearAlertaDto, proyecto });
    return this.alertasRepo.save(alerta);
  }

  async crearNotificacionProyectoCompartido(data: {
    usuarioId: number;
    proyectoId: number;
    proyectoNombre: string;
    compartidoPor: string;
    compartidoPorId: number;
  }) {
    const usuario = await this.usuariosService.encontrarPorId(data.usuarioId);
    if (!usuario) {
      throw new NotFoundException(`Usuario con ID ${data.usuarioId} no encontrado`);
    }

    const proyecto = await this.proyectosRepo.findOne({
      where: { id: data.proyectoId },
      relations: ['investigadorPrincipal']
    });

    if (!proyecto) {
      throw new NotFoundException(`Proyecto con ID ${data.proyectoId} no encontrado`);
    }

    const notificacion = this.alertasRepo.create({
      descripcion: `${data.compartidoPor} te ha compartido el proyecto "${data.proyectoNombre}"`,
      fechaEnvio: new Date(),
      leida: false,
      tipo: TipoAlerta.PROYECTO_COMPARTIDO,
      proyecto: { id: data.proyectoId },
      usuario: { id: data.usuarioId }
    });

    return await this.alertasRepo.save(notificacion);
  }

  async obtenerNotificacionesProyectosCompartidos(userId: number) {
    return this.alertasRepo.find({
      where: { 
        usuario: { id: userId },
        tipo: TipoAlerta.PROYECTO_COMPARTIDO
      },
      relations: ['proyecto', 'usuario'],
      order: { fechaEnvio: 'DESC' },
      take: 10,
    });
  }

  async obtenerAlertasUsuario(userId: number) {
    return this.alertasRepo.find({
      where: { usuario: { id: userId } },
      relations: ['proyecto', 'usuario'],
      order: { fechaEnvio: 'DESC' },
      take: 10,
    });
  }

  async marcarComoLeida(alertaId: number, userId: number) {
    const alerta = await this.alertasRepo.findOne({
      where: { id: alertaId, usuario: { id: userId } }
    });

    if (!alerta) {
      throw new NotFoundException('Alerta no encontrada');
    }

    alerta.leida = true;
    return await this.alertasRepo.save(alerta);
  }
}