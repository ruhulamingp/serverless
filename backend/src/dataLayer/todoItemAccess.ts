import * as AWS from 'aws-sdk'
import * as AWSXRay from 'aws-xray-sdk'
import {DocumentClient} from 'aws-sdk/clients/dynamodb'

const XAWS = AWSXRay.captureAWS(AWS)

import {TodoItem} from "../models/TodoItem";
import {TodoUpdate} from "../models/TodoUpdate";

import { createLogger } from '../utils/logger'
const logger = createLogger('data_layer')

export class TodoItemAccess {

    constructor(
        private readonly docClient: DocumentClient = createDynamoDBClient(),
        private readonly todoTable = process.env.TODOS_TABLE,
        private readonly todoIdIndex = process.env.TODO_ID_INDEX) {
            
    }

    /**
     * Get TodoItem using composite key
     * @param todoId 
     * @param userId 
     */
    async getTodoItem(todoId: string, userId: string): Promise<TodoItem|null> {
        const result = await this.docClient.query({
            TableName : this.todoTable,
            IndexName : this.todoIdIndex,
            KeyConditionExpression: 'todoId = :todoId and userId = :userId',
            ExpressionAttributeValues: {
                ':todoId': todoId,
                ':userId': userId
            }
        }).promise()
    
        if (result.Count !== 0) {
            return result.Items[0] as TodoItem
        }

        return null
    }

    /**
     * Get all todo items fo a user
     * 
     * @param userId 
     */
    async getTodoItems(userId: string) : Promise<TodoItem[]> {
        const result = await this.docClient
                      .query({
                        TableName: this.todoTable,
                        IndexName: this.todoIdIndex,
                        KeyConditionExpression: 'userId = :userId',
                        ExpressionAttributeValues: {
                          ':userId': userId
                        }
                      })
                      .promise()

        // debug
        logger.debug('get items results ', result)

        return result.Items as TodoItem[]
    }

    /**
     * Create a todo item
     * 
     * @param todoItem 
     */
    async createTodoItem(todoItem: TodoItem): Promise<TodoItem> {
        logger.info('Create new TodoItem: ', todoItem)
        await this.docClient.put({
            TableName: this.todoTable,
            Item: todoItem
        }).promise()

        // debug
        logger.debug('create todo item ', todoItem)

        return Promise.resolve(todoItem)
    }


    async updateTodoItem(todoUpdate: TodoUpdate, userId: string, createdAt: string): Promise<TodoUpdate> {
        logger.info('Updating existing TodoItem with userId and createdAt', {userId: userId, createdAt: createdAt})

        const result = this.docClient.update({
            TableName: this.todoTable,
            Key: {
                "userId": userId,
                "createdAt": createdAt
            },
            UpdateExpression: "set #todo_name = :name, dueDate = :dueDate, done = :done",
            ExpressionAttributeValues: {
                ":name": todoUpdate.name,
                ":dueDate": todoUpdate.dueDate,
                ":done": todoUpdate.done
            },
            ExpressionAttributeNames: {
                '#todo_name' : "name"
            },
            ReturnValues: "UPDATED_NEW"
        }).promise();

        // debug
        logger.debug("update result ", result)

        return todoUpdate;
    }

    async updateAttachmentUrl(todoId: string, userId, attachmentUrl: string): Promise<null> {
        logger.info('Updating todo item for attachmentUrl', {Info: {todoId: todoId, userId: userId, attachmentUrl: attachmentUrl}})

        logger.info('Fetching todo item from the database.', {Info: {todoId: todoId, userId: userId}})
        const queryResult = await this.docClient.query({
            TableName : this.todoTable,
            IndexName : this.todoIdIndex,
            KeyConditionExpression: 'todoId = :todoId and userId = :userId',
            ExpressionAttributeValues: {
                ':todoId': todoId,
                ':userId': userId
            }
        }).promise()
        
        if (await queryResult.Count === 0) {
            logger.info("Todo item doesn't exist in database.", {Info: {todoId: todoId, userId: userId}})
            return
        }

        const todoItem = await queryResult.Items[0] as TodoItem
        logger.info('Todo item fetched from the database', {todoItem: todoItem})


        // Update record in database
        logger.info('Updating todo item to the database', {Info: {todoItem: todoItem, userId: userId, createdAt: todoItem.createdAt, attachmentUrl: attachmentUrl}})
        
        const updateResult = await this.docClient.update({
            TableName: this.todoTable,
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

        logger.info("Updated record with attachmentUrl", {Info: {updateResult: await updateResult}})
    }

    /**
     * Delete todo item using composite key
     * 
     * @param userId 
     * @param createdAt 
     */
    async deleteTodoItem(userId: string, createdAt: string) {
        logger.info('Deleting a TodoItem with userId and createdAt', {userId: userId, createdAt: createdAt})

        await this.docClient.delete({
            TableName: this.todoTable,
            Key: {
                userId: userId,
                createdAt: createdAt
            }
        }).promise();
    }



}

function createDynamoDBClient() {
    return new XAWS.DynamoDB.DocumentClient()
}