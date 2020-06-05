import 'source-map-support/register'
import { getUserId } from '../utils'
import * as middy from 'middy'
import { cors } from 'middy/middlewares'

import { createLogger } from '../../utils/logger'
const logger = createLogger('api_calls')

import {getTodoItems} from "../../businessLogic/todos";

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'

export const handler = middy(async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  logger.info('Processing event .. ', event)

  const userId = getUserId(event);
  const items = await getTodoItems(userId);

  logger.info('Items retrieved', items)

  return {
    statusCode: 200,
    body: JSON.stringify({
      items: items
    })
  }
})

handler.use(cors({    
    credentials: true
}))