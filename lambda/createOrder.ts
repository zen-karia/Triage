import { randomUUID } from 'crypto';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({});
const dynamo = DynamoDBDocumentClient.from(client);

export const handler = async (event: any) => {
    const body = JSON.parse(event.body);

    if (!body.customerId || !body.items || !body.totalAmount) {
        return {
            statusCode: 400,
            body: `Customer Order doesn't contain one of customerId, items, or totalAmount\n`
        }
    }

    const orderObject = {
        "orderId": randomUUID(),
        "customerId": body.customerId,
        "items": body.items,
        "totalAmount": body.totalAmount,
        "createdAt": new Date().toISOString(),
        "status": "PENDING"
    }

    await dynamo.send(new PutCommand({
        TableName: process.env.TABLE_NAME,
        Item: orderObject
    }));

    return {
        statusCode: 201,
        body: JSON.stringify({ orderId: orderObject.orderId })
    };
}