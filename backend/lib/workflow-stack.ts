import * as cdk from 'aws-cdk-lib/core';
import { Construct } from 'constructs';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Runtime, Tracing } from 'aws-cdk-lib/aws-lambda';
import { StateMachine, Chain, Fail, TaskInput, Choice, Condition, DefinitionBody } from 'aws-cdk-lib/aws-stepfunctions';
import { LambdaInvoke, SqsSendMessage, EventBridgePutEvents } from 'aws-cdk-lib/aws-stepfunctions-tasks';
import { Table } from 'aws-cdk-lib/aws-dynamodb';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Queue } from 'aws-cdk-lib/aws-sqs';
import { EventBus } from 'aws-cdk-lib/aws-events';

interface WorkflowStackProps extends cdk.StackProps {
    orderTable: Table,
    orderEventBus: EventBus
}
export class WorkflowStack extends cdk.Stack {
    public readonly orderStateMachine: StateMachine;
    constructor(scope: Construct, id: string, props: WorkflowStackProps) {
        super(scope, id, props);

        const aiFraudScoreHandler = new NodejsFunction(this, 'AIFraudScoreHandler', {
            entry: 'lambda/aiFraudScore.ts',
            handler: 'handler',
            runtime: Runtime.NODEJS_22_X,
            environment: {
                TABLE_NAME: props.orderTable.tableName
            },
            tracing: Tracing.ACTIVE
        });

        const checkInventoryHandler = new NodejsFunction(this, 'CheckInventoryHandler', {
            entry: 'lambda/checkInventory.ts',
            handler: 'handler',
            runtime: Runtime.NODEJS_22_X,
            environment: {
                TABLE_NAME: props.orderTable.tableName
            },
            tracing: Tracing.ACTIVE,
            memorySize: 1024
        });

        const processPaymentHandler = new NodejsFunction(this, 'ProcessPaymentHandler', {
            entry: 'lambda/processPayment.ts',
            handler: 'handler',
            runtime: Runtime.NODEJS_22_X,
            environment: {
                TABLE_NAME: props.orderTable.tableName
            },
            tracing: Tracing.ACTIVE,
            memorySize: 512
        });

        const fulfillOrderHandler = new NodejsFunction(this, 'FulfillOrderHandler', {
            entry: 'lambda/fulfillOrder.ts',
            handler: 'handler',
            runtime: Runtime.NODEJS_22_X,
            environment: {
                TABLE_NAME: props.orderTable.tableName
            },
            tracing: Tracing.ACTIVE,
            memorySize: 512
        });

        const failstate = new Fail(this, 'OrderFailed', {
            cause: 'Step failed after retries',
            error: 'OrderProcessingError'
        });

        const aiFraudScoreTask = new LambdaInvoke(this, 'AIFraudScoreTask', {
            lambdaFunction: aiFraudScoreHandler,
            outputPath: '$.Payload'
        })

        aiFraudScoreTask.addRetry({ 
            maxAttempts: 2,
            interval: cdk.Duration.seconds(2),
            backoffRate: 2
        });
        aiFraudScoreTask.addCatch(failstate);

        const checkInventoryTask = new LambdaInvoke(this, 'CheckInventoryTask', {
            lambdaFunction: checkInventoryHandler,
            outputPath: '$.Payload'
        })

        checkInventoryTask.addRetry({ 
            maxAttempts: 2,
            interval: cdk.Duration.seconds(2),
            backoffRate: 2
        });
        checkInventoryTask.addCatch(failstate);

        const processPaymentTask = new LambdaInvoke(this, 'ProcessPaymentTask', {
            lambdaFunction: processPaymentHandler,
            outputPath: '$.Payload'
        })

        processPaymentTask.addRetry({ 
            maxAttempts: 2,
            interval: cdk.Duration.seconds(2),
            backoffRate: 2
        });
        processPaymentTask.addCatch(failstate);

        const fulfillOrderTask = new LambdaInvoke(this, 'FulfillOrderTask', {
            lambdaFunction: fulfillOrderHandler,
            outputPath: '$.Payload'
        })

        fulfillOrderTask.addRetry({ 
            maxAttempts: 2,
            interval: cdk.Duration.seconds(2),
            backoffRate: 2
        });
        fulfillOrderTask.addCatch(failstate);

        const manualReviewQueue = new Queue(this, 'ManualReviewQueue');

        const manualReviewTask = new SqsSendMessage(this, 'SendToManualReview', {
            queue: manualReviewQueue,
            messageBody: TaskInput.fromJsonPathAt('$')
        });

        const publishOrderCompleted = new EventBridgePutEvents(this, 'PublishOrderCompleted', {
            entries: [{
                eventBus: props.orderEventBus,
                source: 'triage.orders',
                detailType: 'OrderCompleted',
                detail: TaskInput.fromJsonPathAt('$')
            }]
        });

        const publishOrderFlagged = new EventBridgePutEvents(this, 'PublishOrderFlagged', {
            entries: [{
                eventBus: props.orderEventBus,
                source: 'triage.orders',
                detailType: 'OrderFlagged',
                detail: TaskInput.fromJsonPathAt('$')
            }]
        });

        const fraudCheck = new Choice(this, 'FraudCheck');
        fraudCheck
            .when(Condition.numberGreaterThan('$.fraudScore', 0.7), manualReviewTask.next(publishOrderFlagged))
            .otherwise(checkInventoryTask.next(processPaymentTask).next(fulfillOrderTask.next(publishOrderCompleted)));


        const definition = Chain.start(aiFraudScoreTask).next(fraudCheck);

        this.orderStateMachine = new StateMachine(this, 'OrderWorkflow', {
            definitionBody: DefinitionBody.fromChainable(definition),
            tracingEnabled: true
        });

        props.orderTable.grantWriteData(aiFraudScoreHandler);
        props.orderTable.grantWriteData(checkInventoryHandler);
        props.orderTable.grantWriteData(processPaymentHandler);
        props.orderTable.grantWriteData(fulfillOrderHandler);

        aiFraudScoreHandler.addToRolePolicy(new iam.PolicyStatement({
            actions: ['bedrock:InvokeModel'],
            resources: ['*']
        }));

        aiFraudScoreHandler.addToRolePolicy(new iam.PolicyStatement({
            actions: ['cloudwatch:PutMetricData'],
            resources: ['*']
        }));

        props.orderEventBus.grantPutEventsTo(this.orderStateMachine);
    }
}