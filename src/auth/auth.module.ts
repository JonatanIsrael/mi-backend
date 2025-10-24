import { Module, forwardRef } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './jwt.strategy';
import { UsuariosModule } from '../modules/usuarios/usuarios.module'; // 🔹 ruta corregida

@Module({
  imports: [
    forwardRef(() => UsuariosModule),
    PassportModule,
    JwtModule.register({
      secret: 'tu_secreto_jwt',
      signOptions: { expiresIn: '12h' },
    }),
  ],
  providers: [AuthService, JwtStrategy],
  controllers: [AuthController],
  exports: [AuthService, JwtStrategy, JwtModule],
})
export class AuthModule {}
