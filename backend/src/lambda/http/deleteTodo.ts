import 'source-map-support/register'
import * as middy from 'middy'
import {getTodoItem, deleteTodoItem} from "../../businessLogic/todos";
import { getUserId } from '../utils'


import { cors } from 'middy/middlewares'
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'

import { createLogger } from '../../utils/logger'
const logger = createLogger('api_calls')

export const handler = middy(async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  logger.info('Processing event .. ', event)

  const todoId = event.pathParameters.todoId
  const userId = getUserId(event)

  // Velidate user owns the requested item.
  const todoItem = await getTodoItem(todoId, userId)

  if (!todoItem) {
    return {
      statusCode: 404,
      body: JSON.stringify({
        message: 'Todo does not exist'
      })
    }
  }

  logger.info("Delete Item with ID: ", todoId)
  deleteTodoItem(userId, todoItem.createdAt);

  return {
    statusCode: 202,
    body: ''
  }

})

handler.use(cors({
    credentials: true
}))



