import * as cdk from 'aws-cdk-lib/core';
import { Construct } from 'constructs';
import { Dashboard, GraphWidget, Metric } from 'aws-cdk-lib/aws-cloudwatch';
import { Queue } from 'aws-cdk-lib/aws-sqs';

interface ObservabilityStackProps extends cdk.StackProps {
    dlq: Queue
}

export class ObservabilityStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props: ObservabilityStackProps) {
        super(scope, id, props);

        const dashboard = new Dashboard(this, "OrdersDashboard", {
            dashboardName: 'Triage-Orders'
        });

        dashboard.addWidgets(new GraphWidget({
            title: "API Request Rate",
            left: [new Metric({
                namespace: 'AWS/ApiGateway',
                metricName: 'Count',
                statistic: 'Sum',
                label: 'Request Count'
            })]
        }))

        dashboard.addWidgets(new GraphWidget({
            title: 'Lambda Duration (p50/p95/p99)',
            left: [
                new Metric({
                    namespace: 'AWS/Lambda',
                    metricName: 'Duration',
                    statistic: 'p50',
                    label: 'p50'
                }),
                new Metric({
                    namespace: 'AWS/Lambda',
                    metricName: 'Duration',
                    statistic: 'p95',
                    label: 'p95'
                }),
                new Metric({
                    namespace: 'AWS/Lambda',
                    metricName: 'Duration',
                    statistic: 'p99',
                    label: 'p99'
                })
            ]
        }))

        dashboard.addWidgets(new GraphWidget({
            title: 'Lambda Error Rate',
            left: [new Metric({
                namespace: 'AWS/Lambda',
                metricName: 'Errors',
                statistic: 'Sum',
                label: 'Errors'
            })]
        }))

        dashboard.addWidgets(new GraphWidget({
            title: 'DLQ Depth',
            left: [props.dlq.metricApproximateNumberOfMessagesVisible({
                label: 'DLQ Messages'
            })]
        }))

        dashboard.addWidgets(new GraphWidget({
            title: 'Bedrock Cost Per Call',
            left: [new Metric({
                namespace: 'Triage/Bedrock',
                metricName: 'CostPerCall',
                statistic: 'Average',
                label: 'Cost Per Call ($)'
            })]
        }))
    }
}