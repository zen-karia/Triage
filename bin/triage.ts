#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib/core';
import { PersistenceStack } from '../lib/persistence-stack';
import { ApiStack } from '../lib/api-stack';
import { MessagingStack } from '../lib/messaging-stack';

const app = new cdk.App();

const persistenceStack = new PersistenceStack(app, 'PersistenceStack', {});

const messagingStack = new MessagingStack(app, 'MessagingStack', {});

new ApiStack(app, 'ApiStack', {
  orderTable: persistenceStack.orderTable,
  orderQueue: messagingStack.orderQueue
});
