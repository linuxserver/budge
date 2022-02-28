import { app } from './app'
import { AddressInfo } from 'net'
import config from './config'
import { createConnection } from 'typeorm'
import dbConfig from '../ormconfig'
import {prisma} from './prisma'

;(async () => {
  if (config.env !== 'production') {
    console.log('!!!WARNING!!! Running in development mode!')
    // await sleep(5000)
  }

  process.on('unhandledRejection', error => {
    // Won't execute
    console.log('unhandledRejection', error);
  });

  // await createConnection(dbConfig)

  const server = app.listen(<number>config.port, '0.0.0.0', () => {
    const { port, address } = server.address() as AddressInfo
    console.log(`Server listening on: http://${address}:${port}`)
  })
})()
