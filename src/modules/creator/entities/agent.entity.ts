import { AgentType } from '@The-Creator-AI/fe-be-common/dist/types';
import { BaseEntity, Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'agent' })
export class AgentEntity extends BaseEntity implements AgentType {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  created_at: Date;

  @Column()
  updated_at: Date;

  @Column({ unique: true })
  name: string;

  @Column()
  systemInstructions: string;

  @Column()
  editable: boolean;

  @Column()
  hidden: boolean;
}
