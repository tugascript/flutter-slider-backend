import { Test, TestingModule } from '@nestjs/testing';
import { HeadtoheadService } from '../headtohead.service';

describe('HeadtoheadService', () => {
  let service: HeadtoheadService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [HeadtoheadService],
    }).compile();

    service = module.get<HeadtoheadService>(HeadtoheadService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
