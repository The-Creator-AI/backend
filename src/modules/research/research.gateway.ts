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
import { ResearchService } from './research.service';
import {
  ChannelBody,
  ClientToServerChannel,
  ServerToClientChannel,
  sendToClient,
} from '@The-Creator-AI/fe-be-common';

@WebSocketGateway({
  namespace: 'research',
  cors: {
    origin: '*',
  },
}) // Use a namespace for better organization
export class ResearchGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  constructor(private readonly researchService: ResearchService) {}

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

  @SubscribeMessage(ClientToServerChannel.search)
  async handleResearch(
    @MessageBody() body: ChannelBody<ClientToServerChannel.search>,
    @ConnectedSocket() client: Socket,
  ) {
    console.log({ body });
    try {
      sendToClient(client, ServerToClientChannel.progress, {
        message: 'Fetching search results...',
      });

      // Convert the AsyncGenerator to an iterable
      const results = await this.researchService.searchAndSummarize(body.topic);
      results.forEach(async (result) => {
        sendToClient(client, ServerToClientChannel.result, await result);
      });

      sendToClient(client, ServerToClientChannel.complete, {
        message: 'Search completed',
      });
    } catch (error) {
      console.error('Error during research:', error);
      sendToClient(client, ServerToClientChannel.error, {
        message: 'An error occurred during research',
      });
    }
  }
}
