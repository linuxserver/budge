export default {
  env: process.env.NODE_ENV || 'development',
  port: process.env.PORT || 5000,
  jwtSecret: process.env.JWT_SECRET || '6oQKw5jkUzSQQycttMmJ',
  dbUrl: process.env.DB_URL || 'mongodb://localhost:27017/cardboard',
  uiOrigin: process.env.UI_ORIGIN || 'http://localhost:3000',
  logfile: process.env.LOG_FILE || false,
  logLevel: process.env.LOG_LEVEL || 'info',
  database: {
    type: 'sqlite',
    database: '../test.db',
  },
}
