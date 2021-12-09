import { app } from './app'
import { AddressInfo } from 'net'
import config from './config'
import { createConnection } from 'typeorm'
import dbConfig from '../ormconfig'
;(async () => {
  if (config.env !== 'production') {
    console.log('!!!WARNING!!! Running in development mode!')
    // await sleep(5000)
  }

  await createConnection(dbConfig)

  const server = app.listen(<number>config.port, '0.0.0.0', () => {
    const { port, address } = server.address() as AddressInfo
    console.log(`Server listening on: http://${address}:${port}`)
  })
})()
