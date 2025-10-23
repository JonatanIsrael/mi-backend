import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tratamiento } from '../../entities/tratamiento.entity';
import { CrearTratamientoDto } from '../../dtos/tratamiento.dto';
import { ProyectosService } from '../proyectos/proyectos.service';

@Injectable()
export class TratamientosService {
  constructor(
    @InjectRepository(Tratamiento) private readonly tratamientosRepo: Repository<Tratamiento>,
    private readonly proyectosService: ProyectosService,
  ) {}

  async crear(crearTratamientoDto: CrearTratamientoDto, userId: number) {
    if (!crearTratamientoDto.id_proyecto) throw new Error('id_proyecto es requerido');
    const proyecto = await this.proyectosService.encontrarPorId(crearTratamientoDto.id_proyecto, userId);
    const tratamiento = this.tratamientosRepo.create({ ...crearTratamientoDto, proyecto });
    return this.tratamientosRepo.save(tratamiento);
  }

  async encontrarPorId(id: number, userId: number) {
    const tratamiento = await this.tratamientosRepo.findOne({
      where: { id, proyecto: { id_investigador_principal: userId } },
      relations: ['proyecto'],
    });
    if (!tratamiento) throw new NotFoundException(`Tratamiento con ID ${id} no encontrado`);
    return tratamiento;
  }

  async encontrarPorProyecto(idProyecto: number, userId: number) {
    return this.tratamientosRepo.find({
      where: { proyecto: { id: idProyecto, id_investigador_principal: userId } },
      relations: ['proyecto'],
    });
  }
}
