import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Vote } from './vote.entity';

@Entity()
export class Anime {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  link: string;

  @Column()
  posterUrl: string;

  @Column()
  isOngoing: boolean;

  @OneToMany(() => Vote, (vote) => vote.anime)
  votes: Vote[];

  getTotalVotes(): number {
    return this.votes.length;
  }
}
