import { ConnectionOptions } from 'typeorm'

const { join } = require('path')

const config: ConnectionOptions = {
  type: 'sqlite',
  database: process.env.BUDGE_DATABASE || './budge.sqlite',
  synchronize: false,
  logging: false,
  entities: [join(__dirname, 'src/entities/**', '*.{ts,js}')],
  migrations: [join(__dirname, 'src/migrations/**', '*.{ts,js}')],
  subscribers: [join(__dirname, 'src/subscribers/**', '*.{ts,js}')],
  cli: {
    entitiesDir: 'src/entities',
    migrationsDir: 'src/migrations',
    subscribersDir: 'src/subscribers',
  },
}

export = config
