import { ConnectionOptions } from 'typeorm'

const { join } = require('path')

const config: ConnectionOptions = {
  type: 'sqlite',
  database: process.env.BUDGE_DATABASE || './budge.sqlite',

  // type: 'postgres',
  // port: parseInt(process.env.BUDGE_DB_PORT) || 5432,

  // type: 'mariadb',
  // port: parseInt(process.env.BUDGE_DB_PORT) || 3306,

  // host: process.env.BUDGE_DB_HOST || '192.168.1.91',
  // username: process.env.BUDGE_DB_USERNAME || 'budge',
  // password: process.env.BUDGE_DB_PASSWORD || '3uY8xTX6j8oTVqJ_',
  // database: process.env.BUDGE_DATABASE || 'budge',
  synchronize: true,
  logging: false,
  entities: [
    join(__dirname, 'src/entities/**', '*.ts'),
    join(__dirname, 'build/src/entities/**', '*.js')
  ],
  migrations: [
    join(__dirname, 'src/migrations/**', '*.ts'),
    join(__dirname, 'build/src/migrations/**', '*.js')
  ],
  subscribers: [
    join(__dirname, 'src/subscribers/**', '*.ts'),
    join(__dirname, 'build/src/subscribers/**', '*.js')
  ],
  cli: {
    entitiesDir: 'src/entities',
    migrationsDir: 'src/migrations',
    subscribersDir: 'src/subscribers',
  },
}

export = config
