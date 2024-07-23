import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeleteResult, Repository, UpdateResult } from 'typeorm';
import { ChatEntity } from '../entities/chat.entity';
import { SaveUpdateChatDto } from '../dto/save-update-chat.dto';

@Injectable()
export class ChatRepository {
  constructor(
    @InjectRepository(ChatEntity)
    private readonly chatRepository: Repository<ChatEntity>,
  ) {}

  async findOne(id: number): Promise<ChatEntity | undefined> {
    return this.chatRepository.findOne({
      where: { id },
    });
  }

  async save(chat: SaveUpdateChatDto) {
    return this.chatRepository.save(chat);
  }

  async update(id: number, chat: SaveUpdateChatDto): Promise<UpdateResult> {
    return this.chatRepository.update(id, chat);
  }

  async delete(id: number): Promise<DeleteResult> {
    return this.chatRepository.delete(id);
  }

  async findAllChats(): Promise<ChatEntity[]> {
    return this.chatRepository.find({});
  }
}
