import { Controller, Post, Body, Get, Query } from '@nestjs/common';
import { CreatorService } from './creator.service';
import { LlmService } from './llm.service';
import { ChatMessageType } from '@The-Creator-AI/fe-be-common/dist/types';
import { v4 as uuidv4 } from "uuid";

@Controller('creator')
export class CreatorController {
  constructor(
    private readonly creatorService: CreatorService,
    private readonly llmService: LlmService,
  ) {}

  @Post('chat')
  async chat(
    @Body()
    message: {
      chatHistory: ChatMessageType[];
      selectedFiles: string[];
    },
  ): Promise<ChatMessageType> {
    const response = await this.llmService.sendPrompt(
      message.chatHistory,
      message.selectedFiles,
    );
    const modelName = this.llmService.getModelName();
    return {
      uuid: uuidv4(),
      user: 'bot',
      message: response,
      model: modelName,
    };
  }

  @Post('token-count')
  async tokenCount(
    @Body()
    message: {
      chatHistory: {
        user: string;
        message: string;
      }[];
      selectedFiles: string[];
    },
  ): Promise<number> {
    return this.llmService.getTokenCount(
      message.chatHistory,
      message.selectedFiles,
    );
  }

  @Get('directory-structure')
  getDirectoryStructure(
    @Query('dir') dir?: string,
    @Query('loadShallow') loadShallow?: boolean,
  ) {
    const workingDirectory = process.env.CUR_WRK_DIR;
    console.log({ workingDirectory });
    const currentPath = dir || workingDirectory;
    const children = this.creatorService.getDirectoryStructure(
      currentPath,
      loadShallow,
    );
    return { children, currentPath };
  }

  @Get('file/content')
  getFileContent(@Query('path') filePath: string): string {
    return this.creatorService.getFileContent(filePath);
  }
}
