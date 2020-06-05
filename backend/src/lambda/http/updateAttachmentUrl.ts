import { SNSEvent, SNSHandler, S3EventRecord } from 'aws-lambda'
import 'source-map-support/register'

// import {updateAttachmentUrl} from "../../businessLogic/todos";

import { createLogger } from '../../utils/logger'
const logger = createLogger('s3_events')

// For updateAttachementUrl function
import * as AWS from 'aws-sdk'
const docClient = new AWS.DynamoDB.DocumentClient()
const todoTable = process.env.TODOS_TABLE
const todoIdIndex = process.env.TODO_ID_INDEX
import {TodoItem} from "../../models/TodoItem";


export const handler: SNSHandler = async (event: SNSEvent) => {
  logger.info('Processing SNS event ', {event: event})

  for (const snsRecord of event.Records) {
    const s3EventStr = snsRecord.Sns.Message

    const s3Event = JSON.parse(s3EventStr)
    logger.info('Parsed s3 Event', {s3Event: s3Event})

    for (const record of s3Event.Records) {
      await processImage(record)
    }
  }
}

/**
 * Proecss a single record
 * 
 * @param record 
 */
async function processImage(record: S3EventRecord) {
  logger.info('Processing S3 Event Record ', {record: record})

  if (record.eventName === 'ObjectCreated:Put') {
    const bucket = record.s3.bucket.name
    const imageId = record.s3.object.key
    const attachmentUrl = `https://${bucket}.s3.amazonaws.com/${imageId}`

    await updateAttachmentUrl(imageId, attachmentUrl)
  }
}

/**
 * Update attachmentURL value on DynamoDB table
 * 
 * @param imageId 
 * @param attachmentUrl 
 */
async function updateAttachmentUrl(imageId: string, attachmentUrl: string) {

  const split = imageId.split('-sss-')
  const todoId = split[0]
  const userId = decodeURIComponent(split[1])

  logger.info('Fetching todo item from the database.', {Info: {todoId: todoId, userId: userId}})

  const resultExisting = await docClient.query({
      TableName : todoTable,
      IndexName : todoIdIndex,
      KeyConditionExpression: 'todoId = :todoId and userId = :userId',
      ExpressionAttributeValues: {
          ':todoId': todoId,
          ':userId': userId
      }
  }).promise()

  if (await resultExisting.Count === 0) {
    // Log the event
    logger.info("Todo item doesn't exist in database.", {Info: {todoId: todoId, userId: userId, imageId: imageId}})
    return
  }

  var todoItem = await resultExisting.Items[0] as TodoItem
  logger.info('Todo item fetched from the database', {todoItem: todoItem})

  // Update record
  logger.info('Updating todo item to the database', {Info: {todoItem: todoItem, userId: userId, createdAt: todoItem.createdAt, attachmentUrl: attachmentUrl}})
  const result = await docClient.update({
      TableName: todoTable,
      Key: {
          "userId": userId,
          "createdAt": todoItem.createdAt
      },
      UpdateExpression: "set attachmentUrl = :attachmentUrl",
      ExpressionAttributeValues: {
          ":attachmentUrl": attachmentUrl
      },
      ReturnValues: "UPDATED_NEW"
  }).promise();

  logger.info("Updated record with attachment information", {Info: {result: await result}})

}