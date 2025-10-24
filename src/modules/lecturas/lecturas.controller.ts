import { Controller, Post, Get, Body, Param, UseGuards, Req } from '@nestjs/common';
import { LecturasService } from './lecturas.service';
import { CrearLecturaDto } from '../../dtos/lectura.dto';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import type { Request as ExpressRequest } from 'express';

@Controller('lecturas')
export class LecturasController {
  constructor(private readonly lecturasService: LecturasService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  crear(
    @Body() crearLecturaDto: CrearLecturaDto,
    @Req() req: ExpressRequest & { user: { id: number } },
  ) {
    return this.lecturasService.crear(crearLecturaDto, req.user.id);
  }

  @Get('muestra/:idMuestra')
  @UseGuards(JwtAuthGuard)
  encontrarPorMuestra(
    @Param('idMuestra') idMuestra: string,
    @Req() req: ExpressRequest & { user: { id: number } },
  ) {
    return this.lecturasService.encontrarPorMuestra(+idMuestra, req.user.id);
  }

}