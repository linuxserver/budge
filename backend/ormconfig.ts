const { join } = require('path')

module.exports = {
  type: 'sqlite',
  host: 'localhost',
  port: 3306,
  username: 'test',
  password: 'test',
  database: './test.db',
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
