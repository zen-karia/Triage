import * as cdk from 'aws-cdk-lib/core';
import { Construct } from 'constructs';
import { EventBus, Rule } from 'aws-cdk-lib/aws-events';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import { LambdaFunction } from 'aws-cdk-lib/aws-events-targets';
import * as iam from 'aws-cdk-lib/aws-iam';

export class EventBridgeStack extends cdk.Stack {
    public readonly orderEventBus: EventBus
    constructor(scope: Construct, id: string, props: cdk.StackProps) {
        super(scope, id, props);

        this.orderEventBus = new EventBus(this, 'OrderEventBus');

        const sendOrderConfirmationHandler = new NodejsFunction(this, 'SendOrderConfirmationHandler', {
            entry: 'lambda/sendOrderConfirmation.ts',
            handler: 'handler',
            runtime: Runtime.NODEJS_22_X,
            environment: {
                SENDER_EMAIL: 'zenilkaria2006@gmail.com',
                RECIPIENT_EMAIL: 'zenilkaria2006@gmail.com'
            }
        });

        sendOrderConfirmationHandler.addToRolePolicy(new iam.PolicyStatement({
            actions: ['ses:SendEmail'],
            resources: ['*']
        }));

        new Rule(this, 'OrderCompletedRule', {
            eventBus: this.orderEventBus,
            eventPattern: {
                source: ['triage.orders'],
                detailType: ['OrderCompleted']
            },
            targets: [new LambdaFunction(sendOrderConfirmationHandler)]
        });
    }
}
