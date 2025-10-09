import { Test, TestingModule } from '@nestjs/testing';
import { AlertasController } from './alertas.controller';

describe('AlertasController', () => {
  let controller: AlertasController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AlertasController],
    }).compile();

    controller = module.get<AlertasController>(AlertasController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
