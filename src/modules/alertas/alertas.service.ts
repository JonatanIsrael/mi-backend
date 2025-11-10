import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Alerta } from '../../entities/alerta.entity';
import { CrearAlertaDto } from '../../dtos/alerta.dto';
import { ProyectosService } from '../proyectos/proyectos.service';

@Injectable()
export class AlertasService {
  constructor(
    @InjectRepository(Alerta)
    private readonly alertasRepo: Repository<Alerta>,
    private readonly proyectosService: ProyectosService,
  ) {}

  async crear(crearAlertaDto: CrearAlertaDto, userId: number) {
    // 1️⃣ Validar que el proyecto existe y pertenece al usuario
    const proyecto = await this.proyectosService.encontrarPorId(crearAlertaDto.id_proyecto, userId);

    if (!proyecto) {
      throw new NotFoundException(`Proyecto con ID ${crearAlertaDto.id_proyecto} no encontrado o no autorizado`);
    }

    // 2️⃣ Crear la alerta y asignarle el proyecto
    const alerta = this.alertasRepo.create({ ...crearAlertaDto, proyecto });

    // 3️⃣ Guardar en la base de datos
    return this.alertasRepo.save(alerta);
  }

  // 🔹 NUEVO MÉTODO - Obtener alertas del usuario
  async obtenerAlertasUsuario(userId: number) {
    return this.alertasRepo.find({
      where: { usuario: { id: userId } },
      relations: ['proyecto', 'usuario'],
      order: { fechaEnvio: 'DESC' }, // Usar fechaEnvio en lugar de fecha_creacion
      take: 10, // Últimas 10 alertas
    });
  }
}