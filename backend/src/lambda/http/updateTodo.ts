import 'source-map-support/register'
import { cors } from 'middy/middlewares'
import { getUserId } from '../utils'
import * as middy from 'middy'

import {getTodoItem, updateTodoItem} from "../../businessLogic/todos";

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'

import { UpdateTodoRequest } from '../../requests/UpdateTodoRequest'

import { createLogger } from '../../utils/logger'
const logger = createLogger('api_calls')


export const handler = middy(async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  logger.info('Processing event .. ', event)
  
  const todoId = event.pathParameters.todoId
  const userId = getUserId(event)
  const updatedTodoRequest: UpdateTodoRequest = JSON.parse(event.body)

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

  const updatedTodoItem = await updateTodoItem(updatedTodoRequest, userId, todoItem.createdAt)

  logger.info("Todo updated", updatedTodoItem)

  return {
    statusCode: 200,
    body: JSON.stringify({
      ...todoItem,
      name: updatedTodoItem.name,
      dueDate: updatedTodoItem.dueDate,
      done: updatedTodoItem.done
    })
  }

})

handler.use(cors({
  credentials: true
}))