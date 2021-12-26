import * as cdk from '@aws-cdk/core';
import {RemovalPolicy} from '@aws-cdk/core';
import * as lambda from '@aws-cdk/aws-lambda';
import * as dynamodb from '@aws-cdk/aws-dynamodb';
import * as apigateway from '@aws-cdk/aws-apigateway';
import * as path from 'path';

export class AwsSamCliCdkHelloWorldStack extends cdk.Stack {
    constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);


        const table = new dynamodb.Table(this, 'AccountsCollection', {
            partitionKey: { name: 'pk', type: dynamodb.AttributeType.STRING },
            sortKey: { name:'country',type:dynamodb.AttributeType.STRING},
            billingMode: dynamodb.BillingMode.PROVISIONED,
            readCapacity: 5,
           tableName:'AccountsCollection',
            removalPolicy:RemovalPolicy.DESTROY,
            writeCapacity: 5,
        });

        table.addGlobalSecondaryIndex({
            indexName:'TypeItemCountryIndex',
            partitionKey:{name:'country',type:dynamodb.AttributeType.STRING},
            sortKey:{name:'typeItem',type:dynamodb.AttributeType.STRING},
            readCapacity: 5,
            writeCapacity: 5,
            projectionType: dynamodb.ProjectionType.ALL,
        })

        const dynamoInsertItem = new lambda.Function(this, 'dynamo-lambda-insert-function', {
            runtime: lambda.Runtime.NODEJS_14_X,
            handler: 'insert.handler',
            environment: {
                "ISLOCAL": "false",
                "arnKms":process.env.arnKms!!,
                "arnKmsAlias":process.env.arnKmsAlias!!
            },
            timeout: cdk.Duration.minutes(1),
            code: lambda.Code.fromAsset(path.join(__dirname, '..', 'dynamo-items')),
        });


        const dynamoUpdateItem = new lambda.Function(this, 'dynamo-lambda-update-function', {
            runtime: lambda.Runtime.NODEJS_14_X,
            handler: 'update.handler',
            environment: {
                "ISLOCAL": "false"
            },
            timeout: cdk.Duration.minutes(1),
            code: lambda.Code.fromAsset(path.join(__dirname, '..', 'dynamo-items')),
        });


        const dynamoGetItem = new lambda.Function(this, 'dynamo-lambda-get-function', {
            runtime: lambda.Runtime.NODEJS_14_X,
            handler: 'get.handler',
            environment: {
                "ISLOCAL": "false"
            },
            timeout: cdk.Duration.minutes(1),
            code: lambda.Code.fromAsset(path.join(__dirname, '..', 'dynamo-items')),
        });

        const dynamoGetCountryType = new lambda.Function(this, 'dynamo-lambda-get-by-country-type-function', {
            runtime: lambda.Runtime.NODEJS_14_X,
            handler: 'get.handlerCountryType',
            environment: {
                "ISLOCAL": "false"
            },
            timeout: cdk.Duration.minutes(1),
            code: lambda.Code.fromAsset(path.join(__dirname, '..', 'dynamo-items'))

        });


        const dynamoRemoveItem = new lambda.Function(this, 'dynamo-lambda-remove-item-function', {
            runtime: lambda.Runtime.NODEJS_14_X,
            handler: 'remove.handler',
            timeout: cdk.Duration.minutes(1),
            environment: {
                "ISLOCAL": "false"
            },
            code: lambda.Code.fromAsset(path.join(__dirname, '..', 'dynamo-items'))

        });
        const dynamoSearchItem = new lambda.Function(this, 'dynamo-lambda-search-item-function', {
            runtime: lambda.Runtime.NODEJS_14_X,
            handler: 'search.searchHandler',
            timeout: cdk.Duration.minutes(1),
            code: lambda.Code.fromAsset(path.join(__dirname, '..', 'dynamo-items')),
            environment: {
                "ISLOCAL": "false",
                "arnKms":process.env.arnKms!!,
                "arnKmsAlias":process.env.arnKmsAlias!!
            }
        });

        const api = new apigateway.LambdaRestApi(this, 'dynamo-items', {
            handler: dynamoGetItem,

            defaultCorsPreflightOptions:{
                allowOrigins: apigateway.Cors.ALL_ORIGINS,
                allowMethods: apigateway.Cors.ALL_METHODS,
                allowHeaders:apigateway.Cors.DEFAULT_HEADERS
            },
            deployOptions:{
                stageName:'test'

            },
            proxy: false
        });


        table.grantReadWriteData(dynamoInsertItem);
        table.grantReadWriteData(dynamoUpdateItem);
        table.grantReadData(dynamoGetItem);
        table.grantReadData(dynamoSearchItem);
        table.grantReadData(dynamoGetCountryType);
        const itemsRootResource = api.root.addResource('items')
        itemsRootResource.addMethod('POST', new apigateway.LambdaIntegration(dynamoInsertItem))
        itemsRootResource.addMethod('PUT', new apigateway.LambdaIntegration(dynamoUpdateItem));
        itemsRootResource.addMethod('DELETE', new apigateway.LambdaIntegration(dynamoRemoveItem));
        const itemSubResources = itemsRootResource.addResource('{itemId}');
        const queryResource = itemsRootResource.addResource('query');
        const searchResource = itemsRootResource.addResource('search');
        const countryQueryResource = queryResource.addResource('{country}');
        const countryAndTypeResource = countryQueryResource.addResource('{type}');
        countryAndTypeResource.addMethod('GET', new apigateway.LambdaIntegration(dynamoGetCountryType))
        itemSubResources.addMethod('GET', new apigateway.LambdaIntegration(dynamoGetItem))
        searchResource.addMethod('POST', new apigateway.LambdaIntegration(dynamoSearchItem));

    }

}
