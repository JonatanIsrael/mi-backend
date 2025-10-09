import { Test, TestingModule } from '@nestjs/testing';
import { RepeticionesService } from './repeticiones.service';

describe('RepeticionesService', () => {
  let service: RepeticionesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RepeticionesService],
    }).compile();

    service = module.get<RepeticionesService>(RepeticionesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
