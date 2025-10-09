import { Controller, Post, Body, UseGuards, Req } from '@nestjs/common';
import { EquiposService } from './equipos.service';
import { CrearEquipoDto } from '../../dtos/equipo.dto';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import type { Request as ExpressRequest } from 'express';

@Controller('equipos')
export class EquiposController {
  constructor(private readonly equiposService: EquiposService) {}

  @Post()
  // @UseGuards(JwtAuthGuard) //
  crear(
    @Body() crearEquipoDto: CrearEquipoDto,
    @Req() req: ExpressRequest & { user: { id: number } },
  ) {
    return this.equiposService.crear(crearEquipoDto, req.user.id);
  }
}
