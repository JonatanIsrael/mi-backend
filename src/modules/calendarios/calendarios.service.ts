import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Calendario } from '../../entities/calendario.entity';
import { CrearCalendarioDto } from '../../dtos/calendario.dto';
import { ProyectosService } from '../proyectos/proyectos.service';

@Injectable()
export class CalendariosService {
  constructor(
    @InjectRepository(Calendario)
    private readonly calendariosRepo: Repository<Calendario>,
    private readonly proyectosService: ProyectosService,
  ) {}

  // Crear un calendario asignado a un proyecto
  async crear(crearCalendarioDto: CrearCalendarioDto, userId: number) {
    const proyecto = await this.proyectosService.encontrarPorId(crearCalendarioDto.id_proyecto, userId);
    const calendario = this.calendariosRepo.create({ ...crearCalendarioDto, proyecto });
    return this.calendariosRepo.save(calendario);
  }

  // Obtener todos los calendarios de un proyecto específico
  async encontrarPorProyecto(idProyecto: number, userId: number) {
    const proyecto = await this.proyectosService.encontrarPorId(idProyecto, userId);
    return this.calendariosRepo.find({ where: { proyecto } });
  }
}
