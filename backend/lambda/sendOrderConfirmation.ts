import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, GetCommand } from '@aws-sdk/lib-dynamodb'

const sesClient = new SESClient({});
const dynamo = DynamoDBDocumentClient.from(new DynamoDBClient({}));

export const handler = async (event : any) => {
    const orderId = event.detail.orderID;

    const result = await dynamo.send(new GetCommand({
        TableName: process.env.TABLE_NAME,
        Key: { orderID: orderId }
    }));

    const order = result.Item;
    if (!order || !order.email) return;

    await sesClient.send(new SendEmailCommand({
        Source: process.env.SENDER_EMAIL,
        Destination: {
            ToAddresses: [order.email]
        },
        Message: {
            Subject: {
                Data: `Order Confirmed - ${orderId}`
            },
            Body: {
                Text: {
                    Data: `Your order ${orderId} has been confirmed.\nTotal: $${order.totalAmount}\nFraud Score: ${event.detail.fraudScore}`
                }
            }
        }
    }));
}
