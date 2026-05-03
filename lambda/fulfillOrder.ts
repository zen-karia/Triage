import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, UpdateCommand } from '@aws-sdk/lib-dynamodb';

const dynamoclient = new DynamoDBClient({});
const dynamo = DynamoDBDocumentClient.from(dynamoclient);

export const handler = async (event : any) => {
    console.log('Fulfilling Order Request', event);
    await dynamo.send(new UpdateCommand({
        TableName: process.env.TABLE_NAME,
        Key: { orderID: event.orderID },
        UpdateExpression: 'SET #s = :fulfill_order',
        ExpressionAttributeNames: { '#s': 'status' },
        ExpressionAttributeValues: { ':fulfill_order': 'COMPLETED' }
    }));
    return event;
}