import { Test, TestingModule } from '@nestjs/testing';
import { CreatorController } from './creator.controller';

describe('CreatorController', () => {
  let controller: CreatorController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CreatorController],
    }).compile();

    controller = module.get<CreatorController>(CreatorController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
