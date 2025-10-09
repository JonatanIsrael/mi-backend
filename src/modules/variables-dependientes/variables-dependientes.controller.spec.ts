import { Test, TestingModule } from '@nestjs/testing';
import { VariablesDependientesController } from './variables-dependientes.controller';

describe('VariablesDependientesController', () => {
  let controller: VariablesDependientesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [VariablesDependientesController],
    }).compile();

    controller = module.get<VariablesDependientesController>(VariablesDependientesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
