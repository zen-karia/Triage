import * as cdk from 'aws-cdk-lib/core';
import { Construct } from 'constructs';
import { Runtime } from "aws-cdk-lib/aws-lambda";
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { LambdaIntegration, RestApi } from 'aws-cdk-lib/aws-apigateway';
import { Table } from 'aws-cdk-lib/aws-dynamodb';

interface ApiStackProps extends cdk.StackProps { // Added the ApiStackProps since ApiStack depends on PersistenceStack for getting the orderTable name which needs to be passed to the orderHandler while making the POST request.
    orderTable: Table;
}
export class ApiStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props: ApiStackProps) {
        super(scope, id, props);

        const orderHandler = new NodejsFunction(this, 'OrderHandler', {
            entry: 'lambda/createOrder.ts',
            handler: 'handler',
            runtime: Runtime.NODEJS_22_X,
            environment: {
                TABLE_NAME: props.orderTable.tableName
            }
        });


        const orderApi = new RestApi(this, 'OrdersApi', {
            restApiName: 'Orders Service'
        });

        const orders = orderApi.root.addResource('orders');
        orders.addMethod('POST', new LambdaIntegration(orderHandler));

        props.orderTable.grantWriteData(orderHandler); // AWS is default-deny so need to explicitly grant the lambda handler permission to write to the DynamoDB Table.
    }
}