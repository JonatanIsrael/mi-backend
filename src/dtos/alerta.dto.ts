import { TipoAlerta } from "entities/alerta.entity";

export class CrearAlertaDto {
  tipo!: TipoAlerta;
  mensaje!: string;
  id_proyecto!: number;
}
