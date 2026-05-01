import * as cdk from 'aws-cdk-lib/core';
import { Construct } from 'constructs';
import { Queue } from 'aws-cdk-lib/aws-sqs';

export class MessagingStack extends cdk.Stack { // Separate Stack for orderQueue because its job is to pass the order details forward from the handler after writing to the table for further processing like fraud scoring etc.
    public readonly orderQueue: Queue
    constructor(scope: Construct,  id: string, props?: cdk.StackProps) {
        super(scope, id, props);
        
        this.orderQueue = new Queue(this, "OrderQueue");
    }
}