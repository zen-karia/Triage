import { handler } from '../lambda/createOrder';

jest.mock('@aws-sdk/lib-dynamodb', () => ({
    DynamoDBDocumentClient: { from: jest.fn(() => ({ send: jest.fn() })) },
    PutCommand: jest.fn()
}));

test('returns 400 when customerId is missing', async () => {
    const event = {
        body: JSON.stringify({ items: ['item1'], totalAmount: 100 })
    };

    const result = await handler(event as any);

    expect(result.statusCode).toBe(400);
});

test('returns 400 when the totalAmount is missing', async () => {
    const event = {
        body: JSON.stringify({ customerId: 'c1', items: ['item1'] })
    };

    const result = await handler(event as any);
    expect(result.statusCode).toBe(400);
});

test('returns 201 when the order is valid', async () => {
    const event = {
        body: JSON.stringify({ customerId: 'c1', items: ['item1'], totalAmount: 100 })
    };

    const result = await handler(event as any);
    expect(result.statusCode).toBe(201);
});