import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Recording } from './recording.entity';

@Entity('highlights')
export class Highlight {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  time: number;

  @Column()
  label: string;

  @Column()
  type: string;

  @Column()
  color: string;

  @Column({ nullable: true })
  clipUrl: string;

  @ManyToOne(() => Recording, recording => recording.highlights)
  recording: Recording;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
} 