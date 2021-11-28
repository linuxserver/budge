import { getConnectionManager } from 'typeorm'
import { UserRepository } from './UserRepository'

const userRepository = getConnectionManager().get('default').getRepository(UserRepository)

export { userRepository }
