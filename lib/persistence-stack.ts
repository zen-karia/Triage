import * as cdk from 'aws-cdk-lib/core';
import { Construct } from 'constructs';
import { AttributeType, Table } from 'aws-cdk-lib/aws-dynamodb';

export class PersistenceStack extends cdk.Stack {
    public readonly orderTable: Table;
    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        this.orderTable = new Table(this, "OrderRecords", {
            partitionKey: { name: "orderID", type: AttributeType.STRING}
        });
    }
}