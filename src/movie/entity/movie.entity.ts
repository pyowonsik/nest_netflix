// import { Exclude, Expose, Transform } from 'class-transformer';

import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  VersionColumn,
} from 'typeorm';
import { BaseTable } from '../../common/entity/base-table.entity';
import { MovieDetail } from './movie-detail.entity';
import { Director } from 'src/director/entity/director.entity';
import { Genre } from 'src/genre/entities/genre.entity';
import { Transform, Type } from 'class-transformer';

// // @Exclude() : 조회시 해당 propeety 숨김
// // @Expose() : 조회시 해당 property 노출

// // @Exclude()

// export class Movie {
//   // @Expose()
//   id: number;
//   // @Expose()
//   title: string;

//   //  @Expose()
//   //  @Exclude()
//   @Transform(({ value }) => value.toString().toUpperCase())
//   genre: string;

//   // @Expose()
//   // get description(){
//   //    return `id : ${this.id} , title : ${this.title}`;
//   // }
// }

// One To One : Movie - MovieDetail
// One To Many : Director - Moive
// Many To Many : Movie - Genre

@Entity()
export class Movie extends BaseTable {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    unique: true,
  })
  title: string;

  @OneToOne(() => MovieDetail, (movieDetail) => movieDetail.id, {
    cascade: true,
    nullable: false, // null 금지
  })
  @JoinColumn()
  detail: MovieDetail;

  @ManyToOne(() => Director, (director) => director.id, {
    cascade: true,
    nullable: false,
  })
  director: Director;

  @ManyToMany(() => Genre, (genre) => genre.movies)
  @JoinTable()
  genres: Genre[];

  @Column({
    default: 0,
  })
  likeCount: number;

  @Column()
  @Transform(({ value }) => `http://localhost:3000/${value}`)
  movieFilePath: string;
}
