import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';

// 🔹 Entities
import { Usuario } from './entities/usuario.entity';
import { Proyecto } from './entities/proyecto.entity';
import { Equipo } from './entities/equipo.entity';
import { Tratamiento } from './entities/tratamiento.entity';
import { Repeticion } from './entities/repeticion.entity';
import { Muestra } from './entities/muestra.entity';
import { Lectura } from './entities/lectura.entity';
import { VariableDependiente } from './entities/variable-dependiente.entity';
import { Calendario } from './entities/calendario.entity';
import { Alerta } from './entities/alerta.entity';
import { Observacion } from './entities/observacion.entity';

// 🔹 Modules
import { AuthModule } from './auth/auth.module';
import { UsuariosModule } from './modules/usuarios/usuarios.module';
import { ProyectosModule } from './modules/proyectos/proyectos.module';
import { EquiposModule } from './modules/equipos/equipos.module';
import { TratamientosModule } from './modules/tratamientos/tratamientos.module';
import { RepeticionesModule } from './modules/repeticiones/repeticiones.module';
import { MuestrasModule } from './modules/muestras/muestras.module';
import { LecturasModule } from './modules/lecturas/lecturas.module';
import { VariablesDependientesModule } from './modules/variables-dependientes/variables-dependientes.module';
import { CalendariosModule } from './modules/calendarios/calendarios.module';
import { AlertasModule } from './modules/alertas/alertas.module';
import { ObservacionesModule } from './modules/observaciones/observaciones.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }), // 🔹 Configuración global de variables de entorno
TypeOrmModule.forRoot({
  type: 'mysql',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  username: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || '',
  database: process.env.DB_NAME || 'fenologia',
  entities: [
    Usuario,
    Proyecto,
    Equipo,
    Tratamiento,
    Repeticion,
    Muestra,
    Lectura,
    VariableDependiente,
    Calendario,
    Alerta,
    Observacion,
  ],
  synchronize: true,
}),

    // 🔹 Módulos de la aplicación
    AuthModule,
    UsuariosModule,
    ProyectosModule,
    EquiposModule,
    TratamientosModule,
    RepeticionesModule,
    MuestrasModule,
    LecturasModule,
    VariablesDependientesModule,
    CalendariosModule,
    AlertasModule,
    ObservacionesModule,
  ],
})
export class AppModule {}
