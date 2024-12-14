import { Exclude } from 'class-transformer';
import { CreateDateColumn, UpdateDateColumn, VersionColumn } from 'typeorm';

// 현재는 Entity Inharitance 방식을 사용했지만 , 필요하다면 Entity Embeding , Single Table Inheritance 학습

// Entity Inharitance
export class BaseTable {
  @CreateDateColumn()
  @Exclude() // 프론트엔드에서 필요없는 값 숨김 처리
  createdAt: Date;

  @UpdateDateColumn()
  @Exclude() // 프론트엔드에서 필요없는 값 숨김 처리
  updatedAt: Date;

  @VersionColumn()
  @Exclude() // 프론트엔드에서 필요없는 값 숨김 처리
  version: number;
}
