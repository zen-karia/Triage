import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses'

const sesClient = new SESClient({});

export const handler = async (event : any) => {
    await sesClient.send(new SendEmailCommand({
        Source: process.env.SENDER_EMAIL,
        Destination: {
            ToAddresses: [process.env.RECIPIENT_EMAIL!]
        },
        Message: {
            Subject: {
                Data: `Order Confirmed - ${event.detail.orderID}`
            },
            Body: {
                Text: {
                    Data: `Your order ${event.detail.orderID} has been confirmed.\nTotal: $${event.detail.totalAmount}\nFraud Score: ${event.detail.fraudScore}`
                }
            }
        }
    }));
}