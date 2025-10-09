import { Test, TestingModule } from '@nestjs/testing';
import { ObservacionesController } from './observaciones.controller';

describe('ObservacionesController', () => {
  let controller: ObservacionesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ObservacionesController],
    }).compile();

    controller = module.get<ObservacionesController>(ObservacionesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
