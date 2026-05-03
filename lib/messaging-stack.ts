import * as cdk from 'aws-cdk-lib/core';
import { Construct } from 'constructs';
import { Queue } from 'aws-cdk-lib/aws-sqs';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import { SqsEventSource } from 'aws-cdk-lib/aws-lambda-event-sources';
import { Table } from 'aws-cdk-lib/aws-dynamodb';
import { StateMachine } from 'aws-cdk-lib/aws-stepfunctions';

interface MessagingStackProps extends cdk.StackProps {
    orderTable: Table,
    orderStateMachine: StateMachine
}
export class MessagingStack extends cdk.Stack { // Separate Stack for orderQueue because its job is to pass the order details forward from the handler after writing to the table for further processing like fraud scoring etc.
    public readonly orderQueue: Queue
    constructor(scope: Construct,  id: string, props: MessagingStackProps) {
        super(scope, id, props);
        
        const dlq = new Queue(this, "OrderDLQ");

        this.orderQueue = new Queue(this, "OrderQueue", {
            deadLetterQueue: {
                queue: dlq,
                maxReceiveCount: 3
            }
        });

        const workerHandler = new NodejsFunction(this, 'WorkerHandler', {
            entry: 'lambda/orderWorker.ts',
            handler: 'handler',
            runtime: Runtime.NODEJS_22_X,
            environment: {
                TABLE_NAME: props.orderTable.tableName,
                STATE_MACHINE_ARN: props.orderStateMachine.stateMachineArn
            }
        });

        workerHandler.addEventSource(new SqsEventSource(this.orderQueue));

        props.orderTable.grantWriteData(workerHandler);

        props.orderStateMachine.grantStartExecution(workerHandler)
    }
}