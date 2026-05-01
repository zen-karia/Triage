import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, UpdateCommand } from '@aws-sdk/lib-dynamodb';

const dynamoclient = new DynamoDBClient({});
const dynamo = DynamoDBDocumentClient.from(dynamoclient);

export const handler = async (event: any) => {
    for (const record of event.Records) {
        const currOrder = JSON.parse(record.body)
        try {
            await dynamo.send(new UpdateCommand({
                TableName: process.env.TABLE_NAME,
                Key: { orderID: currOrder.orderID },
                UpdateExpression: 'SET #s = :processing',
                ConditionExpression: '#s = :pending',
                ExpressionAttributeNames: { '#s': 'status' },
                ExpressionAttributeValues: { ':processing': 'PROCESSING', ':pending': 'PENDING' }
            }));
        } catch (e: any) {
            if (e.name === 'ConditionalCheckFailedException') {
                console.log(`Duplicate order, skipping orderID: ${currOrder.orderID}`);
            } else {
                throw e;
            }
        }
    }
}