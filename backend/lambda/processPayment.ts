import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, UpdateCommand } from '@aws-sdk/lib-dynamodb';

const dynamoclient = new DynamoDBClient({});
const dynamo = DynamoDBDocumentClient.from(dynamoclient);

export const handler = async (event : any) => {
    console.log('Processing Payment', event);
    await dynamo.send(new UpdateCommand({
        TableName: process.env.TABLE_NAME,
        Key: { orderID: event.orderID },
        UpdateExpression: 'SET #s = :process_payment',
        ExpressionAttributeNames: { '#s': 'status' },
        ExpressionAttributeValues: { ':process_payment': 'PROCESSING_PAYMENT' }
    }));
    return event;
}