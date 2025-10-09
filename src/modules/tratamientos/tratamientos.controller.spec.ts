import { Test, TestingModule } from '@nestjs/testing';
import { TratamientosController } from './tratamientos.controller';

describe('TratamientosController', () => {
  let controller: TratamientosController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TratamientosController],
    }).compile();

    controller = module.get<TratamientosController>(TratamientosController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
