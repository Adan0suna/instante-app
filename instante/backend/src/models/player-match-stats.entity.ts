import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, Unique } from 'typeorm';
import { Player } from './player.entity';
import { Match } from './match.entity';

@Entity('player_match_stats')
@Unique(['match', 'player'])
export class PlayerMatchStats {
    @PrimaryGeneratedColumn({ type: 'bigint' })
    id: number;

    @Column({ name: 'minutes_played', default: 0 })
    minutesPlayed: number;

    @Column({ default: 0 })
    goals: number;

    @Column({ default: 0 })
    assists: number;

    @Column({ name: 'yellow_cards', default: 0 })
    yellowCards: number;

    @Column({ name: 'red_cards', default: 0 })
    redCards: number;

    @Column({ type: 'numeric', precision: 3, scale: 1, nullable: true })
    rating: number;

    @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
    createdAt: Date;

    @ManyToOne(() => Match, match => match.playerStats)
    match: Match;

    @ManyToOne(() => Player, player => player.stats)
    player: Player;
}
