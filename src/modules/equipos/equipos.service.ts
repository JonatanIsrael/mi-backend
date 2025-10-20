import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Equipo } from '../../entities/equipo.entity';
import { CrearEquipoDto } from '../../dtos/equipo.dto';
import { ProyectosService } from '../proyectos/proyectos.service';
import { UsuariosService } from '../usuarios/usuarios.service';

@Injectable()
export class EquiposService {
  constructor(
    @InjectRepository(Equipo)
    private readonly equiposRepo: Repository<Equipo>,
    private readonly proyectosService: ProyectosService,
    private readonly usuariosService: UsuariosService,
  ) {}

  async crear(crearEquipoDto: CrearEquipoDto, userId: number) {
    // Obtener el proyecto
    const proyecto = await this.proyectosService.encontrarPorId(
      crearEquipoDto.id_proyecto,
      userId,
    );
    if (!proyecto) {
      throw new NotFoundException(
        `Proyecto con id ${crearEquipoDto.id_proyecto} no encontrado`,
      );
    }

    // Obtener los usuarios (miembros) por sus IDs
    const miembros = await Promise.all(
      crearEquipoDto.id_miembros.map((id) =>
        this.usuariosService.encontrarPorId(id),
      ),
    );

    // Crear el equipo con relaciones correctas
    const equipo = this.equiposRepo.create({
      proyecto,
      miembros,
      rolEnEquipo: crearEquipoDto.rolEnEquipo,
    });

    return this.equiposRepo.save(equipo);
  }
}

