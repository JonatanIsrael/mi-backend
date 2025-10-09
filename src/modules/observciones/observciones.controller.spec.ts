import { Test, TestingModule } from '@nestjs/testing';
import { ObservcionesController } from './observciones.controller';

describe('ObservcionesController', () => {
  let controller: ObservcionesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ObservcionesController],
    }).compile();

    controller = module.get<ObservcionesController>(ObservcionesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
