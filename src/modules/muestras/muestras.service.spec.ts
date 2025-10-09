import { Test, TestingModule } from '@nestjs/testing';
import { MuestrasService } from './muestras.service';

describe('MuestrasService', () => {
  let service: MuestrasService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MuestrasService],
    }).compile();

    service = module.get<MuestrasService>(MuestrasService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
