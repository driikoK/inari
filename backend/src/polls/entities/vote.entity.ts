import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Anime } from './anime.entity';

@Entity()
export class Vote {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userName: string;

  @ManyToOne(() => Anime, (anime) => anime.votes)
  anime: Anime;
}
