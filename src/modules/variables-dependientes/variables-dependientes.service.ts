import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { VariableDependiente } from '../../entities/variable-dependiente.entity';
import { CrearVariableDto } from '../../dtos/variable-dependiente.dto';
import { ProyectosService } from '../proyectos/proyectos.service';

@Injectable()
export class VariablesDependientesService {
  constructor(
    @InjectRepository(VariableDependiente) private readonly variablesRepo: Repository<VariableDependiente>,
    private readonly proyectosService: ProyectosService,
  ) {}

  async crear(crearVariableDto: CrearVariableDto, userId: number) {
    if (!crearVariableDto.id_proyecto) throw new Error('id_proyecto es requerido');
    const proyecto = await this.proyectosService.encontrarPorId(crearVariableDto.id_proyecto, userId);
    const variable = this.variablesRepo.create({ ...crearVariableDto, proyecto });
    return this.variablesRepo.save(variable);
  }

  async encontrarPorId(id: number, userId: number) {
    const variable = await this.variablesRepo
      .createQueryBuilder('variable')
      .leftJoinAndSelect('variable.proyecto', 'proyecto')
      .leftJoinAndSelect('proyecto.equipo', 'equipo')
      .leftJoinAndSelect('equipo.miembros', 'miembro')
      .where('variable.id = :id', { id })
      .andWhere('miembro.id = :userId', { userId })
      .getOne();

    if (!variable) throw new NotFoundException(`Variable con ID ${id} no encontrada`);
    return variable;
  }

  async encontrarPorProyecto(idProyecto: number, userId: number) {
    return this.variablesRepo
      .createQueryBuilder('variable')
      .leftJoinAndSelect('variable.proyecto', 'proyecto')
      .leftJoinAndSelect('proyecto.equipo', 'equipo')
      .leftJoinAndSelect('equipo.miembros', 'miembro')
      .where('proyecto.id = :idProyecto', { idProyecto })
      .andWhere('miembro.id = :userId', { userId })
      .getMany();
  }
}
