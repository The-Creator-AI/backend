import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { PlanEntity } from './entities/plan.entity';
import { PlanRepository } from './repositories/plan.repository';
import { SaveUpdatePlanDto } from './dto/save-update-plan.dto';

@Injectable()
export class CreatorService {
  constructor(private readonly planRepository: PlanRepository) {}

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

  async savePlan(plan: SaveUpdatePlanDto): Promise<PlanEntity> {
    return this.planRepository.save(plan);
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
}
