import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Lectura } from '../../entities/lectura.entity';
import { CrearLecturaDto } from '../../dtos/lectura.dto';
import { MuestrasService } from '../muestras/muestras.service';
import { VariablesDependientesService } from '../variables-dependientes/variables-dependientes.service';

@Injectable()
export class LecturasService {
  constructor(
    @InjectRepository(Lectura)
    private readonly lecturasRepo: Repository<Lectura>,
    private readonly muestrasService: MuestrasService,
    private readonly variablesService: VariablesDependientesService,
  ) {}

  // Método crear
  async crear(crearLecturaDto: CrearLecturaDto, userId: number) {
    const muestra = await this.muestrasService.encontrarPorId(crearLecturaDto.id_muestra, userId);
    const variableDependiente = await this.variablesService.encontrarPorId(crearLecturaDto.id_variable_dependiente, userId);

    const lectura = this.lecturasRepo.create({
      ...crearLecturaDto,
      muestra,
      variableDependiente, // coincide con la propiedad de la entidad
    });

    return this.lecturasRepo.save(lectura);
  }

  async encontrarPorId(id: number, userId: number) {
    const lectura = await this.lecturasRepo
      .createQueryBuilder('lectura')
      .leftJoinAndSelect('lectura.muestra', 'muestra')
      .leftJoinAndSelect('muestra.repeticion', 'repeticion')
      .leftJoinAndSelect('repeticion.tratamiento', 'tratamiento')
      .leftJoinAndSelect('tratamiento.proyecto', 'proyecto')
      .leftJoinAndSelect('proyecto.equipo', 'equipo')
      .leftJoinAndSelect('equipo.miembros', 'miembro')
      .where('lectura.id = :id', { id })
      .andWhere('miembro.id = :userId', { userId })
      .getOne();

    if (!lectura) {
      throw new NotFoundException(`Lectura con ID ${id} no encontrada`);
    }
    return lectura;
  }

  async encontrarPorMuestra(idMuestra: number, userId: number) {
    const lecturas = await this.lecturasRepo
      .createQueryBuilder('lectura')
      .leftJoinAndSelect('lectura.muestra', 'muestra')
      .leftJoinAndSelect('muestra.repeticion', 'repeticion')
      .leftJoinAndSelect('repeticion.tratamiento', 'tratamiento')
      .leftJoinAndSelect('tratamiento.proyecto', 'proyecto')
      .leftJoinAndSelect('proyecto.equipo', 'equipo')
      .leftJoinAndSelect('equipo.miembros', 'miembro')
      .where('muestra.id = :idMuestra', { idMuestra })
      .andWhere('miembro.id = :userId', { userId })
      .getMany();

    return lecturas;
  }
}
