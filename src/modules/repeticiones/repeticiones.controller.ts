import { Controller, Post, Get, Body, Param, UseGuards, Req } from '@nestjs/common';
import { RepeticionesService } from './repeticiones.service';
import { CrearRepeticionDto } from '../../dtos/repeticion.dto';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import type { Request as ExpressRequest } from 'express';

@Controller('repeticiones')
export class RepeticionesController {
  constructor(private readonly repeticionesService: RepeticionesService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  crear(
    @Body() crearRepeticionDto: CrearRepeticionDto,
    @Req() req: ExpressRequest & { user: { id: number } },
  ) {
    return this.repeticionesService.crear(crearRepeticionDto, req.user.id);
  }

  @Get('tratamiento/:idTratamiento')
  @UseGuards(JwtAuthGuard)
  encontrarPorTratamiento(
    @Param('idTratamiento') idTratamiento: string,
    @Req() req: ExpressRequest & { user: { id: number } },
  ) {
    return this.repeticionesService.encontrarPorTratamiento(+idTratamiento, req.user.id);
  }
}
