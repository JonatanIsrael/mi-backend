// src/modules/reportes/reportes.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReportesService } from './reportes.service';
import { ReportesController } from './reportes.controller';
import { Lectura } from '../../entities/lectura.entity';
import { Calendario } from '../../entities/calendario.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Lectura, Calendario])],
  providers: [ReportesService],
  controllers: [ReportesController],
})
export class ReportesModule {}