import { Entity, PrimaryGeneratedColumn, Column, OneToMany, CreateDateColumn } from 'typeorm';
import { Player } from './player.entity';
import { Match } from './match.entity';

@Entity('teams')
export class Team {
    @PrimaryGeneratedColumn({ type: 'bigint' })
    id: number;

    @Column()
    name: string;

    @Column({ name: 'short_name', nullable: true })
    shortName: string;

    @Column({ name: 'logo_url', nullable: true })
    logoUrl: string;

    @Column({ nullable: true })
    league: string;

    @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
    createdAt: Date;

    @OneToMany(() => Player, player => player.team)
    players: Player[];

    @OneToMany(() => Match, match => match.homeTeam)
    homeMatches: Match[];

    @OneToMany(() => Match, match => match.awayTeam)
    awayMatches: Match[];
}
