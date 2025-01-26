import * as dotenv from 'dotenv';
import { DataSource } from 'typeorm';

dotenv.config();

export default new DataSource({
  type: process.env.DB_TYPE as 'postgres',
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  synchronize: false,
  logging: false,
  entities: ['dist/**/*.entity.js'],
  migrations: ['dist/database/migrations/*.js'],
  ...(process.env.ENV === 'prod' && {
    ssl: {
      rejectUnauthorized: false,
    },
  }),
});

// migration 파일 genrate : yarn typeorm migration:generate ./src/database/migrations/init -d ./dist/database/data-source.js
// yarn build : dist 적용 (migration 데이터를 dist에서 적용 하기 때문)
// migreation run(revert) : yarn typeorm migration:run(revert) -d ./dist/database/data-source.js
