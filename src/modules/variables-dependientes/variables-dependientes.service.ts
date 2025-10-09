import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { VariableDependiente } from '../../entities/variable-dependiente.entity';
import { CrearVariableDependienteDto } from '../../dtos/variable-dependiente.dto';
import { ProyectosService } from '../proyectos/proyectos.service';

@Injectable()
export class VariablesDependientesService {
  constructor(
    @InjectRepository(VariableDependiente)
    private readonly variablesRepo: Repository<VariableDependiente>,
    private readonly proyectosService: ProyectosService,
  ) {}

  async crear(crearVariableDto: CrearVariableDependienteDto, userId: number) {
    const proyecto = await this.proyectosService.encontrarPorId(crearVariableDto.id_proyecto, userId);
    const variable = this.variablesRepo.create({ ...crearVariableDto, proyecto });
    return this.variablesRepo.save(variable);
  }

  async encontrarPorId(id: number, userId: number) {
    const variable = await this.variablesRepo.findOne({
      where: { id, proyecto: { equipo: { miembros: { id: userId } } } },
      relations: ['proyecto', 'proyecto.equipo', 'proyecto.equipo.miembros'],
    });
    if (!variable) {
      throw new NotFoundException(`Variable con ID ${id} no encontrada`);
    }
    return variable;
  }

  async encontrarPorProyecto(idProyecto: number, userId: number) {
    const variables = await this.variablesRepo.find({
      where: { proyecto: { id: idProyecto, equipo: { miembros: { id: userId } } } },
      relations: ['proyecto', 'proyecto.equipo', 'proyecto.equipo.miembros'],
    });
    return variables;
  }
}