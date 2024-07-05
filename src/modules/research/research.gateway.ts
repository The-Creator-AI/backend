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
  ToServer,
  ToClient,
  sendToClient,
} from '@The-Creator-AI/fe-be-common';

@WebSocketGateway({
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

  @SubscribeMessage(ToServer.SEARCH)
  async handleResearch(
    @MessageBody() body: ChannelBody<ToServer.SEARCH>,
    @ConnectedSocket() client: Socket,
  ) {
    console.log({ body });
    try {
      sendToClient(client, ToClient.PROGRESS, {
        message: 'Fetching search results...',
      });

      // Convert the AsyncGenerator to an iterable
      const results = await this.researchService.searchAndSummarize(
        body.topic,
        {
          chunk: (resultChunk) =>
            sendToClient(client, ToClient.CHUNK, resultChunk),
        },
      );
      results.forEach(async (result) => {
        sendToClient(client, ToClient.RESULT, await result);
      });

      sendToClient(client, ToClient.COMPLETE, {
        message: 'Search completed',
      });
    } catch (error) {
      console.error('Error during research:', error);
      sendToClient(client, ToClient.ERROR, {
        message: 'An error occurred during research',
      });
    }
  }
}
