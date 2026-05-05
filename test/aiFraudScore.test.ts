import { handler } from '../lambda/aiFraudScore';
import { UpdateCommand } from '@aws-sdk/lib-dynamodb';

// eslint-disable-next-line no-var
var mockDynamoSend = jest.fn();
// eslint-disable-next-line no-var
var mockBedrockSend = jest.fn();

jest.mock('@aws-sdk/client-dynamodb', () => ({
    DynamoDBClient: jest.fn().mockImplementation(() => ({}))
}));

jest.mock('@aws-sdk/lib-dynamodb', () => ({
    DynamoDBDocumentClient: { from: jest.fn(() => ({ send: (...args: any[]) => mockDynamoSend(...args) })) },
    UpdateCommand: jest.fn()
}));

jest.mock('@aws-sdk/client-bedrock-runtime', () => ({
    BedrockRuntimeClient: jest.fn().mockImplementation(() => ({ send: (...args: any[]) => mockBedrockSend(...args) })),
    InvokeModelCommand: jest.fn()
}));

const makeBedrockResponse = (score: number, reasoning: string) => ({
    body: new TextEncoder().encode(JSON.stringify({
        content: [{ text: JSON.stringify({ score, reasoning }) }]
    }))
});

const order = { orderID: 'abc-123', customerId: 'c1', items: ['book'], totalAmount: 20 };

beforeEach(() => {
    mockDynamoSend.mockReset();
    mockBedrockSend.mockReset();
    (UpdateCommand as unknown as jest.Mock).mockClear();
});

test('returns event with fraudScore and fraudReasoning', async () => {
    mockDynamoSend.mockResolvedValue({});
    mockBedrockSend.mockResolvedValueOnce(makeBedrockResponse(0.3, 'Low risk'));
    const result = await handler(order as any);
    expect(result.fraudScore).toBe(0.3);
    expect(result.fraudReasoning).toBe('Low risk');
});

test('sets status to FRAUD_CHECKED when score is at or below 0.7', async () => {
    mockDynamoSend.mockResolvedValue({});
    mockBedrockSend.mockResolvedValueOnce(makeBedrockResponse(0.3, 'Low risk'));
    await handler(order as any);
    expect(UpdateCommand as unknown as jest.Mock).toHaveBeenNthCalledWith(2, expect.objectContaining({
        ExpressionAttributeValues: expect.objectContaining({ ':status': 'FRAUD_CHECKED' })
    }));
});

test('sets status to FRAUD_FLAGGED when score is above 0.7', async () => {
    mockDynamoSend.mockResolvedValue({});
    mockBedrockSend.mockResolvedValueOnce(makeBedrockResponse(0.85, 'High risk'));
    await handler(order as any);
    expect(UpdateCommand as unknown as jest.Mock).toHaveBeenNthCalledWith(2, expect.objectContaining({
        ExpressionAttributeValues: expect.objectContaining({ ':status': 'FRAUD_FLAGGED' })
    }));
});

test('parses markdown-wrapped Bedrock response correctly', async () => {
    mockDynamoSend.mockResolvedValue({});
    mockBedrockSend.mockResolvedValueOnce({
        body: new TextEncoder().encode(JSON.stringify({
            content: [{ text: '```json\n{"score": 0.5, "reasoning": "Medium risk"}\n```' }]
        }))
    });
    const result = await handler(order as any);
    expect(result.fraudScore).toBe(0.5);
});

test('throws on malformed Bedrock response', async () => {
    mockDynamoSend.mockResolvedValue({});
    mockBedrockSend.mockResolvedValueOnce({
        body: new TextEncoder().encode(JSON.stringify({
            content: [{ text: 'this is not json' }]
        }))
    });
    await expect(handler(order as any)).rejects.toThrow();
});
