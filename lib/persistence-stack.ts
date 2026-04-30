import * as cdk from 'aws-cdk-lib/core';
import { Construct } from 'constructs';
import { AttributeType, Table } from 'aws-cdk-lib/aws-dynamodb';

export class PersistenceStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        const orderTable = new Table(this, "OrderRecords", {
            partitionKey: { name: "orderID", type: AttributeType.STRING}
        });
    }
}