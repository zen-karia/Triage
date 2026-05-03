import * as cdk from 'aws-cdk-lib/core';
import { Construct } from 'constructs';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import { StateMachine, Chain } from 'aws-cdk-lib/aws-stepfunctions';
import { LambdaInvoke } from 'aws-cdk-lib/aws-stepfunctions-tasks';

export class WorkflowStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props: cdk.StackProps) {
        super(scope, id, props);

        const aiFraudScoreHandler = new NodejsFunction(this, 'AIFraudScoreHandler', {
            entry: 'lambda/aiFraudScore.ts',
            handler: 'handler',
            runtime: Runtime.NODEJS_22_X
        });

        const checkInventoryHandler = new NodejsFunction(this, 'CheckInventoryHandler', {
            entry: 'lambda/checkInventory.ts',
            handler: 'handler',
            runtime: Runtime.NODEJS_22_X
        });

        const processPaymentHandler = new NodejsFunction(this, 'ProcessPaymentHandler', {
            entry: 'lambda/processPayment.ts',
            handler: 'handler',
            runtime: Runtime.NODEJS_22_X
        });

        const fulfillOrderHandler = new NodejsFunction(this, 'FulfillOrderHandler', {
            entry: 'lambda/fulfillOrder.ts',
            handler: 'handler',
            runtime: Runtime.NODEJS_22_X
        });

        const aiFraudScoreTask = new LambdaInvoke(this, 'AIFraudScoreTask', {
            lambdaFunction: aiFraudScoreHandler,
            outputPath: '$.Payload'
        })

        const checkInventoryTask = new LambdaInvoke(this, 'CheckInventoryTask', {
            lambdaFunction: checkInventoryHandler,
            outputPath: '$.Payload'
        })

        const processPaymentTask = new LambdaInvoke(this, 'ProcessPaymentTask', {
            lambdaFunction: processPaymentHandler,
            outputPath: '$.Payload'
        })

        const fulfillOrderTask = new LambdaInvoke(this, 'FulfillOrderTask', {
            lambdaFunction: fulfillOrderHandler,
            outputPath: '$.Payload'
        })

        const definition = Chain.start(aiFraudScoreTask).next(checkInventoryTask).next(processPaymentTask).next(fulfillOrderTask);

        new StateMachine(this, 'OrderWorkflow', {definition});
    }
}