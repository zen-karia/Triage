import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { BedrockRuntimeClient, InvokeModelCommand } from "@aws-sdk/client-bedrock-runtime";
import { CloudWatchClient, PutMetricDataCommand } from "@aws-sdk/client-cloudwatch"

const dynamoclient = new DynamoDBClient({});
const dynamo = DynamoDBDocumentClient.from(dynamoclient);
const bedrockclient = new BedrockRuntimeClient({ region: 'us-east-1' });
const cloudwatchclient = new CloudWatchClient({});

export const handler = async (event : any) => {
    console.log('AIFraudScore executing', event);

    await dynamo.send(new UpdateCommand({
        TableName: process.env.TABLE_NAME,
        Key: { orderID: event.orderID },
        UpdateExpression: 'SET #s = :fraud_checking',
        ExpressionAttributeNames: { '#s': 'status' },
        ExpressionAttributeValues: { ':fraud_checking': 'FRAUD_CHECKING' }
    }));

    const prompt = `You are a fraud detection system for an e-commerce platform.

    Analyze the following order and return a fraud risk score.

    Order details:
    - Total amount: ${event.totalAmount}
    - Items: ${JSON.stringify(event.items)}

    Respond with ONLY a valid JSON object in this exact format, no other text:
    {"score": <number between 0 and 1>, "reasoning": "<one sentence>"}

    A score above 0.7 indicates high fraud risk.`

    const response = await bedrockclient.send(new InvokeModelCommand({
        modelId: 'arn:aws:bedrock:us-east-1:338246863505:inference-profile/global.anthropic.claude-haiku-4-5-20251001-v1:0',
        contentType: 'application/json',
        accept: 'application/json',
        body: JSON.stringify({
            anthropic_version: 'bedrock-2023-05-31',
            max_tokens: 256,
            messages: [{ role: 'user', content: prompt }]
        })
    }));

    const responseBody = JSON.parse(new TextDecoder().decode(response.body));
    const rawText = responseBody.content[0].text.replace(/```json\n?|\n?```/g, '').trim();
    const { score, reasoning } = JSON.parse(rawText);

    const estimated_cost = (responseBody.usage.input_tokens / 1000 * 0.0008) + 
                            (responseBody.usage.output_tokens / 1000 * 0.004);
    
    await cloudwatchclient.send(new PutMetricDataCommand({
        Namespace: 'Triage/Bedrock',
        MetricData: [{
            MetricName: 'CostPerCall',
            Value: estimated_cost,
            Unit: 'None'
        }]
    }));

    await dynamo.send(new UpdateCommand({
        TableName: process.env.TABLE_NAME,
        Key: { orderID: event.orderID },
        UpdateExpression: 'SET #s = :status, fraudScore = :score, fraudReasoning = :reasoning',
        ExpressionAttributeNames: { '#s': 'status' },
        ExpressionAttributeValues: {
            ':status': score > 0.7 ? 'FRAUD_FLAGGED' : 'FRAUD_CHECKED',
            ':score': score,
            ':reasoning': reasoning
        }
    }));
    return { ...event, fraudScore: score, fraudReasoning: reasoning };
}