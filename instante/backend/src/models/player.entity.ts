import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, CreateDateColumn, JoinColumn } from 'typeorm';
import { Team } from './team.entity';
import { PlayerMatchStats } from './player-match-stats.entity';
import { Clip } from './clip.entity';

@Entity('players')
export class Player {
    @PrimaryGeneratedColumn({ type: 'bigint' })
    id: number;

    @Column({ name: 'first_name' })
    firstName: string;

    @Column({ name: 'last_name', nullable: true })
    lastName: string;

    @Column({ name: 'display_name', nullable: true })
    displayName: string;

    @Column({ name: 'photo_url', nullable: true })
    photoUrl: string;

    @Column({ name: 'birth_date', type: 'date', nullable: true })
    birthDate: Date;

    @Column({ nullable: true })
    nationality: string;

    @Column({ nullable: true })
    position: string;

    @Column({ name: 'jersey_number', nullable: true })
    jerseyNumber: number;

    @Column({ name: 'height_cm', nullable: true })
    heightCm: number;

    @Column({ name: 'weight_kg', nullable: true })
    weightKg: number;

    @Column({ name: 'preferred_foot', nullable: true })
    preferredFoot: string;

    @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
    createdAt: Date;

    @ManyToOne(() => Team, team => team.players, { nullable: true })
    @JoinColumn({ name: 'team_id' })
    team: Team;

    @OneToMany(() => PlayerMatchStats, stats => stats.player)
    stats: PlayerMatchStats[];

    @OneToMany(() => Clip, clip => clip.player)
    clips: Clip[];
}
