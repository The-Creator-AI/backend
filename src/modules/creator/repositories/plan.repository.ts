import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeleteResult, Repository, UpdateResult } from 'typeorm';
import { PlanEntity } from '../entities/plan.entity';
import { SaveUpdatePlanDto } from '../dto/save-update-plan.dto';

@Injectable()
export class PlanRepository {
  constructor(
    @InjectRepository(PlanEntity)
    private readonly planRepository: Repository<PlanEntity>,
  ) {}

  async findOne(id: number): Promise<PlanEntity | undefined> {
    return this.planRepository.findOne({
      where: { id },
    });
  }

  async save(plan: SaveUpdatePlanDto): Promise<PlanEntity> {
    return this.planRepository.save({
      ...plan,
      created_at: new Date(),
      updated_at: new Date(),
    });
  }

  async update(id: number, plan: SaveUpdatePlanDto): Promise<UpdateResult> {
    return this.planRepository.update(id, {
      ...plan,
      updated_at: new Date(),
    });
  }

  async delete(id: number): Promise<DeleteResult> {
    return this.planRepository.delete(id);
  }

  async findAllPlans(): Promise<PlanEntity[]> {
    return this.planRepository.find({
      order: {
        id: 'DESC',
      },
    });
  }
}
