import { handler } from '../lambda/sendOrderConfirmation';

const mockDynamoSend = jest.fn();
const mockSesSend = jest.fn();

jest.mock('@aws-sdk/client-dynamodb', () => ({
    DynamoDBClient: jest.fn().mockImplementation(() => ({}))
}));

jest.mock('@aws-sdk/lib-dynamodb', () => ({
    DynamoDBDocumentClient: { from: jest.fn(() => ({ send: (...args: any[]) => mockDynamoSend(...args) })) },
    GetCommand: jest.fn()
}));

jest.mock('@aws-sdk/client-ses', () => ({
    SESClient: jest.fn().mockImplementation(() => ({ send: (...args: any[]) => mockSesSend(...args) })),
    SendEmailCommand: jest.fn()
}));

beforeEach(() => {
    jest.clearAllMocks();
});

const event = {
    detail: { orderID: 'order-123', fraudScore: 0.3 }
};

test('sends confirmation email when order has email', async () => {
    mockDynamoSend.mockResolvedValueOnce({ Item: { orderID: 'order-123', email: 'customer@example.com', totalAmount: 99.99 } });
    mockSesSend.mockResolvedValueOnce({});

    await handler(event);

    expect(mockSesSend).toHaveBeenCalledTimes(1);
});

test('does not send email when order is not found', async () => {
    mockDynamoSend.mockResolvedValueOnce({ Item: undefined });

    await handler(event);

    expect(mockSesSend).not.toHaveBeenCalled();
});

test('does not send email when order has no email field', async () => {
    mockDynamoSend.mockResolvedValueOnce({ Item: { orderID: 'order-123', totalAmount: 99.99 } });

    await handler(event);

    expect(mockSesSend).not.toHaveBeenCalled();
});
