import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { UsuariosModule } from '../modules/usuarios/usuarios.module';
import { JwtStrategy } from './jwt.strategy';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';

@Module({
  imports: [
    UsuariosModule,
    PassportModule,
    JwtModule.register({
      secret: 'wm5IM+87iUlaiiz8a0D5fpopv+9iB1mnNyaRiYA623M=',
      signOptions: { expiresIn: '1h' },
    }),
  ],
  providers: [AuthService,JwtStrategy],
  controllers: [AuthController],
  exports: [JwtStrategy, JwtModule],
})
export class AuthModule {}
