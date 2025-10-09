import { Test, TestingModule } from '@nestjs/testing';
import { ObservacionesService } from './observaciones.service';

describe('ObservacionesService', () => {
  let service: ObservacionesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ObservacionesService],
    }).compile();

    service = module.get<ObservacionesService>(ObservacionesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
