import * as cdk from 'aws-cdk-lib/core';
import { Construct } from 'constructs';
import { Queue } from 'aws-cdk-lib/aws-sqs';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import { SqsEventSource } from 'aws-cdk-lib/aws-lambda-event-sources';

export class MessagingStack extends cdk.Stack { // Separate Stack for orderQueue because its job is to pass the order details forward from the handler after writing to the table for further processing like fraud scoring etc.
    public readonly orderQueue: Queue
    constructor(scope: Construct,  id: string, props?: cdk.StackProps) {
        super(scope, id, props);
        
        this.orderQueue = new Queue(this, "OrderQueue");

        const workerHandler = new NodejsFunction(this, 'WorkerHandler', {
            entry: 'lambda/orderWorker.ts',
            handler: 'handler',
            runtime: Runtime.NODEJS_22_X
        });

        workerHandler.addEventSource(new SqsEventSource(this.orderQueue));
    }
}