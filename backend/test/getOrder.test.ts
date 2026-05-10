import { handler } from '../lambda/getOrder';

const mockSend = jest.fn();

jest.mock('@aws-sdk/client-dynamodb', () => ({
    DynamoDBClient: jest.fn().mockImplementation(() => ({}))
}));

jest.mock('@aws-sdk/lib-dynamodb', () => ({
    DynamoDBDocumentClient: { from: jest.fn(() => ({ send: (...args: any[]) => mockSend(...args) }) ) },
    GetCommand: jest.fn()
}));

test('returns 404 when order is not found', async () => {
    mockSend.mockResolvedValueOnce({ Item: undefined });

    const event = { pathParameters: { orderId: 'non-existent-id' } };
    const result = await handler(event as any);

    expect(result.statusCode).toBe(404);
});

test('returns 200 with order item when found', async () => {
    const mockOrder = { orderID: 'abc-123', status: 'COMPLETED', totalAmount: 99.99 };
    mockSend.mockResolvedValueOnce({ Item: mockOrder });

    const event = { pathParameters: { orderId: 'abc-123' } };
    const result = await handler(event as any);

    expect(result.statusCode).toBe(200);
    expect(JSON.parse(result.body)).toEqual(mockOrder);
});
