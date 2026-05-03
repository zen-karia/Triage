import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, UpdateCommand } from '@aws-sdk/lib-dynamodb';

const dynamoclient = new DynamoDBClient({});
const dynamo = DynamoDBDocumentClient.from(dynamoclient);

export const handler = async (event : any) => {
    console.log('Checking the Inventory', event);
    await dynamo.send(new UpdateCommand({
        TableName: process.env.TABLE_NAME,
        Key: { orderID: event.orderID },
        UpdateExpression: 'SET #s = :check_inventory',
        ExpressionAttributeNames: { '#s': 'status' },
        ExpressionAttributeValues: { ':check_inventory': 'CHECKING_INVENTORY' }
    }));
    return event;
}