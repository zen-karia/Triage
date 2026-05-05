import * as cdk from 'aws-cdk-lib/core';
import { Construct } from 'constructs';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import { StateMachine, Chain, Fail, TaskInput, Choice, Condition } from 'aws-cdk-lib/aws-stepfunctions';
import { LambdaInvoke, SqsSendMessage } from 'aws-cdk-lib/aws-stepfunctions-tasks';
import { Table } from 'aws-cdk-lib/aws-dynamodb';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Queue } from 'aws-cdk-lib/aws-sqs';

interface WorkflowStackProps extends cdk.StackProps {
    orderTable: Table
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
            }
        });

        const checkInventoryHandler = new NodejsFunction(this, 'CheckInventoryHandler', {
            entry: 'lambda/checkInventory.ts',
            handler: 'handler',
            runtime: Runtime.NODEJS_22_X,
            environment: {
                TABLE_NAME: props.orderTable.tableName
            }
        });

        const processPaymentHandler = new NodejsFunction(this, 'ProcessPaymentHandler', {
            entry: 'lambda/processPayment.ts',
            handler: 'handler',
            runtime: Runtime.NODEJS_22_X,
            environment: {
                TABLE_NAME: props.orderTable.tableName
            }
        });

        const fulfillOrderHandler = new NodejsFunction(this, 'FulfillOrderHandler', {
            entry: 'lambda/fulfillOrder.ts',
            handler: 'handler',
            runtime: Runtime.NODEJS_22_X,
            environment: {
                TABLE_NAME: props.orderTable.tableName
            }
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

        const fraudCheck = new Choice(this, 'FraudCheck');
        fraudCheck
            .when(Condition.numberGreaterThan('$.fraudScore', 0.7), manualReviewTask)
            .otherwise(checkInventoryTask.next(processPaymentTask).next(fulfillOrderTask));

        const definition = Chain.start(aiFraudScoreTask).next(fraudCheck);

        this.orderStateMachine = new StateMachine(this, 'OrderWorkflow', {definition});

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
    }
}