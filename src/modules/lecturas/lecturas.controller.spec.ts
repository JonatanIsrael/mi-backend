import { Test, TestingModule } from '@nestjs/testing';
import { LecturasController } from './lecturas.controller';

describe('LecturasController', () => {
  let controller: LecturasController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [LecturasController],
    }).compile();

    controller = module.get<LecturasController>(LecturasController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
