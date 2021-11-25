const { join } = require('path')

module.exports = {
  type: process.env.BUDGE_DB_DRIVER || 'sqlite',
  host: process.env.BUDGE_DB_HOST || 'localhost',
  port: process.env.BUDGE_DB_PORT || 3306,
  username: process.env.BUDGE_DB_USERNAME,
  password: process.env.BUDGE_DB_PASSWORD,
  database: process.env.BUDGE_DATABASE || './budge.sqlite',
  synchronize: true,
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
