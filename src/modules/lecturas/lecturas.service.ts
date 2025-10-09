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

  async crear(crearLecturaDto: CrearLecturaDto, userId: number) {
    const muestra = await this.muestrasService.encontrarPorId(crearLecturaDto.id_muestra, userId);
    const variable = await this.variablesService.encontrarPorId(crearLecturaDto.id_variable_dependiente, userId);
    const lectura = this.lecturasRepo.create({ ...crearLecturaDto, muestra, variable });
    return this.lecturasRepo.save(lectura);
  }

  async encontrarPorId(id: number, userId: number) {
    const lectura = await this.lecturasRepo.findOne({
      where: { id, muestra: { repeticion: { tratamiento: { proyecto: { equipo: { miembros: { id: userId } } } } } } },
      relations: ['muestra', 'muestra.repeticion', 'muestra.repeticion.tratamiento', 'muestra.repeticion.tratamiento.proyecto', 'muestra.repeticion.tratamiento.proyecto.equipo', 'muestra.repeticion.tratamiento.proyecto.equipo.miembros'],
    });
    if (!lectura) {
      throw new NotFoundException(`Lectura con ID ${id} no encontrada`);
    }
    return lectura;
  }

  async encontrarPorMuestra(idMuestra: number, userId: number) {
    const lecturas = await this.lecturasRepo.find({
      where: { muestra: { id: idMuestra, repeticion: { tratamiento: { proyecto: { equipo: { miembros: { id: userId } } } } } } },
      relations: ['muestra', 'muestra.repeticion', 'muestra.repeticion.tratamiento', 'muestra.repeticion.tratamiento.proyecto', 'muestra.repeticion.tratamiento.proyecto.equipo', 'muestra.repeticion.tratamiento.proyecto.equipo.miembros'],
    });
    return lecturas;
  }
}