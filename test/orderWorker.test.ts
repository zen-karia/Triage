import { handler } from '../lambda/orderWorker';

// var (not const) required here — jest.mock is hoisted above variable declarations,
// causing TDZ errors with const. var avoids this; the wrapper below captures the binding
// so tests read the current value of mockSend when send is actually called.
// eslint-disable-next-line no-var
var mockSend = jest.fn();

jest.mock('@aws-sdk/client-dynamodb', () => ({
    DynamoDBClient: jest.fn().mockImplementation(() => ({}))
}));

jest.mock('@aws-sdk/lib-dynamodb', () => ({
    DynamoDBDocumentClient: { from: jest.fn(() => ({ send: (...args: any[]) => mockSend(...args) })) },
    UpdateCommand: jest.fn()
}));

jest.mock('@aws-sdk/client-sfn', () => ({
    SFNClient: jest.fn().mockImplementation(() => ({ send: jest.fn() })),
    StartExecutionCommand: jest.fn()
}));

const makeEvent = (order: object) => ({
    Records: [{ body: JSON.stringify(order) }]
});

const order = { orderID: 'abc-123', customerId: 'c1', items: ['item1'], totalAmount: 100, status: 'PENDING' };

beforeEach(() => {
    mockSend.mockReset();
});

test('processes a valid order and starts state machine execution', async () => {
    mockSend.mockResolvedValueOnce({});
    await expect(handler(makeEvent(order) as any)).resolves.toBeUndefined();
});

test('skips duplicate order when ConditionalCheckFailedException is thrown', async () => {
    const error = new Error('Conditional check failed');
    error.name = 'ConditionalCheckFailedException';
    mockSend.mockRejectedValueOnce(error);
    await expect(handler(makeEvent(order) as any)).resolves.toBeUndefined();
});

test('rethrows unexpected errors', async () => {
    const error = new Error('Unexpected DB error');
    error.name = 'InternalServerError';
    mockSend.mockRejectedValueOnce(error);
    await expect(handler(makeEvent(order) as any)).rejects.toThrow('Unexpected DB error');
});
