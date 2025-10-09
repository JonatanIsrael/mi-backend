import { Test, TestingModule } from '@nestjs/testing';
import { MuestrasController } from './muestras.controller';

describe('MuestrasController', () => {
  let controller: MuestrasController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MuestrasController],
    }).compile();

    controller = module.get<MuestrasController>(MuestrasController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
