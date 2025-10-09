import { Test, TestingModule } from '@nestjs/testing';
import { RepeticionesController } from './repeticiones.controller';

describe('RepeticionesController', () => {
  let controller: RepeticionesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RepeticionesController],
    }).compile();

    controller = module.get<RepeticionesController>(RepeticionesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
