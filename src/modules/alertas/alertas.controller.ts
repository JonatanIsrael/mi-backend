import { Controller, Post, Body, UseGuards, Req } from '@nestjs/common';
import { AlertasService } from './alertas.service';
import { CrearAlertaDto } from '../../dtos/alerta.dto';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import type { Request as ExpressRequest } from 'express';

@Controller('alertas')
export class AlertasController {
  constructor(private readonly alertasService: AlertasService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  crear(
    @Body() crearAlertaDto: CrearAlertaDto,
    @Req() req: ExpressRequest & { user: { id: number } },
  ) {
    return this.alertasService.crear(crearAlertaDto, req.user.id);
  }
}