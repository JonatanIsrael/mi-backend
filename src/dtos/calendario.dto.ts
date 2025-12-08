import { IsString, IsEnum, IsDateString, IsInt, IsOptional, IsBoolean } from 'class-validator';
import { TipoEvento } from '../entities/calendario.entity';

export class CrearCalendarioDto {
  @IsInt()
  id_proyecto!: number;

  @IsDateString()
  fecha!: string;

  @IsString()
  descripcion!: string;

  @IsEnum(TipoEvento)
  tipoEvento!: TipoEvento;

  @IsBoolean()
  @IsOptional()
  crearNotificacionInmediata?: boolean;

  @IsBoolean()
  @IsOptional()
  notificado?: boolean;

  @IsBoolean()
  @IsOptional()
  notificado24h?: boolean;

  @IsBoolean()
  @IsOptional()
  notificado1h?: boolean;
}