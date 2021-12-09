import * as cdk from '@aws-cdk/core';
import * as lambda from '@aws-cdk/aws-lambda';
import * as apigateway from '@aws-cdk/aws-apigateway';
import * as path from 'path';

export class AwsSamCliCdkHelloWorldStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // The code that defines your stack goes here
    const backend = new lambda.Function(this, 'hello-world-lambda-function', {
      runtime: lambda.Runtime.NODEJS_14_X,
      handler: 'app.lambdaHandler',
      timeout: cdk.Duration.minutes(1),
      code: lambda.Code.fromAsset(path.join(__dirname, '..', 'hello-world')),
    });
    
    const api = new apigateway.LambdaRestApi(this, 'hello-world-api', {
      handler: backend,
      proxy: false
    });

    const hello = api.root.addResource('hello');
    const greedy = api.root.addResource('greedy');
    hello.addMethod('GET');

    greedy.addProxy(
	    {  defaultIntegration: new apigateway.LambdaIntegration(backend)});
  }
}
