export class CrearUsuarioDto {
  nombre!: string;
  correo!: string;
  contrasena!: string;
  rol!: string;
}

export class LoginUsuarioDto {
  correo!: string;
  contrasena!: string;
}