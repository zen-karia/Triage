import * as cdk from 'aws-cdk-lib/core';
import { Construct } from 'constructs';
import { EventBus } from 'aws-cdk-lib/aws-events';

export class EventBridgeStack extends cdk.Stack {
    public readonly orderEventBus: EventBus
    constructor(scope: Construct, id: string, props: cdk.StackProps) {
        super(scope, id, props);

        this.orderEventBus = new EventBus(this, "OrderEventBus")
    }
}