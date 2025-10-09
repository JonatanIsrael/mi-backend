import { Test, TestingModule } from '@nestjs/testing';
import { VariablesDependientesService } from './variables-dependientes.service';

describe('VariablesDependientesService', () => {
  let service: VariablesDependientesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [VariablesDependientesService],
    }).compile();

    service = module.get<VariablesDependientesService>(VariablesDependientesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
