import { Controller, Post, Get, Body, Param, UseGuards, Req } from '@nestjs/common';
import { TratamientosService } from './tratamientos.service';
import { CrearTratamientoDto } from '../../dtos/tratamiento.dto';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import type { Request as ExpressRequest } from 'express';

@Controller('tratamientos')
export class TratamientosController {
  constructor(private readonly tratamientosService: TratamientosService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  crear(
    @Body() crearTratamientoDto: CrearTratamientoDto,
    @Req() req: ExpressRequest & { user: { id: number } },
  ) {
    return this.tratamientosService.crear(crearTratamientoDto, req.user.id);
  }

  @Get('proyecto/:idProyecto')
  @UseGuards(JwtAuthGuard)
  encontrarPorProyecto(
    @Param('idProyecto') idProyecto: string,
    @Req() req: ExpressRequest & { user: { id: number } },
  ) {
    return this.tratamientosService.encontrarPorProyecto(+idProyecto, req.user.id);
  }
}
