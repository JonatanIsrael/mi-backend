import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Usuario, TipoUsuario } from '../entities/usuario.entity';

import * as bcrypt from 'bcrypt';

@Injectable()
export class SeedService implements OnApplicationBootstrap {

  constructor(
    @InjectRepository(Usuario)
    private readonly userRepo: Repository<Usuario>,
  ) {}

  async onApplicationBootstrap() {
    await this.crearAdmin();
  }

  async crearAdmin() {

    const existe = await this.userRepo.findOne({
      where:{
        correo:'admin@admin.com'
      }
    });

    if(existe){
      return;
    }

    const hash = await bcrypt.hash('123456',10);

    const admin = this.userRepo.create({

      usuario:'admin',

      nombre:'Administrador',

      apellido_p:'Sistema',

      apellido_m:'Principal',

      correo:'admin@admin.com',

      contrasena:hash,

      rol:TipoUsuario.ADMINISTRADOR

    });

    await this.userRepo.save(admin);
  }

}