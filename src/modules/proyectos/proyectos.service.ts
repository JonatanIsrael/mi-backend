import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Proyecto } from '../../entities/proyecto.entity';
import { CrearProyectoDto, ActualizarProyectoDto } from '../../dtos/proyecto.dto';

@Injectable()
export class ProyectosService {
  constructor(
    @InjectRepository(Proyecto)
    private readonly proyectosRepo: Repository<Proyecto>,
  ) {}

  async crear(crearProyectoDto: CrearProyectoDto, userId: number) {
    const proyecto = this.proyectosRepo.create({
      ...crearProyectoDto,
      id_investigador_principal: userId,
    });
    return this.proyectosRepo.save(proyecto);
  }

  async actualizar(id: number, actualizarProyectoDto: ActualizarProyectoDto, userId: number) {
    const proyecto = await this.encontrarPorId(id, userId);
    Object.assign(proyecto, actualizarProyectoDto);
    return this.proyectosRepo.save(proyecto);
  }

  async encontrarPorId(id: number, userId: number) {
    const proyecto = await this.proyectosRepo.findOne({
      where: { id, id_investigador_principal: userId },
    });
    if (!proyecto) {
      throw new NotFoundException(`Proyecto con ID ${id} no encontrado`);
    }
    return proyecto;
  }

  async exportarMatriz(id: number, userId: number) {
    return Buffer.from(''); // Placeholder
  }

  // 🔹 Método agregado para probar conexión a DB
  async obtenerTodos() {
    return this.proyectosRepo.find();
  }
}