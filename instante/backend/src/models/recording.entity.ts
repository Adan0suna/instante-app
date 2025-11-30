import { Entity, PrimaryGeneratedColumn, Column, OneToMany, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Highlight } from './highlight.entity';

@Entity('recordings')
export class Recording {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column()
  date: Date;

  @Column()
  duration: string;

  @Column()
  size: string;

  @Column()
  videoUrl: string;

  @Column()
  thumbnailUrl: string;

  @OneToMany(() => Highlight, highlight => highlight.recording)
  highlights: Highlight[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
} 