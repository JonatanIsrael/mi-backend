import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Muestra } from '../../entities/muestra.entity';
import { CrearMuestraDto } from '../../dtos/muestra.dto';
import { RepeticionesService } from '../repeticiones/repeticiones.service';

@Injectable()
export class MuestrasService {
  constructor(
    @InjectRepository(Muestra)
    private readonly muestrasRepo: Repository<Muestra>,
    private readonly repeticionesService: RepeticionesService,
  ) {}

  async crear(crearMuestraDto: CrearMuestraDto, userId: number) {
    const repeticion = await this.repeticionesService.encontrarPorId(crearMuestraDto.id_repeticion, userId);
    const muestra = this.muestrasRepo.create({ ...crearMuestraDto, repeticion });
    return this.muestrasRepo.save(muestra);
  }

  async encontrarPorId(id: number, userId: number) {
  const muestra = await this.muestrasRepo
    .createQueryBuilder('muestra')
    .leftJoinAndSelect('muestra.repeticion', 'repeticion')
    .leftJoinAndSelect('repeticion.tratamiento', 'tratamiento')
    .leftJoinAndSelect('tratamiento.proyecto', 'proyecto')
    .leftJoinAndSelect('proyecto.equipo', 'equipo')
    .leftJoinAndSelect('equipo.miembros', 'miembro')
    .where('muestra.id = :id', { id })
    .andWhere('miembro.id = :userId', { userId })
    .getOne();

  if (!muestra) {
    throw new NotFoundException(`Muestra con ID ${id} no encontrada`);
  }
  return muestra;
}

async encontrarPorRepeticion(idRepeticion: number, userId: number) {
  const muestras = await this.muestrasRepo
    .createQueryBuilder('muestra')
    .leftJoinAndSelect('muestra.repeticion', 'repeticion')
    .leftJoinAndSelect('repeticion.tratamiento', 'tratamiento')
    .leftJoinAndSelect('tratamiento.proyecto', 'proyecto')
    .leftJoinAndSelect('proyecto.equipo', 'equipo')
    .leftJoinAndSelect('equipo.miembros', 'miembro')
    .where('repeticion.id = :idRepeticion', { idRepeticion })
    .andWhere('miembro.id = :userId', { userId })
    .getMany();

  return muestras;
}

}