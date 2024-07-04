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

  @SubscribeMessage('search')
  async handleResearch(
    @MessageBody() topic: string,
    @ConnectedSocket() client: Socket,
  ) {
    try {
      client.emit('progress', { message: 'Fetching search results...' });

      // Convert the AsyncGenerator to an iterable
      const results = await this.researchService.searchAndSummarize(topic);
      results.forEach(async (result) => {
        client.emit('result', await result);
      });

      client.emit('complete');
    } catch (error) {
      console.error('Error during research:', error);
      client.emit('error', { message: 'An error occurred during research' });
    }
  }
}
