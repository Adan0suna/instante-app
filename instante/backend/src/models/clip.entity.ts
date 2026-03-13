import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Match } from './match.entity';
import { Player } from './player.entity';

@Entity('clips')
export class Clip {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Column({ name: 'match_id' })
  matchId: number;

  @Column({ name: 'alias_id' })
  aliasId: number;

  @Column({ nullable: true })
  description: string;

  @Column({ name: 'start_time', type: 'interval' })
  startTime: string;

  @Column({ name: 'end_time', type: 'interval' })
  endTime: string;

  @Column({ name: 'clip_url', nullable: true })
  clipUrl: string;

  @ManyToOne(() => Match, match => match.clips)
  @JoinColumn({ name: 'match_id' })
  match: Match;

  @ManyToOne(() => Player, player => player.clips)
  @JoinColumn({ name: 'alias_id' })
  player: Player;
}
