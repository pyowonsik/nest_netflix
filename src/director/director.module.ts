import { Module } from '@nestjs/common';
import { DirectorService } from './director.service';
import { DirectorController } from './director.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Director } from './entity/director.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Director])], // typeorm director repository 의존성
  controllers: [DirectorController],
  providers: [DirectorService],
})
export class DirectorModule {}
