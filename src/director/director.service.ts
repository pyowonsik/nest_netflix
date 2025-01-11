import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateDirectorDto } from './dto/create-director.dto';
import { UpdateDirectorDto } from './dto/update-director';
import { InjectRepository } from '@nestjs/typeorm';
import { Director } from './entity/director.entity';
import { Repository } from 'typeorm';

@Injectable()
export class DirectorService {
  constructor(
    @InjectRepository(Director)
    private readonly directorRepository: Repository<Director>,
  ) {}

  async findAll() {
    return await this.directorRepository.find();
  }

  async findOne(id: number) {
    const director = await this.directorRepository.findOne({
      where: {
        id,
      },
    });

    // if (!director) {
    //   throw new NotFoundException('존재하지 않는 ID의 감독입니다.');
    // }

    return director;
  }

  async create(createDirectorDto: CreateDirectorDto) {
    const director = await this.directorRepository.save(createDirectorDto);

    return director;
  }

  async update(id: number, updateDirectorDto: UpdateDirectorDto) {
    const director = await this.directorRepository.findOne({
      where: {
        id,
      },
    });

    if (!director) {
      throw new NotFoundException('존재하지 않은 ID의 감독입니다.');
    }

    await this.directorRepository.update({ id }, updateDirectorDto);

    const newDirector = await this.directorRepository.findOne({
      where: { id },
    });
    return newDirector;
  }

  async remove(id: number) {
    const director = await this.directorRepository.findOne({ where: { id } });
    if (!director) {
      throw new NotFoundException('존재하지 않는 ID의 감독입니다.');
    }

    await this.directorRepository.delete(id);

    return id;
  }
}
