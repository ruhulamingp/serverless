import 'source-map-support/register'
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import { CreateTodoRequest } from '../../requests/CreateTodoRequest'


import * as middy from 'middy'
import { cors } from 'middy/middlewares'
import { getUserId } from '../utils'

import { createLogger } from '../../utils/logger'
const logger = createLogger('api_calls')


import {createTodoItem} from "../../businessLogic/todos";


export const handler = middy(async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  logger.info('Processing event .. ', event)
  
  const newTodoRequest: CreateTodoRequest = JSON.parse(event.body)
  const userId = getUserId(event)

  const todoItem = await createTodoItem(newTodoRequest, userId)

  logger.info("Todo created", todoItem)

  return {
    statusCode: 201,
    body: JSON.stringify({'item': todoItem})
  }
})

handler.use(cors({
    credentials: true
  })
)