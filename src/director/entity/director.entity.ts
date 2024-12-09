import { BaseTable } from 'src/common/entity/base-table.entity';
import { Movie } from 'src/movie/entity/movie.entity';
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Director extends BaseTable {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  dob: Date;

  @Column()
  nationality: string;

  @OneToMany(() => Movie, (movie) => movie.director)
  movies: Movie[];
}

// 모듈 생성시 자동으로 app.module에 Director Module 등록
// 수동으로 app.module의 TypeOrm entity에는 등록
// Entity column 및 관계 작성후
// Service에서 repository 접근 할수 있도록 해당 모듈에서 TypeOrm Entity import
// dto , service , contoller 연결
