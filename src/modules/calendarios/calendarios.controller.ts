import { Controller, Post, Get, Body, Param, UseGuards, Req } from '@nestjs/common';
import { CalendariosService } from './calendarios.service';
import { CrearCalendarioDto } from '../../dtos/calendario.dto';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import type { Request as ExpressRequest } from 'express';

@Controller('calendarios')
export class CalendariosController {
  constructor(private readonly calendariosService: CalendariosService) {}

  // Crear un calendario
  @Post()
  @UseGuards(JwtAuthGuard)
  crear(
    @Body() crearCalendarioDto: CrearCalendarioDto,
    @Req() req: ExpressRequest & { user: { id: number } },
  ) {
    return this.calendariosService.crear(crearCalendarioDto, req.user.id);
  }

  // Listar calendarios por proyecto
  @Get('proyecto/:idProyecto')
  @UseGuards(JwtAuthGuard)
  encontrarPorProyecto(
    @Param('idProyecto') idProyecto: string,
    @Req() req: ExpressRequest & { user: { id: number } },
  ) {
    return this.calendariosService.encontrarPorProyecto(+idProyecto, req.user.id);
  }
}
