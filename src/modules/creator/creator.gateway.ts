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
import {
  ChannelBody,
  ToServer,
  ToClient,
  sendToClient,
} from '@The-Creator-AI/fe-be-common';
import { CreatorService } from '../creator/creator.service';
import { v4 as uuidv4 } from 'uuid';

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
    console.log({ body });
    try {
      const fileContent = this.creatorService.getFileContent(body.filePath);
      sendToClient(client, ToClient.FILE_CONTENT, fileContent);
    } catch (error) {
      console.error('Error fetching file content:', error);
    }
  }
}
