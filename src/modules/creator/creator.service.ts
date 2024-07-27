import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { PlanEntity } from './entities/plan.entity';
import { PlanRepository } from './repositories/plan.repository';
import { SaveUpdatePlanDto } from './dto/save-update-plan.dto';
import { ChatEntity } from './entities/chat.entity';
import { ChatType } from '@The-Creator-AI/fe-be-common/dist/types';
import { ChatRepository } from './repositories/chat.repository';
import { AgentEntity } from './entities/agent.entity';
import { AgentsRepository } from './repositories/agent.repository';
import { SaveUpdateAgentDto } from './dto/save-update-agent.dto';

@Injectable()
export class CreatorService {
  constructor(
    private readonly planRepository: PlanRepository,
    private readonly chatRepository: ChatRepository,
    private readonly agentsRepository: AgentsRepository,
  ) {}

  getDirectoryStructure(dir: string, loadShallow: boolean = false, level = 0) {
    if (!dir) {
      return [];
    }
    const files = fs.readdirSync(dir, { withFileTypes: true });
    const children = files
      .filter((file) => !['.git', 'node_modules', 'stocks'].includes(file.name)) // Filter out unwanted directories
      .map((file) => {
        const fullPath = path.join(dir, file.name);
        if (file.isDirectory()) {
          return {
            name: file.name,
            children:
              loadShallow && level >= 1
                ? []
                : this.getDirectoryStructure(fullPath, loadShallow, level + 1),
          };
        } else {
          return { name: file.name };
        }
      });
    return children;
  }

  getFileContent(filePath: string): string {
    try {
      const data = fs.readFileSync(filePath, 'utf-8');
      return data;
    } catch (error) {
      console.error('Error reading file:', error);
      return 'Error reading file';
    }
  }

  readSelectedFilesContent(filePaths: string[]): {
    [filePath: string]: string;
  } {
    const fileContents: { [filePath: string]: string } = {};
    const processedPaths = new Set<string>();

    const readContentRecursive = (filePath: string) => {
      try {
        if (processedPaths.has(filePath)) {
          return;
        }
        processedPaths.add(filePath);
      } catch (error) {
        console.error(`Error reading file ${filePath}: ${error}`);
        processedPaths.add(filePath);
        return;
      }

      if (fs.statSync(filePath).isDirectory()) {
        fs.readdirSync(filePath).forEach((file) =>
          readContentRecursive(path.join(filePath, file)),
        );
      } else {
        try {
          fileContents[filePath] = fs.readFileSync(filePath, 'utf8');
        } catch (error) {
          console.error(`Error reading file ${filePath}: ${error}`);
        }
      }
    };

    filePaths.forEach((filePath) => readContentRecursive(filePath));

    return fileContents;
  }

  async savePlan(plan: SaveUpdatePlanDto) {
    return plan.id
      ? this.planRepository.update(plan.id, plan)
      : this.planRepository.create(plan);
  }

  async deletePlan(id: number): Promise<void> {
    await this.planRepository.delete(id);
  }

  async fetchPlans(): Promise<PlanEntity[]> {
    const plans = await this.planRepository.findAllPlans();
    return plans.map((plan) => ({
      ...plan,
      code_plan:
        typeof plan.code_plan === 'string'
          ? JSON.parse(plan.code_plan)
          : plan.code_plan,
    }));
  }

  async saveChat(chat: ChatType) {
    return chat.id
      ? this.chatRepository.update(chat.id, chat)
      : this.chatRepository.create(chat);
  }

  async deleteChat(id: number): Promise<void> {
    await this.chatRepository.delete(id);
  }

  async fetchChats(): Promise<ChatEntity[]> {
    const chats = await this.chatRepository.findAllChats();
    return chats.map((chat) => ({
      ...chat,
      chat_history:
        typeof chat.chat_history === 'string'
          ? JSON.parse(chat.chat_history)
          : chat.chat_history,
    }));
  }

  async saveAgent(agent: SaveUpdateAgentDto): Promise<AgentEntity> {
    return agent.id
      ? this.agentsRepository.update(agent.id, agent)
      : this.agentsRepository.create(agent);
  }

  async deleteAgent(id: number): Promise<void> {
    await this.agentsRepository.delete(id);
  }

  async fetchAgents() {
    const agents = await this.agentsRepository.findAll();
    return agents.map((agent) =>
      typeof agent === 'string' ? JSON.parse(agent) : agent,
    );
  }
}
