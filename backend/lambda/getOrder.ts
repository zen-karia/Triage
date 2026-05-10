import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand } from '@aws-sdk/lib-dynamodb';

const dynamoclient = new DynamoDBClient({});
const dynamo = DynamoDBDocumentClient.from(dynamoclient);

export const handler = async (event: any) => {
    const orderId = event.pathParameters.orderId;

    const orderObject = await dynamo.send(new GetCommand({
        TableName: process.env.TABLE_NAME,
        Key: { orderID: orderId }
    }));

    if (!orderObject.Item) {
        return {
            statusCode: 404,
            headers: { 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify({ error: 'Order not found' })
        };
    }

    return {
        statusCode: 200,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify(orderObject.Item)
    };
}