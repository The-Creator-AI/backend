import {
  ChatMessageType,
  ChatType,
} from '@The-Creator-AI/fe-be-common/dist/types';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'chat' })
export class ChatEntity implements ChatType {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  created_at: Date;

  @Column()
  updated_at: Date;

  @Column({ unique: true })
  title: string;

  @Column({ nullable: true })
  description: string;

  @Column({
    type: process.env.mode === 'sqlite' ? 'simple-json' : 'json',
  })
  chat_history: ChatMessageType[];
}
