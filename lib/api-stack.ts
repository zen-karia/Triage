import * as cdk from 'aws-cdk-lib/core';
import { Construct } from 'constructs';
import { Code, Function, Runtime } from "aws-cdk-lib/aws-lambda";
import { LambdaIntegration, RestApi } from 'aws-cdk-lib/aws-apigateway';

export class ApiStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        const orderHandler = new Function(this, 'OrderHandler', {
            runtime: Runtime.NODEJS_22_X,
            handler: 'something.handler', // need to fill in the real handler name
            code: Code.fromAsset('lambda')
        });

        const orderApi = new RestApi(this, 'OrdersApi', {
            restApiName: 'Orders Service'
        });

        const orders = orderApi.root.addResource('orders');
        orders.addMethod('POST', new LambdaIntegration(orderHandler));
    }
}