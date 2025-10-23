import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Repeticion } from '../../entities/repeticion.entity';
import { CrearRepeticionDto } from '../../dtos/repeticion.dto';
import { TratamientosService } from '../tratamientos/tratamientos.service';

@Injectable()
export class RepeticionesService {
  constructor(
    @InjectRepository(Repeticion) private readonly repeticionesRepo: Repository<Repeticion>,
    private readonly tratamientosService: TratamientosService,
  ) {}

  async crear(crearRepeticionDto: CrearRepeticionDto, userId: number) {
    const tratamiento = await this.tratamientosService.encontrarPorId(crearRepeticionDto.tratamientoId, userId);
    const repeticion = this.repeticionesRepo.create({ ...crearRepeticionDto, tratamiento });
    return this.repeticionesRepo.save(repeticion);
  }

  async encontrarPorId(id: number, userId: number) {
    const repeticion = await this.repeticionesRepo
      .createQueryBuilder('repeticion')
      .leftJoinAndSelect('repeticion.tratamiento', 'tratamiento')
      .leftJoinAndSelect('tratamiento.proyecto', 'proyecto')
      .leftJoinAndSelect('proyecto.equipo', 'equipo')
      .leftJoinAndSelect('equipo.miembros', 'miembro')
      .where('repeticion.id = :id', { id })
      .andWhere('miembro.id = :userId', { userId })
      .getOne();

    if (!repeticion) throw new NotFoundException(`Repetición con ID ${id} no encontrada`);
    return repeticion;
  }

  async encontrarPorTratamiento(idTratamiento: number, userId: number) {
    return this.repeticionesRepo
      .createQueryBuilder('repeticion')
      .leftJoinAndSelect('repeticion.tratamiento', 'tratamiento')
      .leftJoinAndSelect('tratamiento.proyecto', 'proyecto')
      .leftJoinAndSelect('proyecto.equipo', 'equipo')
      .leftJoinAndSelect('equipo.miembros', 'miembro')
      .where('tratamiento.id = :idTratamiento', { idTratamiento })
      .andWhere('miembro.id = :userId', { userId })
      .getMany();
  }
}
