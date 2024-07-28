import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MoreThan, Repository } from 'typeorm';
import { AgentEntity } from './../entities/agent.entity';
import { SaveUpdateAgentDto } from '../dto/save-update-agent.dto';
import { AGENTS } from '../constants/agents.constants';

@Injectable()
export class AgentsRepository {
  constructor(
    @InjectRepository(AgentEntity)
    private readonly agentsRepository: Repository<AgentEntity>,
  ) {
    this.populateDefaultAgents();
  }

  private async populateDefaultAgents() {
    try {
      // Fetch all existing agents from the database matching the AGENTS
      const agentsInDB = await this.agentsRepository
        .createQueryBuilder()
        .where('id IN (:...ids)', { ids: AGENTS.map((agent) => agent.id) })
        .getMany();

      console.log({
        agentsInDB: agentsInDB.map((a) => ({
          id: a.id,
          name: a.name,
          hidden: a.hidden,
        })),
      });

      // Start a transaction to ensure all operations succeed or fail together
      await this.agentsRepository.manager.transaction(
        async (transactionalEntityManager) => {
          // Delete all existing agents matching AGENTS
          await transactionalEntityManager
            .createQueryBuilder()
            .delete()
            .from(AgentEntity)
            .where('id IN (:...ids)', { ids: AGENTS.map((agent) => agent.id) })
            .execute();

          // Insert all agents from AGENTS
          const newAgents = await Promise.all(
            AGENTS.map((agent) =>
              transactionalEntityManager.save(AgentEntity, {
                ...agent,
                editable: false,
                hidden: !!(
                  agentsInDB.find((a) => a.id === agent.id)?.hidden ??
                  agent.hidden
                ),
                created_at: new Date(),
                updated_at: new Date(),
              }),
            ),
          );

          console.log({ newAgents });
        },
      );

      console.log('All agents successfully added or updated.');
    } catch (error) {
      console.error('Error while populating default agents:', error);
      throw new Error(
        'Failed to populate default agents. No changes were made to the database.',
      );
    }
  }

  async findAll(): Promise<AgentEntity[]> {
    return await this.agentsRepository.find({
      order: {
        created_at: 'ASC',
      },
    });
  }

  async findOne(id: number): Promise<AgentEntity | undefined> {
    return this.agentsRepository.findOne({
      where: { id },
    });
  }

  async create(agent: SaveUpdateAgentDto): Promise<AgentEntity> {
    // Find the current maximum ID and set the next ID to be the max ID + 1
    const lastAgent = await this.agentsRepository.findOne({
      order: {
        id: 'DESC',
      },
      where: {
        id: MoreThan(500),
      },
    });

    const nextId = lastAgent ? lastAgent.id + 1 : 10001;

    // Create a new agent with the next available ID
    const newAgent = this.agentsRepository.create({
      id: nextId,
      ...agent,
      editable: !!agent.editable,
      hidden: !!agent.hidden,
      created_at: new Date(),
      updated_at: new Date(),
    });

    return this.agentsRepository.save(newAgent);
  }

  async update(id: number, agent: SaveUpdateAgentDto): Promise<AgentEntity> {
    const updatedAgent = await this.agentsRepository.preload({
      id,
      ...agent,
      editable: !!agent.editable,
      hidden: !!agent.hidden,
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
