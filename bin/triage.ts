#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib/core';
import { PersistenceStack } from '../lib/persistence-stack';
import { ApiStack } from '../lib/api-stack';

const app = new cdk.App();

new PersistenceStack(app, 'PersistenceStack', {

});

new ApiStack(app, 'ApiStack', {

});
