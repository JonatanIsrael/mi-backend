import { Test, TestingModule } from '@nestjs/testing';
import { CalendarioService } from './calendario.service';

describe('CalendarioService', () => {
  let service: CalendarioService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CalendarioService],
    }).compile();

    service = module.get<CalendarioService>(CalendarioService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
