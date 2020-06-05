import * as uuid from 'uuid';
import {TodoItem} from "../models/TodoItem";
import {TodoUpdate} from "../models/TodoUpdate";
import {CreateTodoRequest} from "../requests/CreateTodoRequest";
import {UpdateTodoRequest} from "../requests/UpdateTodoRequest";
import {TodoItemAccess} from "../dataLayer/todoItemAccess";
import { getS3SignedUrl } from '../utils/s3'

const todoItemAccess = new TodoItemAccess();

export async function getTodoItem(todoId: string, userId: string): Promise<TodoItem> {
    return await todoItemAccess.getTodoItem(todoId, userId)
}

export async function deleteTodoItem(userId: string, createdAt: string) {
    return await todoItemAccess.deleteTodoItem(userId, createdAt)
}

export async function getTodoItems(userId: string) : Promise<TodoItem[]> {
    return await todoItemAccess.getTodoItems(userId)
}

export async function createTodoItem(createTodoRequest: CreateTodoRequest, userId: string) : Promise<TodoItem> {
    const createdAt = new Date().toISOString()
    const todoId = uuid.v4();

    return await todoItemAccess.createTodoItem({
        todoId: todoId,
        userId: userId,
        name: createTodoRequest.name,
        createdAt: createdAt,
        dueDate: createTodoRequest.dueDate,
        done: false,
        attachmentUrl: null
    })
}


export async function updateTodoItem(UpdatedTodoRequest: UpdateTodoRequest, userId: string, createdAt: string): Promise<TodoUpdate> {
    return await todoItemAccess.updateTodoItem(UpdatedTodoRequest as TodoUpdate, userId, createdAt);
}


export function generateUploadUrl(todoId: string, userId: string) : string {
    const imageId = `${todoId}-sss-${userId}-sss-` + uuid.v4();
    return getS3SignedUrl(imageId, 'putObject')
}

export function updateAttachmentUrl(imageId: string, attachmentUrl: string): Promise<null> {

    const split = imageId.split('-sss-')
    const todoId = split[0]
    const userId = decodeURIComponent(split[1])

    return todoItemAccess.updateAttachmentUrl(todoId, userId, attachmentUrl)

}