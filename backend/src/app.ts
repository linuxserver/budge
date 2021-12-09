import express, { Application, Request, Response, NextFunction } from 'express'
import { json } from 'body-parser'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import helmet from 'helmet'
import config from './config'
import morgan from 'morgan'
import swaggerUi from 'swagger-ui-express'
import { RegisterRoutes } from '../routes'
import { logger, stream } from './config/winston'
import { ValidateError } from 'tsoa'

const app: Application = express()

app.use(
  cors({
    credentials: true,
    origin: function (origin: string, callback: CallableFunction) {
      if (config.env === 'development') {
        return callback(null, true)
      }

      if (origin === config.uiOrigin) {
        return callback(null, true)
      }

      return callback(null, true)

      callback(new Error('Not allowed by CORS'))
    },
  }),
)
app.use(helmet())
app.use(cookieParser())
app.use(json())
// app.use(morgan('combined', { stream: new stream() }))

// app.use(bodyParser.json({
//     limit: '50mb',
//     verify(req: any, res, buf, encoding) {
//         req.rawBody = buf;
//     }
// }));

RegisterRoutes(app)

app.use(function errorHandler(err: unknown, req: Request, res: Response, next: NextFunction): Response | void {
  if (err instanceof ValidateError) {
    console.warn(`Caught Validation Error for ${req.path}:`, err.fields)
    return res.status(422).json({
      message: 'Validation Failed',
      details: err?.fields,
    })
  }

  if (err instanceof Error) {
    console.log(err)
    return res.status(500).json({
      message: 'Something went wrong!',
    })
  }

  next()
})

app.use('/docs', swaggerUi.serve, async (_req: Request, res: Response) => {
  return res.send(swaggerUi.generateHTML(await import('../swagger.json')))
})

export { app }
