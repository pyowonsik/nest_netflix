import { User } from 'src/user/entity/user.entity';
import { Column, Entity, ManyToOne, PrimaryColumn } from 'typeorm';
import { Movie } from './movie.entity';

// movie - user 중간 테이블
@Entity()
export class MovieUserLike {
  @PrimaryColumn({
    name: 'movieId',
    type: 'int8',
  })
  @ManyToOne(() => Movie, (movie) => movie.likedUsers, { onDelete: 'CASCADE' })
  movie: Movie;

  @PrimaryColumn({
    name: 'userId',
    type: 'int8',
  })
  @ManyToOne(() => User, (user) => user.likedMovies, { onDelete: 'CASCADE' })
  user: User;

  @Column()
  isLike: Boolean;
}
