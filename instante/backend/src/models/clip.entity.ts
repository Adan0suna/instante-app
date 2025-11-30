import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('clips')
export class Clip {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'match_id' })
  match_id: number;

  @Column({ name: 'alias_id' })
  alias_id: number;

  @Column({ nullable: true })
  description: string;

  @Column({ name: 'start_time', type: 'interval' })
  start_time: string;

  @Column({ name: 'end_time', type: 'interval' })
  end_time: string;

  @Column({ name: 'clip_url', nullable: true })
  clip_url: string;
}
