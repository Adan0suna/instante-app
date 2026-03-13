import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany } from 'typeorm';
import { Team } from './team.entity';
import { PlayerMatchStats } from './player-match-stats.entity';
import { Clip } from './clip.entity';

@Entity('matches')
export class Match {
    @PrimaryGeneratedColumn({ type: 'bigint' })
    id: number;

    @Column()
    title: string;

    @Column({ type: 'timestamptz' })
    date: Date;

    @Column({ name: 'home_score', nullable: true, default: 0 })
    homeScore: number;

    @Column({ name: 'away_score', nullable: true, default: 0 })
    awayScore: number;

    @Column({ nullable: true })
    competition: string;

    @Column({ nullable: true })
    season: string;

    @ManyToOne(() => Team, team => team.homeMatches)
    homeTeam: Team;

    @ManyToOne(() => Team, team => team.awayMatches)
    awayTeam: Team;

    @OneToMany(() => PlayerMatchStats, stats => stats.match)
    playerStats: PlayerMatchStats[];

    @OneToMany(() => Clip, clip => clip.match)
    clips: Clip[];
}
