import { CreateDateColumn, UpdateDateColumn, VersionColumn } from 'typeorm';

// 현재는 Entity Inharitance 방식을 사용했지만 , 필요하다면 Entity Embeding , Single Table Inheritance 학습

// Entity Inharitance
export class BaseTable {
  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @VersionColumn()
  version: number;
}
