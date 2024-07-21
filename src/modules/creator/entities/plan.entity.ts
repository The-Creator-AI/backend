import { PlanType } from '@The-Creator-AI/fe-be-common/dist/types';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'plan' })
export class PlanEntity implements PlanType {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  title: string;

  @Column()
  description: string;

  @Column({
    type: process.env.mode === 'sqlite' ? 'simple-json' : 'json',
  })
  code_plan: string;
}
