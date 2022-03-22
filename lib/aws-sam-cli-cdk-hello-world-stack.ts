import * as cdk from '@aws-cdk/core';
import {RemovalPolicy} from '@aws-cdk/core';
import * as lambda from '@aws-cdk/aws-lambda';
import * as dynamodb from '@aws-cdk/aws-dynamodb';
import * as apigateway from '@aws-cdk/aws-apigateway';
import * as iam from '@aws-cdk/aws-iam'
import * as path from 'path';
import * as cognito from '@aws-cdk/aws-cognito';
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
            timeToLiveAttribute:"ttl"
        });

        table.addGlobalSecondaryIndex({
            indexName:'TypeItemCountryIndex',
            partitionKey:{name:'country',type:dynamodb.AttributeType.STRING},
            sortKey:{name:'typeItem',type:dynamodb.AttributeType.STRING},
            readCapacity: 5,
            writeCapacity: 5,
            projectionType: dynamodb.ProjectionType.ALL,
        })


        const usersTable = new dynamodb.Table(this, 'UsersTable', {
            partitionKey: { name: 'pk', type: dynamodb.AttributeType.STRING },
            sortKey: { name:'sk',type:dynamodb.AttributeType.STRING},
            billingMode: dynamodb.BillingMode.PROVISIONED,
            readCapacity: 5,
            tableName:'UsersCollection',
            removalPolicy:RemovalPolicy.DESTROY,
            writeCapacity: 5
        });
        usersTable.addGlobalSecondaryIndex({
            indexName:"index_sk_and_type",
            partitionKey:{name:'sk',type:dynamodb.AttributeType.STRING},
            sortKey:{name:"typeItem",type:dynamodb.AttributeType.STRING},
            readCapacity:5,
            writeCapacity:5,
            projectionType:dynamodb.ProjectionType.ALL
        })

        const rolesTable=new dynamodb.Table(this, 'RolesTable', {
            partitionKey: { name: 'pk', type: dynamodb.AttributeType.STRING },
            sortKey: { name:'sk',type:dynamodb.AttributeType.STRING},
            billingMode: dynamodb.BillingMode.PROVISIONED,
            readCapacity: 5,
            tableName:'RolesAccessCollection',
            removalPolicy:RemovalPolicy.DESTROY,
            writeCapacity: 5
        });

        rolesTable.addGlobalSecondaryIndex({
            indexName:"index_by_typeItem",
            partitionKey:{name:'typeItem',type:dynamodb.AttributeType.STRING},
            sortKey:{name:"sk",type:dynamodb.AttributeType.STRING},
            projectionType:dynamodb.ProjectionType.ALL,
            readCapacity:5,
            writeCapacity:5
        })


        const dynamoInsertItem = new lambda.Function(this, 'dynamo-lambda-insert-function', {
            functionName:"sam-cdk-db-insert-function",
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
            functionName:"sam-cdk-db-update-function",
            handler: 'update.handler',
            environment: {
                "ISLOCAL": "false",
                "arnKms":process.env.arnKms!!,
                "arnKmsAlias":process.env.arnKmsAlias!!
            },
            timeout: cdk.Duration.minutes(1),
            code: lambda.Code.fromAsset(path.join(__dirname, '..', 'dynamo-items')),
        });


        const dynamoGetItem = new lambda.Function(this, 'dynamo-lambda-get-function', {
            functionName:"sam-cdk-db-get-function",
            runtime: lambda.Runtime.NODEJS_14_X,
            handler: 'get.handler',
            environment: {
                "ISLOCAL": "false"
            },
            timeout: cdk.Duration.minutes(1),
            code: lambda.Code.fromAsset(path.join(__dirname, '..', 'dynamo-items')),
        });

        const dynamoGetCountryType = new lambda.Function(this, 'dynamo-lambda-get-by-country-type-function', {
            functionName:"sam-cdk-db-get-by-country-type-function",
            runtime: lambda.Runtime.NODEJS_14_X,
            handler: 'get.handlerCountryType',
            environment: {
                "ISLOCAL": "false"
            },
            timeout: cdk.Duration.minutes(1),
            code: lambda.Code.fromAsset(path.join(__dirname, '..', 'dynamo-items'))

        });

        const dynamoRemoveItem = new lambda.Function(this, 'dynamo-lambda-remove-item-function', {
            functionName:"sam-cdk-db-remove-item-function",

            runtime: lambda.Runtime.NODEJS_14_X,
            handler: 'remove.handler',
            timeout: cdk.Duration.minutes(1),
            environment: {
                "ISLOCAL": "false"
            },
            code: lambda.Code.fromAsset(path.join(__dirname, '..', 'dynamo-items'))

        });
        const dynamoSearchItem = new lambda.Function(this, 'dynamo-lambda-search-item-function', {
            functionName:"sam-cdk-db-search-item-function",

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

        const roleForCognito = new iam.Role(this,'RoleForCognito',{
            roleName:"roleForCognito",
            assumedBy:new iam.CompositePrincipal(new iam.ServicePrincipal("cognito-idp.amazonaws.com"),
            new iam.ServicePrincipal("lambda.amazonaws.com")),
        managedPolicies:[iam.ManagedPolicy.fromAwsManagedPolicyName("service-role/AWSLambdaBasicExecutionRole")]
        })

        const roleForAdminCognitoAndDB = new iam.Role(this,'RoleForAdminUsers',{
           roleName:"RoleForAdminUser",
           assumedBy: new iam.ServicePrincipal("lambda.amazonaws.com"),
           managedPolicies:[iam.ManagedPolicy.fromAwsManagedPolicyName("service-role/AWSLambdaBasicExecutionRole")],
           inlinePolicies: {
                  CognitoAdmin: new iam.PolicyDocument({
                      statements:[new iam.PolicyStatement({
                          actions:['cognito-idp:AdminDeleteUser','cognito-idp:AdminCreateUser','cognito-idp:AdminInitiateAuth','cognito-idp:AdminSetUserPassword'],
                          resources:["*"],
                          effect:iam.Effect.ALLOW
                      })]
                  }),


                }


        });


        const createServers = new lambda.Function(this, 'dynamo-lambda-create-server-function', {
            functionName:"sam-cdk-db-create-server-function",
            runtime: lambda.Runtime.NODEJS_14_X,
            handler: 'users.createServer',
            role:roleForAdminCognitoAndDB,
            timeout: cdk.Duration.minutes(1),
            code: lambda.Code.fromAsset(path.join(__dirname, '..', 'users')),
            environment: {
                "ISLOCAL": "false",
                "arnKms":process.env.arnKms!!,
                "arnKmsAlias":process.env.arnKmsAlias!!,
                "POOL_ID":process.env.POOL_ID!!
            }
        });

        const loginUser = new lambda.Function(this, 'dynamo-lambda-login-user-function', {
            functionName:"sam-cdk-db-login-user-function",
            runtime: lambda.Runtime.NODEJS_14_X,
            handler: 'users.loginUser',
            role:roleForAdminCognitoAndDB,
            timeout: cdk.Duration.minutes(1),
            code: lambda.Code.fromAsset(path.join(__dirname, '..', 'users')),
            environment: {
                "ISLOCAL": "false",
                "arnKms":process.env.arnKms!!,
                "arnKmsAlias":process.env.arnKmsAlias!!,
                "POOL_ID":process.env.POOL_ID!!,
                "sub":"replace-cognito-sub",
                "CLIENT_ID":process.env.CLIENT_ID!!
            }
        });



        const cognitoTrigger = new lambda.Function(this, 'cognito-trigger', {
            functionName:"sam-cdk-db-cognito-trigger",
            role: roleForCognito,
            runtime: lambda.Runtime.NODEJS_14_X,
            handler: 'triggerCognito.main',
            timeout: cdk.Duration.minutes(1),
            code: lambda.Code.fromAsset(path.join(__dirname, '..', 'trigger')),
            environment: {
                "ISLOCAL": "false",
            }
        });

        const adminUserCognito = new lambda.Function(this,'admin-user-cognito:q-db',{
            functionName:'sam-cdk-db-remove-user-cognito',
            role: roleForAdminCognitoAndDB,
            runtime: lambda.Runtime.NODEJS_14_X,
            handler:'users.removeUser',
            timeout:cdk.Duration.minutes(1),
            code:lambda.Code.fromAsset(path.join(__dirname,'..','users')),
            environment: {
                "POOL_ID": process.env.POOL_ID!!,
                "USERNAME":"replace-userneme-cognito"
            }
        })

        const fnGetUsers = new lambda.Function(this,'dynamo-lambda-get-users-function',{
            functionName:'sam-cdk-db-get-all-users',
            role: roleForAdminCognitoAndDB,
            runtime: lambda.Runtime.NODEJS_14_X,
            handler:'users.getUsers',
            timeout:cdk.Duration.minutes(1),
            code:lambda.Code.fromAsset(path.join(__dirname,'..','users')),
            environment: {
                "USERNAME":"replace-userneme-cognito"
            }
        });

        const fnGetUServers = new lambda.Function(this,'dynamo-lambda-get-servers-function',{
            functionName:'sam-cdk-db-get-all-servers',
            role: roleForAdminCognitoAndDB,
            runtime: lambda.Runtime.NODEJS_14_X,
            handler:'users.getServers',
            timeout:cdk.Duration.minutes(1),
            code:lambda.Code.fromAsset(path.join(__dirname,'..','users')),
            environment: {
                "USERNAME":"replace-userneme-cognito"
            }
        });

        const fnGetRoles = new lambda.Function(this,'dynamo-lambda-get-roles-function',{
            functionName:'sam-cdk-db-get-roles',
            role: roleForAdminCognitoAndDB,
            runtime: lambda.Runtime.NODEJS_14_X,
            handler:'roles.obtainRoles',
            timeout: cdk.Duration.minutes(1),
            code:lambda.Code.fromAsset(path.join(__dirname,'..','users'))
        })

        const fnAccessGroup = new lambda.Function(this,'dynamo-lambda-get-access-group-function',{
           functionName:'sam-cdk-db-get-accessGroup',
           role: roleForAdminCognitoAndDB,
           runtime: lambda.Runtime.NODEJS_14_X,
           handler:'roles.obtainAccessGroups',
           timeout:cdk.Duration.minutes(1),
           code:lambda.Code.fromAsset(path.join(__dirname,'..','users'))
        });

        const fnAssignRoles = new lambda.Function(this, 'dynamodo-lambda-assign-role-function',{
           functionName:'sam-cdk-sb-assign-role',
           role: roleForAdminCognitoAndDB,
           runtime: lambda.Runtime.NODEJS_14_X,
           handler:'roles.asssingRoles',
           timeout:cdk.Duration.minutes(1),
           code:lambda.Code.fromAsset(path.join(__dirname,'..','users'))
        });

        const batchUpdate = new lambda.Function(this,'dynamo-lambda-batch-update-function',{
            functionName:'sam-cdk-db-batch-update',
            runtime:lambda.Runtime.NODEJS_14_X,
            handler:'batch.batchUpdate',
            timeout:cdk.Duration.minutes(5),
            code:lambda.Code.fromAsset(path.join(__dirname,'..','dynamo-items'),{
                exclude:["node_modules"]
            })
        })
        table.grantReadWriteData(dynamoInsertItem);
        table.grantReadWriteData(dynamoUpdateItem);
        table.grantReadData(dynamoGetItem);
        table.grantReadData(dynamoSearchItem);
        table.grantReadData(dynamoGetCountryType);
        table.grantReadWriteData(roleForAdminCognitoAndDB);
        table.grantReadWriteData(batchUpdate);
        usersTable.grantReadData(fnGetUsers);
        usersTable.grantReadData(fnGetUServers);
        usersTable.grantReadWriteData(roleForCognito);
        usersTable.grantReadWriteData(roleForAdminCognitoAndDB);
        rolesTable.grantReadWriteData(roleForAdminCognitoAndDB);
        usersTable.grantReadData(dynamoInsertItem);
        const itemsRootResource = api.root.addResource('items')
        const userRootResource = api.root.addResource('users')


        const poolCognito = cognito.UserPool.fromUserPoolId(this,"pool-id",process.env.POOL_ID!!);

        const auth = new apigateway.CognitoUserPoolsAuthorizer(this,'cognito-authorizer',{
           cognitoUserPools:[poolCognito],
           authorizerName:"authorizer-pool",
           identitySource:apigateway.IdentitySource.header('Authorization')
        });


        itemsRootResource.addMethod('POST', new apigateway.LambdaIntegration(dynamoInsertItem),{
            authorizer: auth
        })
        itemsRootResource.addMethod('PUT', new apigateway.LambdaIntegration(dynamoUpdateItem),{
            authorizer: auth
        });
        itemsRootResource.addMethod('DELETE', new apigateway.LambdaIntegration(dynamoRemoveItem),{
            authorizer: auth
        });
        userRootResource.addMethod('POST',new apigateway.LambdaIntegration(createServers),{
            authorizer: auth
        })
        userRootResource.addMethod('GET',new apigateway.LambdaIntegration(fnGetUsers),{
            authorizer:auth
        })
        const serverResource = userRootResource.addResource("servers");
        const rolesResource = userRootResource.addResource("roles");

        const assingRoleResource= rolesResource.addResource("assign");
        const itemSubResources = itemsRootResource.addResource('{itemId}');
        const queryResource = itemsRootResource.addResource('query');
        const searchResource = itemsRootResource.addResource('search');
        const countryQueryResource = queryResource.addResource('{country}');
        const countryAndTypeResource = countryQueryResource.addResource('{type}');
        const accessGroupsResource = itemsRootResource.addResource('accessGroup');
        countryAndTypeResource.addMethod('GET', new apigateway.LambdaIntegration(dynamoGetCountryType),{
            authorizer:auth
        })
        itemSubResources.addMethod('GET', new apigateway.LambdaIntegration(dynamoGetItem),{
            authorizer:auth
        })
        searchResource.addMethod('POST', new apigateway.LambdaIntegration(dynamoSearchItem),{
            authorizer:auth
        });
        serverResource.addMethod('GET',new apigateway.LambdaIntegration(fnGetUServers),{
            authorizer:auth
        });
        rolesResource.addMethod('GET',new apigateway.LambdaIntegration(fnGetRoles),{
            authorizer: auth
        })
        accessGroupsResource.addMethod('GET',new apigateway.LambdaIntegration(fnAccessGroup),{
            authorizer: auth
        })

        assingRoleResource.addMethod('POST',new apigateway.LambdaIntegration(fnAssignRoles),{
            authorizer: auth
        })
    }

}
