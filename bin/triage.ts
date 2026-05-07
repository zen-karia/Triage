#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib/core';
import { PersistenceStack } from '../lib/persistence-stack';
import { ApiStack } from '../lib/api-stack';
import { MessagingStack } from '../lib/messaging-stack';
import { WorkflowStack } from '../lib/workflow-stack';
import { EventBridgeStack } from '../lib/eventBridge-stack';
import { ObservabilityStack } from '../lib/observability-stack';

const app = new cdk.App();

const persistenceStack = new PersistenceStack(app, 'PersistenceStack', {});

const eventBridgeStack = new EventBridgeStack(app, 'EventBridgeStack', {});

const workflowStack = new WorkflowStack(app, 'WorkflowStack', {orderTable: persistenceStack.orderTable, orderEventBus: eventBridgeStack.orderEventBus})

const messagingStack = new MessagingStack(app, 'MessagingStack', {orderTable: persistenceStack.orderTable, orderStateMachine: workflowStack.orderStateMachine});

new ApiStack(app, 'ApiStack', {
  orderTable: persistenceStack.orderTable,
  orderQueue: messagingStack.orderQueue
});

new ObservabilityStack(app, 'ObservabilityStack', {
  dlq: messagingStack.dlq
})
