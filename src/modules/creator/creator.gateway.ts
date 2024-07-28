import {
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Socket, Server } from 'socket.io';
import { LlmService } from '../creator/llm.service';
import { CreatorService } from '../creator/creator.service';
import { v4 as uuidv4 } from 'uuid';
import { SaveUpdateChatDto } from '../creator/dto/save-update-chat.dto';
import {
  ChannelBody,
  ToServer,
  ToClient,
  sendToClient,
} from '@The-Creator-AI/fe-be-common';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class CreatorGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  constructor(
    private readonly llmService: LlmService,
    private readonly creatorService: CreatorService,
  ) {}

  server: Server;

  afterInit(server: Server) {
    this.server = server;
  }

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage(ToServer.USER_MESSAGE)
  async handleUserMessage(
    @MessageBody() body: ChannelBody<ToServer.USER_MESSAGE>,
    @ConnectedSocket() client: Socket,
  ) {
    console.log('User message:', body);
    try {
      const uuid = uuidv4();
      const modelName = this.llmService.getModelName();
      const response = await this.llmService.sendPrompt(
        body.chatHistory,
        body.selectedFiles,
        {
          chunk: (chunk) =>
            sendToClient(client, ToClient.BOT_MESSAGE_CHUNK, {
              uuid,
              user: 'bot',
              model: modelName,
              chunk,
            }),
        },
      );

      sendToClient(client, ToClient.BOT_MESSAGE, {
        uuid,
        user: 'bot',
        message: response,
        model: modelName,
      });
    } catch (error) {
      console.error('Error during research:', error);
    }
  }

  @SubscribeMessage(ToServer.GET_FILE_CONTENT)
  async handleGetFileContent(
    @MessageBody() body: ChannelBody<ToServer.GET_FILE_CONTENT>,
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const fileContent = this.creatorService.getFileContent(body.filePath);
      sendToClient(client, ToClient.FILE_CONTENT, fileContent);
    } catch (error) {
      console.error('Error fetching file content:', error);
    }
  }

  @SubscribeMessage(ToServer.SAVE_PLAN)
  async handleSavePlan(
    @MessageBody() body: ChannelBody<ToServer.SAVE_PLAN>,
    @ConnectedSocket() client: Socket,
  ) {
    try {
      await this.creatorService.savePlan(body);
      this.handleGetPlans(client);
    } catch (error) {
      console.error('Error saving plan:', error);
    }
  }

  @SubscribeMessage(ToServer.DELETE_PLAN)
  async handleDeletePlan(
    @MessageBody() body: ChannelBody<ToServer.DELETE_PLAN>,
    @ConnectedSocket() client: Socket,
  ) {
    try {
      await this.creatorService.deletePlan(body.id);
      this.handleGetPlans(client);
    } catch (error) {
      console.error('Error deleting plan:', error);
    }
  }

  @SubscribeMessage(ToServer.GET_PLANS)
  async handleGetPlans(@ConnectedSocket() client: Socket) {
    try {
      const plans = await this.creatorService.fetchPlans();
      sendToClient(client, ToClient.PLANS, plans);
    } catch (error) {
      console.error('Error fetching plans:', error);
    }
  }

  @SubscribeMessage(ToServer.SAVE_CHAT)
  async handleSaveChat(
    @MessageBody() body: SaveUpdateChatDto,
    @ConnectedSocket() client: Socket,
  ) {
    try {
      await this.creatorService.saveChat(body);
      this.handleGetChats(client);
    } catch (error) {
      console.error('Error saving chat:', error);
    }
  }

  @SubscribeMessage(ToServer.DELETE_CHAT)
  async handleDeleteChat(
    @MessageBody() body: ChannelBody<ToServer.DELETE_CHAT>,
    @ConnectedSocket() client: Socket,
  ) {
    try {
      await this.creatorService.deleteChat(body.id);
      this.handleGetChats(client);
    } catch (error) {
      console.error('Error deleting chat:', error);
    }
  }

  @SubscribeMessage(ToServer.GET_CHATS)
  async handleGetChats(@ConnectedSocket() client: Socket) {
    try {
      const chats = await this.creatorService.fetchChats();
      sendToClient(client, ToClient.CHATS, chats);
    } catch (error) {
      console.error('Error fetching chats:', error);
    }
  }

  @SubscribeMessage(ToServer.GET_AGENTS)
  async handleGetAgents(@ConnectedSocket() client: Socket) {
    try {
      const agents = await this.creatorService.fetchAgents();
      sendToClient(client, ToClient.AGENTS, agents);
    } catch (error) {
      console.error('Error fetching agents:', error);
    }
  }

  @SubscribeMessage(ToServer.SAVE_AGENT)
  async handleSaveAgent(
    @MessageBody() body: ChannelBody<ToServer.SAVE_AGENT>,
    @ConnectedSocket() client: Socket,
  ) {
    try {
      await this.creatorService.saveAgent(body);
      this.handleGetAgents(client);
    } catch (error) {
      console.error('Error saving agent:', error);
    }
  }

  @SubscribeMessage(ToServer.DELETE_AGENT)
  async handleDeleteAgent(
    @MessageBody() body: ChannelBody<ToServer.DELETE_AGENT>,
    @ConnectedSocket() client: Socket,
  ) {
    try {
      await this.creatorService.deleteAgent(body.id);
      // You might want to send a message to the client to update their agent list
      this.handleGetAgents(client);
    } catch (error) {
      console.error('Error deleting agent:', error);
    }
  }

  @SubscribeMessage(ToServer.SAVE_CODE_TO_FILE) // New route handler
  async handleSaveCodeToFile(
    @MessageBody() body: ChannelBody<ToServer.SAVE_CODE_TO_FILE>
  ) {
    try {
      await this.creatorService.saveCodeToFile(body.filePath, body.code);
    } catch (error) {
      console.error('Error saving code to file:', error);
    }
  }
}
