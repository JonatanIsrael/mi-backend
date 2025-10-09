import { Test, TestingModule } from '@nestjs/testing';
import { CalendariosController } from './calendarios.controller';

describe('CalendariosController', () => {
  let controller: CalendariosController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CalendariosController],
    }).compile();

    controller = module.get<CalendariosController>(CalendariosController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
