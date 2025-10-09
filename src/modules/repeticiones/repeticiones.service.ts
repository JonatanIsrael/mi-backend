import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Repeticion } from '../../entities/repeticion.entity';
import { CrearRepeticionDto } from '../../dtos/repeticion.dto';
import { TratamientosService } from '../tratamientos/tratamientos.service';

@Injectable()
export class RepeticionesService {
  constructor(
    @InjectRepository(Repeticion)
    private readonly repeticionesRepo: Repository<Repeticion>,
    private readonly tratamientosService: TratamientosService,
  ) {}

  async crear(crearRepeticionDto: CrearRepeticionDto, userId: number) {
    const tratamiento = await this.tratamientosService.encontrarPorId(crearRepeticionDto.id_tratamiento, userId);
    const repeticion = this.repeticionesRepo.create({ ...crearRepeticionDto, tratamiento });
    return this.repeticionesRepo.save(repeticion);
  }

  async encontrarPorId(id: number, userId: number) {
    const repeticion = await this.repeticionesRepo.findOne({
      where: { id, tratamiento: { proyecto: { equipo: { miembros: { id: userId } } } } },
      relations: ['tratamiento', 'tratamiento.proyecto', 'tratamiento.proyecto.equipo', 'tratamiento.proyecto.equipo.miembros'],
    });
    if (!repeticion) {
      throw new NotFoundException(`Repetición con ID ${id} no encontrada`);
    }
    return repeticion;
  }

  async encontrarPorTratamiento(idTratamiento: number, userId: number) {
    const repeticiones = await this.repeticionesRepo.find({
      where: { tratamiento: { id: idTratamiento, proyecto: { equipo: { miembros: { id: userId } } } } },
      relations: ['tratamiento', 'tratamiento.proyecto', 'tratamiento.proyecto.equipo', 'tratamiento.proyecto.equipo.miembros'],
    });
    return repeticiones;
  }
}