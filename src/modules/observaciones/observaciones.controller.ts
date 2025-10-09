import { Controller, Post, Body, UseGuards, Req } from '@nestjs/common';
import { ObservacionesService } from './observaciones.service';
import { CrearObservacionDto } from '../../dtos/observacion.dto';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import type { Request as ExpressRequest } from 'express';

@Controller('observaciones')
export class ObservacionesController {
  constructor(private readonly observacionesService: ObservacionesService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  crear(
    @Body() crearObservacionDto: CrearObservacionDto,
    @Req() req: ExpressRequest & { user: { id: number } },
  ) {
    return this.observacionesService.crear(crearObservacionDto, req.user.id);
  }
}
