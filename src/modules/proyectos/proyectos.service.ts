import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Proyecto, TipoDisenio } from '../../entities/proyecto.entity';
import { CrearProyectoDto, ActualizarProyectoDto, CrearProyectoCompletoDto} from '../../dtos/proyecto.dto';
import { Tratamiento } from '../../entities/tratamiento.entity';
import { VariableDependiente } from '../../entities/variable-dependiente.entity';
import { Repeticion } from '../../entities/repeticion.entity';
import { Muestra } from '../../entities/muestra.entity';
import { Lectura } from '../../entities/lectura.entity';

@Injectable()
export class ProyectosService {
  constructor(
    @InjectRepository(Proyecto) private readonly proyectosRepo: Repository<Proyecto>,
    @InjectRepository(Tratamiento) private readonly tratamientoRepo: Repository<Tratamiento>,
    @InjectRepository(VariableDependiente) private readonly variableRepo: Repository<VariableDependiente>,
    @InjectRepository(Repeticion) private readonly repeticionRepo: Repository<Repeticion>,
    @InjectRepository(Muestra) private readonly muestraRepo: Repository<Muestra>,
    @InjectRepository(Lectura) private readonly lecturaRepo: Repository<Lectura>,
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
    if (!proyecto) throw new NotFoundException(`Proyecto con ID ${id} no encontrado`);
    return proyecto;
  }

  async obtenerTodos() {
    return this.proyectosRepo.find();
  }

  async crearProyectoCompleto(dto: CrearProyectoCompletoDto) {
    const proyecto = new Proyecto();
    proyecto.nombre = dto.nombre;
    proyecto.descripcion = dto.descripcion ?? '';
    proyecto.tipoDisenio = dto.tipo_disenio as TipoDisenio;
    proyecto.id_investigador_principal = dto.userId;
    await this.proyectosRepo.save(proyecto);

    const tratamientosGuardados: Tratamiento[] = [];
    for (const t of dto.tratamientos) {
      const tratamiento = new Tratamiento();
      tratamiento.nombre = t.nombre;
      tratamiento.descripcion = t.descripcion ?? '';
      tratamiento.esTestigo = t.esTestigo ?? false;
      tratamiento.variableIndependiente = t.variableIndependiente;
      tratamiento.valor = t.valor;
      tratamiento.unidad = t.unidad;
      tratamiento.proyecto = proyecto;
      await this.tratamientoRepo.save(tratamiento);
      tratamientosGuardados.push(tratamiento);

      for (let i = 1; i <= dto.numRepeticiones; i++) {
        const repeticion = new Repeticion();
        repeticion.tratamiento = tratamiento;
        repeticion.numero = i;
        await this.repeticionRepo.save(repeticion);

        const muestra = new Muestra();
        muestra.repeticion = repeticion;
        muestra.numero = i;
        muestra.codigo = `M-${tratamiento.id}-${i}`;
        await this.muestraRepo.save(muestra);
      }
    }

    const variablesGuardadas: VariableDependiente[] = [];
    for (const v of dto.variablesDependientes) {
      if (!v.id_proyecto) v.id_proyecto = proyecto.id;
      const variable = new VariableDependiente();
      variable.nombreCompleto = v.nombreCompleto;
      variable.clave = v.clave;
      variable.unidad = v.unidad;
      variable.proyecto = proyecto;
      await this.variableRepo.save(variable);
      variablesGuardadas.push(variable);
    }

    const todasMuestras = await this.muestraRepo.find({ relations: ['repeticion', 'repeticion.tratamiento'] });
    for (const m of todasMuestras) {
      for (const v of variablesGuardadas) {
        const lectura = new Lectura();
        lectura.muestra = m;
        lectura.variableDependiente = v;
        lectura.valor = 0;
        lectura.fechaLectura = new Date();
        await this.lecturaRepo.save(lectura);
      }
    }

    return { proyecto, tratamientos: tratamientosGuardados, variables: variablesGuardadas };
  }

  async exportarMatriz(id: number, userId: number): Promise<Buffer> {
    // placeholder para exportar matriz, implementar lógica real más adelante
    return Buffer.from('');
  }
}
