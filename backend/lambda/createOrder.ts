import { randomUUID } from 'crypto';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';
import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs';

const dynamoclient = new DynamoDBClient({});
const dynamo = DynamoDBDocumentClient.from(dynamoclient); // we use DynamoDBDocumentClient over raw client because the former handles the marshalling of annotating according to DynamoDB's type system so that we can write plain JS objects
const sqsclient = new SQSClient({});

export const handler = async (event: any) => {
    const body = JSON.parse(event.body);

    if (!body.customerId || !body.email || !body.items || !body.totalAmount) {
        return {
            headers: { 'Access-Control-Allow-Origin': '*' },
            statusCode: 400,
            body: `Customer Order doesn't contain one of customerId, email, items, or totalAmount\n`
        }
    }

    const orderObject = {
        "orderID": randomUUID(),
        "customerId": body.customerId,
        "email": body.email,
        "items": body.items,
        "totalAmount": body.totalAmount,
        "createdAt": new Date().toISOString(),
        "status": "PENDING"
    }

    await dynamo.send(new PutCommand({
        TableName: process.env.TABLE_NAME,
        Item: orderObject
    }));

    await sqsclient.send(new SendMessageCommand({
        QueueUrl: process.env.QUEUE_URL,
        MessageBody: JSON.stringify(orderObject)
    }))

    return {
        headers: { 'Access-Control-Allow-Origin': '*' },
        statusCode: 201,
        body: JSON.stringify({ message: `Order received successfully, order id: ${orderObject.orderID}` })
    };
}