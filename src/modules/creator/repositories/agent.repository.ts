import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AgentEntity } from './../entities/agent.entity';

@Injectable()
export class AgentsRepository {
  constructor(
    @InjectRepository(AgentEntity)
    private readonly agentsRepository: Repository<AgentEntity>,
  ) {}

  async findAll(): Promise<AgentEntity[]> {
    return await this.agentsRepository.find({
      order: {
        updated_at: 'DESC',
      },
    });
  }

  async findOne(id: number): Promise<AgentEntity | undefined> {
    return this.agentsRepository.findOne({
      where: { id },
    });
  }

  async create(agent: AgentEntity): Promise<AgentEntity> {
    const newAgent = this.agentsRepository.create({
      ...agent,
      created_at: new Date(),
      updated_at: new Date(),
    });
    return this.agentsRepository.save(newAgent);
  }

  async update(id: number, agent: AgentEntity): Promise<AgentEntity> {
    const updatedAgent = await this.agentsRepository.preload({
      id,
      ...agent,
      updated_at: new Date(),
    });
    if (!updatedAgent) {
      throw new Error(`Agent with ID ${id} not found`);
    }
    return this.agentsRepository.save(updatedAgent);
  }

  async delete(id: number): Promise<void> {
    await this.agentsRepository.delete(id);
  }
}
