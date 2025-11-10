export class CrearUsuarioDto {
  usuario!: string;
  nombre!: string;
  apellido_p!: string;
  apellido_m!: string;
  correo!: string;
  contrasena!: string;
  rol!: string;
}

export class LoginUsuarioDto {
  correo?: string;
  usuario?: string;
  contrasena!: string;
}

export class ActualizarUsuarioDto {
  nombre?: string;
  apellido_p?: string;
  apellido_m?: string;
  correo?: string;
  contrasena?: string;
  rol?: string;

  // Agregar índice para permitir acceso dinámico
  [key: string]: any;
}