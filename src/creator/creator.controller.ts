import { Controller, Get, Query } from '@nestjs/common';
import { CreatorService } from './creator.service';

@Controller('creator')
export class CreatorController {
  constructor(private readonly creatorService: CreatorService) {}

  @Get('directory-structure')
  getDirectoryStructure(@Query('dir') dir?: string, @Query('loadShallow') loadShallow?: boolean) {
    const currentPath = dir || process.cwd(); // Use provided 'dir' or current working directory
    const children = this.creatorService.getDirectoryStructure(currentPath, loadShallow);
    return { children, currentPath };
  }

  @Get('file/content')
  getFileContent(@Query('path') filePath: string): string {
    return this.creatorService.getFileContent(filePath);
  }
}