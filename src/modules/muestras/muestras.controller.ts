import { Controller, Post, Get, Body, Param, UseGuards, Req } from '@nestjs/common';
import { MuestrasService } from './muestras.service';
import { CrearMuestraDto } from '../../dtos/muestra.dto';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import type { Request as ExpressRequest } from 'express';

@Controller('muestras')
export class MuestrasController {
  constructor(private readonly muestrasService: MuestrasService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  crear(
    @Body() crearMuestraDto: CrearMuestraDto,
    @Req() req: ExpressRequest & { user: { id: number } },
  ) {
    return this.muestrasService.crear(crearMuestraDto, req.user.id);
  }

  @Get('repeticion/:idRepeticion')
  @UseGuards(JwtAuthGuard)
  encontrarPorRepeticion(
    @Param('idRepeticion') idRepeticion: string,
    @Req() req: ExpressRequest & { user: { id: number } },
  ) {
    return this.muestrasService.encontrarPorRepeticion(+idRepeticion, req.user.id);
  }
}
