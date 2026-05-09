import * as cdk from 'aws-cdk-lib/core';
import { Construct } from 'constructs';
import { Runtime, Tracing } from "aws-cdk-lib/aws-lambda";
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { LambdaIntegration, RestApi } from 'aws-cdk-lib/aws-apigateway';
import { Table } from 'aws-cdk-lib/aws-dynamodb';
import { Queue } from 'aws-cdk-lib/aws-sqs';

interface ApiStackProps extends cdk.StackProps { // Added the ApiStackProps since ApiStack depends on PersistenceStack & MessagingStack for getting the orderTable name and orderQueue URL respectively which needs to be passed to the orderHandler while making the POST request.
    orderTable: Table;
    orderQueue: Queue
}
export class ApiStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props: ApiStackProps) {
        super(scope, id, props);

        const orderHandler = new NodejsFunction(this, 'OrderHandler', {
            entry: 'lambda/createOrder.ts',
            handler: 'handler',
            runtime: Runtime.NODEJS_22_X,
            environment: {
                TABLE_NAME: props.orderTable.tableName,
                QUEUE_URL: props.orderQueue.queueUrl
            },
            tracing: Tracing.ACTIVE,
            memorySize: 256
        });


        const orderApi = new RestApi(this, 'OrdersApi', {
            restApiName: 'Orders Service'
        });

        const getOrderHandler =  new NodejsFunction(this, 'GetOrderHandler', {
            entry: 'lambda/getOrder.ts',
            handler: 'handler',
            runtime: Runtime.NODEJS_22_X,
            environment: {
                TABLE_NAME: props.orderTable.tableName
            },
            tracing: Tracing.ACTIVE
        });

        const orders = orderApi.root.addResource('orders');
        const orderId = orders.addResource('{orderId}');
        orders.addMethod('POST', new LambdaIntegration(orderHandler));
        orderId.addMethod('GET', new LambdaIntegration(getOrderHandler));

        props.orderTable.grantWriteData(orderHandler); // AWS is default-deny so need to explicitly grant the lambda handler permission to write to the DynamoDB Table.

        props.orderQueue.grantSendMessages(orderHandler); // AWS is default-deny so need to explicitly grant the lambda handler permission to send messages to the SQS Order Queue.

        props.orderTable.grantReadData(getOrderHandler);
    }
}