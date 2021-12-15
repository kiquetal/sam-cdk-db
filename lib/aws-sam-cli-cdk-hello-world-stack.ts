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

    const dynamoInsertItem = new lambda.Function(this, 'dynamo-lambda-insert-function', {
      runtime: lambda.Runtime.NODEJS_14_X,
      handler: 'insert.handler',
      timeout: cdk.Duration.minutes(1),
      code: lambda.Code.fromAsset(path.join(__dirname, '..', 'dynamo-items')),
    });

     const dynamoUpdateItem = new lambda.Function(this, 'dynamo-lambda-update-function', {
      runtime: lambda.Runtime.NODEJS_14_X,
      handler: 'update.handler',
      timeout: cdk.Duration.minutes(1),
      code: lambda.Code.fromAsset(path.join(__dirname, '..', 'dynamo-items')),
    });

    const dynamoGetItem = new lambda.Function(this, 'dynamo-lambda-get-function', {
      runtime: lambda.Runtime.NODEJS_14_X,
      handler: 'get.handler',
      timeout: cdk.Duration.minutes(1),
      code: lambda.Code.fromAsset(path.join(__dirname, '..', 'dynamo-items')),
    });

    const  dynamoGetCountryType = new lambda.Function(this,'dynamo-lambda-get-by-country-type-function',{
       runtime: lambda.Runtime.NODEJS_14_X,
       handler:'get.handlerCountryType',
       timeout: cdk.Duration.minutes(1),
        code:lambda.Code.fromAsset(path.join(__dirname,'..','dynamo-items'))

    });

    const api = new apigateway.LambdaRestApi(this, 'hello-world-api', {
      handler: backend,
      proxy: false
    });

    const hello = api.root.addResource('hello');
    const itemsRootResource = api.root.addResource('items')
    //   const greedy = api.root.addResource('greedy');
    itemsRootResource.addMethod('POST', new apigateway.LambdaIntegration(dynamoInsertItem))
    itemsRootResource.addMethod('PUT',new apigateway.LambdaIntegration(dynamoUpdateItem));
   const itemSubResources= itemsRootResource.addResource('{itemId}');
   const queryResource = itemsRootResource.addResource('query');
   const countryQueryResource = queryResource.addResource('{country}');
   const countryAndTypeResource = countryQueryResource.addResource('{type}');
      countryAndTypeResource.addMethod('GET',new apigateway.LambdaIntegration(dynamoGetCountryType))
    itemSubResources.addMethod('GET',new apigateway.LambdaIntegration(dynamoGetItem))

    hello.addMethod('GET');

    /*  greedy.addProxy(

          {  defaultIntegration: new apigateway.LambdaIntegration(backend)});


     */
  }

}
