import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Observacion } from '../../entities/observacion.entity';
import { CrearObservacionDto } from '../../dtos/observacion.dto';
import { LecturasService } from '../lecturas/lecturas.service';

@Injectable()
export class ObservacionesService {
  constructor(
    @InjectRepository(Observacion)
    private readonly observacionesRepo: Repository<Observacion>,
    private readonly lecturasService: LecturasService,
  ) {}

  async crear(crearObservacionDto: CrearObservacionDto, userId: number) {
    const lectura = await this.lecturasService.encontrarPorId(crearObservacionDto.id_lectura, userId);
    const observacion = this.observacionesRepo.create({ ...crearObservacionDto, lectura, fecha: new Date() });
    return this.observacionesRepo.save(observacion);
  }
}