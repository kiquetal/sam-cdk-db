"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AwsSamCliCdkHelloWorldStack = void 0;
const cdk = require("@aws-cdk/core");
const core_1 = require("@aws-cdk/core");
const lambda = require("@aws-cdk/aws-lambda");
const dynamodb = require("@aws-cdk/aws-dynamodb");
const apigateway = require("@aws-cdk/aws-apigateway");
const iam = require("@aws-cdk/aws-iam");
const path = require("path");
const cognito = require("@aws-cdk/aws-cognito");
class AwsSamCliCdkHelloWorldStack extends cdk.Stack {
    constructor(scope, id, props) {
        super(scope, id, props);
        const table = new dynamodb.Table(this, 'AccountsCollection', {
            partitionKey: { name: 'pk', type: dynamodb.AttributeType.STRING },
            sortKey: { name: 'country', type: dynamodb.AttributeType.STRING },
            billingMode: dynamodb.BillingMode.PROVISIONED,
            readCapacity: 5,
            tableName: 'AccountsCollection',
            removalPolicy: core_1.RemovalPolicy.DESTROY,
            writeCapacity: 5,
            timeToLiveAttribute: "ttl"
        });
        table.addGlobalSecondaryIndex({
            indexName: 'TypeItemCountryIndex',
            partitionKey: { name: 'country', type: dynamodb.AttributeType.STRING },
            sortKey: { name: 'typeItem', type: dynamodb.AttributeType.STRING },
            readCapacity: 5,
            writeCapacity: 5,
            projectionType: dynamodb.ProjectionType.ALL,
        });
        const usersTable = new dynamodb.Table(this, 'UsersTable', {
            partitionKey: { name: 'pk', type: dynamodb.AttributeType.STRING },
            sortKey: { name: 'sk', type: dynamodb.AttributeType.STRING },
            billingMode: dynamodb.BillingMode.PROVISIONED,
            readCapacity: 5,
            tableName: 'UsersCollection',
            removalPolicy: core_1.RemovalPolicy.DESTROY,
            writeCapacity: 5
        });
        usersTable.addGlobalSecondaryIndex({
            indexName: "index_sk_and_type",
            partitionKey: { name: 'sk', type: dynamodb.AttributeType.STRING },
            sortKey: { name: "typeItem", type: dynamodb.AttributeType.STRING },
            readCapacity: 5,
            writeCapacity: 5,
            projectionType: dynamodb.ProjectionType.ALL
        });
        const rolesTable = new dynamodb.Table(this, 'RolesTable', {
            partitionKey: { name: 'pk', type: dynamodb.AttributeType.STRING },
            sortKey: { name: 'sk', type: dynamodb.AttributeType.STRING },
            billingMode: dynamodb.BillingMode.PROVISIONED,
            readCapacity: 5,
            tableName: 'RolesAccessCollection',
            removalPolicy: core_1.RemovalPolicy.DESTROY,
            writeCapacity: 5
        });
        rolesTable.addGlobalSecondaryIndex({
            indexName: "index_by_typeItem",
            partitionKey: { name: 'typeItem', type: dynamodb.AttributeType.STRING },
            sortKey: { name: "sk", type: dynamodb.AttributeType.STRING },
            projectionType: dynamodb.ProjectionType.ALL,
            readCapacity: 5,
            writeCapacity: 5
        });
        const dynamoInsertItem = new lambda.Function(this, 'dynamo-lambda-insert-function', {
            functionName: "sam-cdk-db-insert-function",
            runtime: lambda.Runtime.NODEJS_14_X,
            handler: 'insert.handler',
            environment: {
                "ISLOCAL": "false",
                "arnKms": process.env.arnKms,
                "arnKmsAlias": process.env.arnKmsAlias
            },
            timeout: cdk.Duration.minutes(1),
            code: lambda.Code.fromAsset(path.join(__dirname, '..', 'dynamo-items')),
        });
        const dynamoUpdateItem = new lambda.Function(this, 'dynamo-lambda-update-function', {
            runtime: lambda.Runtime.NODEJS_14_X,
            functionName: "sam-cdk-db-update-function",
            handler: 'update.handler',
            environment: {
                "ISLOCAL": "false",
                "arnKms": process.env.arnKms,
                "arnKmsAlias": process.env.arnKmsAlias
            },
            timeout: cdk.Duration.minutes(1),
            code: lambda.Code.fromAsset(path.join(__dirname, '..', 'dynamo-items')),
        });
        const dynamoGetItem = new lambda.Function(this, 'dynamo-lambda-get-function', {
            functionName: "sam-cdk-db-get-function",
            runtime: lambda.Runtime.NODEJS_14_X,
            handler: 'get.handler',
            environment: {
                "ISLOCAL": "false"
            },
            timeout: cdk.Duration.minutes(1),
            code: lambda.Code.fromAsset(path.join(__dirname, '..', 'dynamo-items')),
        });
        const dynamoGetCountryType = new lambda.Function(this, 'dynamo-lambda-get-by-country-type-function', {
            functionName: "sam-cdk-db-get-by-country-type-function",
            runtime: lambda.Runtime.NODEJS_14_X,
            handler: 'get.handlerCountryType',
            environment: {
                "ISLOCAL": "false"
            },
            timeout: cdk.Duration.minutes(1),
            code: lambda.Code.fromAsset(path.join(__dirname, '..', 'dynamo-items'))
        });
        const dynamoRemoveItem = new lambda.Function(this, 'dynamo-lambda-remove-item-function', {
            functionName: "sam-cdk-db-remove-item-function",
            runtime: lambda.Runtime.NODEJS_14_X,
            handler: 'remove.handler',
            timeout: cdk.Duration.minutes(1),
            environment: {
                "ISLOCAL": "false"
            },
            code: lambda.Code.fromAsset(path.join(__dirname, '..', 'dynamo-items'))
        });
        const dynamoSearchItem = new lambda.Function(this, 'dynamo-lambda-search-item-function', {
            functionName: "sam-cdk-db-search-item-function",
            runtime: lambda.Runtime.NODEJS_14_X,
            handler: 'search.searchHandler',
            timeout: cdk.Duration.minutes(1),
            code: lambda.Code.fromAsset(path.join(__dirname, '..', 'dynamo-items')),
            environment: {
                "ISLOCAL": "false",
                "arnKms": process.env.arnKms,
                "arnKmsAlias": process.env.arnKmsAlias
            }
        });
        const api = new apigateway.LambdaRestApi(this, 'dynamo-items', {
            handler: dynamoGetItem,
            defaultCorsPreflightOptions: {
                allowOrigins: apigateway.Cors.ALL_ORIGINS,
                allowMethods: apigateway.Cors.ALL_METHODS,
                allowHeaders: apigateway.Cors.DEFAULT_HEADERS
            },
            deployOptions: {
                stageName: 'test'
            },
            proxy: false
        });
        const roleForCognito = new iam.Role(this, 'RoleForCognito', {
            roleName: "roleForCognito",
            assumedBy: new iam.CompositePrincipal(new iam.ServicePrincipal("cognito-idp.amazonaws.com"), new iam.ServicePrincipal("lambda.amazonaws.com")),
            managedPolicies: [iam.ManagedPolicy.fromAwsManagedPolicyName("service-role/AWSLambdaBasicExecutionRole")]
        });
        const roleForAdminCognitoAndDB = new iam.Role(this, 'RoleForAdminUsers', {
            roleName: "RoleForAdminUser",
            assumedBy: new iam.ServicePrincipal("lambda.amazonaws.com"),
            managedPolicies: [iam.ManagedPolicy.fromAwsManagedPolicyName("service-role/AWSLambdaBasicExecutionRole")],
            inlinePolicies: {
                CognitoAdmin: new iam.PolicyDocument({
                    statements: [new iam.PolicyStatement({
                            actions: ['cognito-idp:AdminDeleteUser', 'cognito-idp:AdminCreateUser', 'cognito-idp:AdminInitiateAuth', 'cognito-idp:AdminSetUserPassword'],
                            resources: ["*"],
                            effect: iam.Effect.ALLOW
                        })]
                }),
            }
        });
        const createServers = new lambda.Function(this, 'dynamo-lambda-create-server-function', {
            functionName: "sam-cdk-db-create-server-function",
            runtime: lambda.Runtime.NODEJS_14_X,
            handler: 'users.createServer',
            role: roleForAdminCognitoAndDB,
            timeout: cdk.Duration.minutes(1),
            code: lambda.Code.fromAsset(path.join(__dirname, '..', 'users')),
            environment: {
                "ISLOCAL": "false",
                "arnKms": process.env.arnKms,
                "arnKmsAlias": process.env.arnKmsAlias,
                "POOL_ID": process.env.POOL_ID
            }
        });
        const loginUser = new lambda.Function(this, 'dynamo-lambda-login-user-function', {
            functionName: "sam-cdk-db-login-user-function",
            runtime: lambda.Runtime.NODEJS_14_X,
            handler: 'users.loginUser',
            role: roleForAdminCognitoAndDB,
            timeout: cdk.Duration.minutes(1),
            code: lambda.Code.fromAsset(path.join(__dirname, '..', 'users')),
            environment: {
                "ISLOCAL": "false",
                "arnKms": process.env.arnKms,
                "arnKmsAlias": process.env.arnKmsAlias,
                "POOL_ID": process.env.POOL_ID,
                "sub": "replace-cognito-sub",
                "CLIENT_ID": process.env.CLIENT_ID
            }
        });
        const cognitoTrigger = new lambda.Function(this, 'cognito-trigger', {
            functionName: "sam-cdk-db-cognito-trigger",
            role: roleForCognito,
            runtime: lambda.Runtime.NODEJS_14_X,
            handler: 'triggerCognito.main',
            timeout: cdk.Duration.minutes(1),
            code: lambda.Code.fromAsset(path.join(__dirname, '..', 'trigger')),
            environment: {
                "ISLOCAL": "false",
            }
        });
        const adminUserCognito = new lambda.Function(this, 'admin-user-cognito:q-db', {
            functionName: 'sam-cdk-db-remove-user-cognito',
            role: roleForAdminCognitoAndDB,
            runtime: lambda.Runtime.NODEJS_14_X,
            handler: 'users.removeUser',
            timeout: cdk.Duration.minutes(1),
            code: lambda.Code.fromAsset(path.join(__dirname, '..', 'users')),
            environment: {
                "POOL_ID": process.env.POOL_ID,
                "USERNAME": "replace-userneme-cognito"
            }
        });
        const fnGetUsers = new lambda.Function(this, 'dynamo-lambda-get-users-function', {
            functionName: 'sam-cdk-db-get-all-users',
            role: roleForAdminCognitoAndDB,
            runtime: lambda.Runtime.NODEJS_14_X,
            handler: 'users.getUsers',
            timeout: cdk.Duration.minutes(1),
            code: lambda.Code.fromAsset(path.join(__dirname, '..', 'users')),
            environment: {
                "USERNAME": "replace-userneme-cognito"
            }
        });
        const fnGetUServers = new lambda.Function(this, 'dynamo-lambda-get-servers-function', {
            functionName: 'sam-cdk-db-get-all-servers',
            role: roleForAdminCognitoAndDB,
            runtime: lambda.Runtime.NODEJS_14_X,
            handler: 'users.getServers',
            timeout: cdk.Duration.minutes(1),
            code: lambda.Code.fromAsset(path.join(__dirname, '..', 'users')),
            environment: {
                "USERNAME": "replace-userneme-cognito"
            }
        });
        const fnGetRoles = new lambda.Function(this, 'dynamo-lambda-get-roles-function', {
            functionName: 'sam-cdk-db-get-roles',
            role: roleForAdminCognitoAndDB,
            runtime: lambda.Runtime.NODEJS_14_X,
            handler: 'roles.obtainRoles',
            timeout: cdk.Duration.minutes(1),
            code: lambda.Code.fromAsset(path.join(__dirname, '..', 'users'))
        });
        const fnAccessGroup = new lambda.Function(this, 'dynamo-lambda-get-access-group-function', {
            functionName: 'sam-cdk-db-get-accessGroup',
            role: roleForAdminCognitoAndDB,
            runtime: lambda.Runtime.NODEJS_14_X,
            handler: 'roles.obtainAccessGroups',
            timeout: cdk.Duration.minutes(1),
            code: lambda.Code.fromAsset(path.join(__dirname, '..', 'users'))
        });
        const fnAssignRoles = new lambda.Function(this, 'dynamodo-lambda-assign-role-function', {
            functionName: 'sam-cdk-sb-assign-role',
            role: roleForAdminCognitoAndDB,
            runtime: lambda.Runtime.NODEJS_14_X,
            handler: 'roles.asssingRoles',
            timeout: cdk.Duration.minutes(1),
            code: lambda.Code.fromAsset(path.join(__dirname, '..', 'users'))
        });
        const batchUpdate = new lambda.Function(this, 'dynamo-lambda-batch-update-function', {
            functionName: 'sam-cdk-db-batch-update',
            runtime: lambda.Runtime.NODEJS_14_X,
            handler: 'batch.batchUpdate',
            timeout: cdk.Duration.minutes(5),
            code: lambda.Code.fromAsset(path.join(__dirname, '..', 'dynamo-items'), {
                exclude: ["node_modules"]
            })
        });
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
        const itemsRootResource = api.root.addResource('items');
        const userRootResource = api.root.addResource('users');
        const poolCognito = cognito.UserPool.fromUserPoolId(this, "pool-id", process.env.POOL_ID);
        let auth = undefined;
        if (!process.env.IS_LOCAL)
            auth = new apigateway.CognitoUserPoolsAuthorizer(this, 'cognito-authorizer', {
                cognitoUserPools: [poolCognito],
                authorizerName: "authorizer-pool",
                identitySource: apigateway.IdentitySource.header('Authorization')
            });
        itemsRootResource.addMethod('POST', new apigateway.LambdaIntegration(dynamoInsertItem), {
            authorizer: auth
        });
        itemsRootResource.addMethod('PUT', new apigateway.LambdaIntegration(dynamoUpdateItem), {
            authorizer: auth
        });
        itemsRootResource.addMethod('DELETE', new apigateway.LambdaIntegration(dynamoRemoveItem), {
            authorizer: auth
        });
        userRootResource.addMethod('POST', new apigateway.LambdaIntegration(createServers), {
            authorizer: auth
        });
        userRootResource.addMethod('GET', new apigateway.LambdaIntegration(fnGetUsers), {
            authorizer: auth
        });
        const serverResource = userRootResource.addResource("servers");
        const rolesResource = userRootResource.addResource("roles");
        const assingRoleResource = rolesResource.addResource("assign");
        const itemSubResources = itemsRootResource.addResource('{itemId}');
        const queryResource = itemsRootResource.addResource('query');
        const searchResource = itemsRootResource.addResource('search');
        const countryQueryResource = queryResource.addResource('{country}');
        const countryAndTypeResource = countryQueryResource.addResource('{type}');
        const accessGroupsResource = itemsRootResource.addResource('accessGroup');
        countryAndTypeResource.addMethod('GET', new apigateway.LambdaIntegration(dynamoGetCountryType), {
            authorizer: auth
        });
        itemSubResources.addMethod('GET', new apigateway.LambdaIntegration(dynamoGetItem), {
            authorizer: auth
        });
        searchResource.addMethod('POST', new apigateway.LambdaIntegration(dynamoSearchItem), {
            authorizer: auth
        });
        serverResource.addMethod('GET', new apigateway.LambdaIntegration(fnGetUServers), {
            authorizer: auth
        });
        rolesResource.addMethod('GET', new apigateway.LambdaIntegration(fnGetRoles), {
            authorizer: auth
        });
        accessGroupsResource.addMethod('GET', new apigateway.LambdaIntegration(fnAccessGroup), {
            authorizer: auth
        });
        assingRoleResource.addMethod('POST', new apigateway.LambdaIntegration(fnAssignRoles), {
            authorizer: auth
        });
    }
}
exports.AwsSamCliCdkHelloWorldStack = AwsSamCliCdkHelloWorldStack;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXdzLXNhbS1jbGktY2RrLWhlbGxvLXdvcmxkLXN0YWNrLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiYXdzLXNhbS1jbGktY2RrLWhlbGxvLXdvcmxkLXN0YWNrLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUFBLHFDQUFxQztBQUNyQyx3Q0FBNEM7QUFDNUMsOENBQThDO0FBQzlDLGtEQUFrRDtBQUNsRCxzREFBc0Q7QUFDdEQsd0NBQXVDO0FBQ3ZDLDZCQUE2QjtBQUM3QixnREFBZ0Q7QUFDaEQsTUFBYSwyQkFBNEIsU0FBUSxHQUFHLENBQUMsS0FBSztJQUN0RCxZQUFZLEtBQW9CLEVBQUUsRUFBVSxFQUFFLEtBQXNCO1FBQ2hFLEtBQUssQ0FBQyxLQUFLLEVBQUUsRUFBRSxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBR3hCLE1BQU0sS0FBSyxHQUFHLElBQUksUUFBUSxDQUFDLEtBQUssQ0FBQyxJQUFJLEVBQUUsb0JBQW9CLEVBQUU7WUFDekQsWUFBWSxFQUFFLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsUUFBUSxDQUFDLGFBQWEsQ0FBQyxNQUFNLEVBQUU7WUFDakUsT0FBTyxFQUFFLEVBQUUsSUFBSSxFQUFDLFNBQVMsRUFBQyxJQUFJLEVBQUMsUUFBUSxDQUFDLGFBQWEsQ0FBQyxNQUFNLEVBQUM7WUFDN0QsV0FBVyxFQUFFLFFBQVEsQ0FBQyxXQUFXLENBQUMsV0FBVztZQUM3QyxZQUFZLEVBQUUsQ0FBQztZQUNmLFNBQVMsRUFBQyxvQkFBb0I7WUFDOUIsYUFBYSxFQUFDLG9CQUFhLENBQUMsT0FBTztZQUNuQyxhQUFhLEVBQUUsQ0FBQztZQUNoQixtQkFBbUIsRUFBQyxLQUFLO1NBQzVCLENBQUMsQ0FBQztRQUVILEtBQUssQ0FBQyx1QkFBdUIsQ0FBQztZQUMxQixTQUFTLEVBQUMsc0JBQXNCO1lBQ2hDLFlBQVksRUFBQyxFQUFDLElBQUksRUFBQyxTQUFTLEVBQUMsSUFBSSxFQUFDLFFBQVEsQ0FBQyxhQUFhLENBQUMsTUFBTSxFQUFDO1lBQ2hFLE9BQU8sRUFBQyxFQUFDLElBQUksRUFBQyxVQUFVLEVBQUMsSUFBSSxFQUFDLFFBQVEsQ0FBQyxhQUFhLENBQUMsTUFBTSxFQUFDO1lBQzVELFlBQVksRUFBRSxDQUFDO1lBQ2YsYUFBYSxFQUFFLENBQUM7WUFDaEIsY0FBYyxFQUFFLFFBQVEsQ0FBQyxjQUFjLENBQUMsR0FBRztTQUM5QyxDQUFDLENBQUE7UUFHRixNQUFNLFVBQVUsR0FBRyxJQUFJLFFBQVEsQ0FBQyxLQUFLLENBQUMsSUFBSSxFQUFFLFlBQVksRUFBRTtZQUN0RCxZQUFZLEVBQUUsRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxRQUFRLENBQUMsYUFBYSxDQUFDLE1BQU0sRUFBRTtZQUNqRSxPQUFPLEVBQUUsRUFBRSxJQUFJLEVBQUMsSUFBSSxFQUFDLElBQUksRUFBQyxRQUFRLENBQUMsYUFBYSxDQUFDLE1BQU0sRUFBQztZQUN4RCxXQUFXLEVBQUUsUUFBUSxDQUFDLFdBQVcsQ0FBQyxXQUFXO1lBQzdDLFlBQVksRUFBRSxDQUFDO1lBQ2YsU0FBUyxFQUFDLGlCQUFpQjtZQUMzQixhQUFhLEVBQUMsb0JBQWEsQ0FBQyxPQUFPO1lBQ25DLGFBQWEsRUFBRSxDQUFDO1NBQ25CLENBQUMsQ0FBQztRQUNILFVBQVUsQ0FBQyx1QkFBdUIsQ0FBQztZQUMvQixTQUFTLEVBQUMsbUJBQW1CO1lBQzdCLFlBQVksRUFBQyxFQUFDLElBQUksRUFBQyxJQUFJLEVBQUMsSUFBSSxFQUFDLFFBQVEsQ0FBQyxhQUFhLENBQUMsTUFBTSxFQUFDO1lBQzNELE9BQU8sRUFBQyxFQUFDLElBQUksRUFBQyxVQUFVLEVBQUMsSUFBSSxFQUFDLFFBQVEsQ0FBQyxhQUFhLENBQUMsTUFBTSxFQUFDO1lBQzVELFlBQVksRUFBQyxDQUFDO1lBQ2QsYUFBYSxFQUFDLENBQUM7WUFDZixjQUFjLEVBQUMsUUFBUSxDQUFDLGNBQWMsQ0FBQyxHQUFHO1NBQzdDLENBQUMsQ0FBQTtRQUVGLE1BQU0sVUFBVSxHQUFDLElBQUksUUFBUSxDQUFDLEtBQUssQ0FBQyxJQUFJLEVBQUUsWUFBWSxFQUFFO1lBQ3BELFlBQVksRUFBRSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLFFBQVEsQ0FBQyxhQUFhLENBQUMsTUFBTSxFQUFFO1lBQ2pFLE9BQU8sRUFBRSxFQUFFLElBQUksRUFBQyxJQUFJLEVBQUMsSUFBSSxFQUFDLFFBQVEsQ0FBQyxhQUFhLENBQUMsTUFBTSxFQUFDO1lBQ3hELFdBQVcsRUFBRSxRQUFRLENBQUMsV0FBVyxDQUFDLFdBQVc7WUFDN0MsWUFBWSxFQUFFLENBQUM7WUFDZixTQUFTLEVBQUMsdUJBQXVCO1lBQ2pDLGFBQWEsRUFBQyxvQkFBYSxDQUFDLE9BQU87WUFDbkMsYUFBYSxFQUFFLENBQUM7U0FDbkIsQ0FBQyxDQUFDO1FBRUgsVUFBVSxDQUFDLHVCQUF1QixDQUFDO1lBQy9CLFNBQVMsRUFBQyxtQkFBbUI7WUFDN0IsWUFBWSxFQUFDLEVBQUMsSUFBSSxFQUFDLFVBQVUsRUFBQyxJQUFJLEVBQUMsUUFBUSxDQUFDLGFBQWEsQ0FBQyxNQUFNLEVBQUM7WUFDakUsT0FBTyxFQUFDLEVBQUMsSUFBSSxFQUFDLElBQUksRUFBQyxJQUFJLEVBQUMsUUFBUSxDQUFDLGFBQWEsQ0FBQyxNQUFNLEVBQUM7WUFDdEQsY0FBYyxFQUFDLFFBQVEsQ0FBQyxjQUFjLENBQUMsR0FBRztZQUMxQyxZQUFZLEVBQUMsQ0FBQztZQUNkLGFBQWEsRUFBQyxDQUFDO1NBQ2xCLENBQUMsQ0FBQTtRQUdGLE1BQU0sZ0JBQWdCLEdBQUcsSUFBSSxNQUFNLENBQUMsUUFBUSxDQUFDLElBQUksRUFBRSwrQkFBK0IsRUFBRTtZQUNoRixZQUFZLEVBQUMsNEJBQTRCO1lBQ3pDLE9BQU8sRUFBRSxNQUFNLENBQUMsT0FBTyxDQUFDLFdBQVc7WUFDbkMsT0FBTyxFQUFFLGdCQUFnQjtZQUN6QixXQUFXLEVBQUU7Z0JBQ1QsU0FBUyxFQUFFLE9BQU87Z0JBQ2xCLFFBQVEsRUFBQyxPQUFPLENBQUMsR0FBRyxDQUFDLE1BQVE7Z0JBQzdCLGFBQWEsRUFBQyxPQUFPLENBQUMsR0FBRyxDQUFDLFdBQWE7YUFDMUM7WUFDRCxPQUFPLEVBQUUsR0FBRyxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDO1lBQ2hDLElBQUksRUFBRSxNQUFNLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsRUFBRSxJQUFJLEVBQUUsY0FBYyxDQUFDLENBQUM7U0FDMUUsQ0FBQyxDQUFDO1FBR0gsTUFBTSxnQkFBZ0IsR0FBRyxJQUFJLE1BQU0sQ0FBQyxRQUFRLENBQUMsSUFBSSxFQUFFLCtCQUErQixFQUFFO1lBQ2hGLE9BQU8sRUFBRSxNQUFNLENBQUMsT0FBTyxDQUFDLFdBQVc7WUFDbkMsWUFBWSxFQUFDLDRCQUE0QjtZQUN6QyxPQUFPLEVBQUUsZ0JBQWdCO1lBQ3pCLFdBQVcsRUFBRTtnQkFDVCxTQUFTLEVBQUUsT0FBTztnQkFDbEIsUUFBUSxFQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsTUFBUTtnQkFDN0IsYUFBYSxFQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsV0FBYTthQUMxQztZQUNELE9BQU8sRUFBRSxHQUFHLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUM7WUFDaEMsSUFBSSxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsU0FBUyxFQUFFLElBQUksRUFBRSxjQUFjLENBQUMsQ0FBQztTQUMxRSxDQUFDLENBQUM7UUFHSCxNQUFNLGFBQWEsR0FBRyxJQUFJLE1BQU0sQ0FBQyxRQUFRLENBQUMsSUFBSSxFQUFFLDRCQUE0QixFQUFFO1lBQzFFLFlBQVksRUFBQyx5QkFBeUI7WUFDdEMsT0FBTyxFQUFFLE1BQU0sQ0FBQyxPQUFPLENBQUMsV0FBVztZQUNuQyxPQUFPLEVBQUUsYUFBYTtZQUN0QixXQUFXLEVBQUU7Z0JBQ1QsU0FBUyxFQUFFLE9BQU87YUFDckI7WUFDRCxPQUFPLEVBQUUsR0FBRyxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDO1lBQ2hDLElBQUksRUFBRSxNQUFNLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsRUFBRSxJQUFJLEVBQUUsY0FBYyxDQUFDLENBQUM7U0FDMUUsQ0FBQyxDQUFDO1FBRUgsTUFBTSxvQkFBb0IsR0FBRyxJQUFJLE1BQU0sQ0FBQyxRQUFRLENBQUMsSUFBSSxFQUFFLDRDQUE0QyxFQUFFO1lBQ2pHLFlBQVksRUFBQyx5Q0FBeUM7WUFDdEQsT0FBTyxFQUFFLE1BQU0sQ0FBQyxPQUFPLENBQUMsV0FBVztZQUNuQyxPQUFPLEVBQUUsd0JBQXdCO1lBQ2pDLFdBQVcsRUFBRTtnQkFDVCxTQUFTLEVBQUUsT0FBTzthQUNyQjtZQUNELE9BQU8sRUFBRSxHQUFHLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUM7WUFDaEMsSUFBSSxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsU0FBUyxFQUFFLElBQUksRUFBRSxjQUFjLENBQUMsQ0FBQztTQUUxRSxDQUFDLENBQUM7UUFFSCxNQUFNLGdCQUFnQixHQUFHLElBQUksTUFBTSxDQUFDLFFBQVEsQ0FBQyxJQUFJLEVBQUUsb0NBQW9DLEVBQUU7WUFDckYsWUFBWSxFQUFDLGlDQUFpQztZQUU5QyxPQUFPLEVBQUUsTUFBTSxDQUFDLE9BQU8sQ0FBQyxXQUFXO1lBQ25DLE9BQU8sRUFBRSxnQkFBZ0I7WUFDekIsT0FBTyxFQUFFLEdBQUcsQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQztZQUNoQyxXQUFXLEVBQUU7Z0JBQ1QsU0FBUyxFQUFFLE9BQU87YUFDckI7WUFDRCxJQUFJLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxTQUFTLEVBQUUsSUFBSSxFQUFFLGNBQWMsQ0FBQyxDQUFDO1NBRTFFLENBQUMsQ0FBQztRQUNILE1BQU0sZ0JBQWdCLEdBQUcsSUFBSSxNQUFNLENBQUMsUUFBUSxDQUFDLElBQUksRUFBRSxvQ0FBb0MsRUFBRTtZQUNyRixZQUFZLEVBQUMsaUNBQWlDO1lBRTlDLE9BQU8sRUFBRSxNQUFNLENBQUMsT0FBTyxDQUFDLFdBQVc7WUFDbkMsT0FBTyxFQUFFLHNCQUFzQjtZQUMvQixPQUFPLEVBQUUsR0FBRyxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDO1lBQ2hDLElBQUksRUFBRSxNQUFNLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsRUFBRSxJQUFJLEVBQUUsY0FBYyxDQUFDLENBQUM7WUFDdkUsV0FBVyxFQUFFO2dCQUNULFNBQVMsRUFBRSxPQUFPO2dCQUNsQixRQUFRLEVBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxNQUFRO2dCQUM3QixhQUFhLEVBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxXQUFhO2FBQzFDO1NBQ0osQ0FBQyxDQUFDO1FBRUgsTUFBTSxHQUFHLEdBQUcsSUFBSSxVQUFVLENBQUMsYUFBYSxDQUFDLElBQUksRUFBRSxjQUFjLEVBQUU7WUFDM0QsT0FBTyxFQUFFLGFBQWE7WUFDdEIsMkJBQTJCLEVBQUM7Z0JBQ3hCLFlBQVksRUFBRSxVQUFVLENBQUMsSUFBSSxDQUFDLFdBQVc7Z0JBQ3pDLFlBQVksRUFBRSxVQUFVLENBQUMsSUFBSSxDQUFDLFdBQVc7Z0JBQ3pDLFlBQVksRUFBQyxVQUFVLENBQUMsSUFBSSxDQUFDLGVBQWU7YUFDL0M7WUFDRCxhQUFhLEVBQUM7Z0JBQ1YsU0FBUyxFQUFDLE1BQU07YUFFbkI7WUFDRCxLQUFLLEVBQUUsS0FBSztTQUNmLENBQUMsQ0FBQztRQUVILE1BQU0sY0FBYyxHQUFHLElBQUksR0FBRyxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUMsZ0JBQWdCLEVBQUM7WUFDdEQsUUFBUSxFQUFDLGdCQUFnQjtZQUN6QixTQUFTLEVBQUMsSUFBSSxHQUFHLENBQUMsa0JBQWtCLENBQUMsSUFBSSxHQUFHLENBQUMsZ0JBQWdCLENBQUMsMkJBQTJCLENBQUMsRUFDMUYsSUFBSSxHQUFHLENBQUMsZ0JBQWdCLENBQUMsc0JBQXNCLENBQUMsQ0FBQztZQUNyRCxlQUFlLEVBQUMsQ0FBQyxHQUFHLENBQUMsYUFBYSxDQUFDLHdCQUF3QixDQUFDLDBDQUEwQyxDQUFDLENBQUM7U0FDdkcsQ0FBQyxDQUFBO1FBRUYsTUFBTSx3QkFBd0IsR0FBRyxJQUFJLEdBQUcsQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFDLG1CQUFtQixFQUFDO1lBQ3BFLFFBQVEsRUFBQyxrQkFBa0I7WUFDM0IsU0FBUyxFQUFFLElBQUksR0FBRyxDQUFDLGdCQUFnQixDQUFDLHNCQUFzQixDQUFDO1lBQzNELGVBQWUsRUFBQyxDQUFDLEdBQUcsQ0FBQyxhQUFhLENBQUMsd0JBQXdCLENBQUMsMENBQTBDLENBQUMsQ0FBQztZQUN4RyxjQUFjLEVBQUU7Z0JBQ1QsWUFBWSxFQUFFLElBQUksR0FBRyxDQUFDLGNBQWMsQ0FBQztvQkFDakMsVUFBVSxFQUFDLENBQUMsSUFBSSxHQUFHLENBQUMsZUFBZSxDQUFDOzRCQUNoQyxPQUFPLEVBQUMsQ0FBQyw2QkFBNkIsRUFBQyw2QkFBNkIsRUFBQywrQkFBK0IsRUFBQyxrQ0FBa0MsQ0FBQzs0QkFDeEksU0FBUyxFQUFDLENBQUMsR0FBRyxDQUFDOzRCQUNmLE1BQU0sRUFBQyxHQUFHLENBQUMsTUFBTSxDQUFDLEtBQUs7eUJBQzFCLENBQUMsQ0FBQztpQkFDTixDQUFDO2FBR0g7U0FHUixDQUFDLENBQUM7UUFHSCxNQUFNLGFBQWEsR0FBRyxJQUFJLE1BQU0sQ0FBQyxRQUFRLENBQUMsSUFBSSxFQUFFLHNDQUFzQyxFQUFFO1lBQ3BGLFlBQVksRUFBQyxtQ0FBbUM7WUFDaEQsT0FBTyxFQUFFLE1BQU0sQ0FBQyxPQUFPLENBQUMsV0FBVztZQUNuQyxPQUFPLEVBQUUsb0JBQW9CO1lBQzdCLElBQUksRUFBQyx3QkFBd0I7WUFDN0IsT0FBTyxFQUFFLEdBQUcsQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQztZQUNoQyxJQUFJLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxTQUFTLEVBQUUsSUFBSSxFQUFFLE9BQU8sQ0FBQyxDQUFDO1lBQ2hFLFdBQVcsRUFBRTtnQkFDVCxTQUFTLEVBQUUsT0FBTztnQkFDbEIsUUFBUSxFQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsTUFBUTtnQkFDN0IsYUFBYSxFQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsV0FBYTtnQkFDdkMsU0FBUyxFQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsT0FBUzthQUNsQztTQUNKLENBQUMsQ0FBQztRQUVILE1BQU0sU0FBUyxHQUFHLElBQUksTUFBTSxDQUFDLFFBQVEsQ0FBQyxJQUFJLEVBQUUsbUNBQW1DLEVBQUU7WUFDN0UsWUFBWSxFQUFDLGdDQUFnQztZQUM3QyxPQUFPLEVBQUUsTUFBTSxDQUFDLE9BQU8sQ0FBQyxXQUFXO1lBQ25DLE9BQU8sRUFBRSxpQkFBaUI7WUFDMUIsSUFBSSxFQUFDLHdCQUF3QjtZQUM3QixPQUFPLEVBQUUsR0FBRyxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDO1lBQ2hDLElBQUksRUFBRSxNQUFNLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsRUFBRSxJQUFJLEVBQUUsT0FBTyxDQUFDLENBQUM7WUFDaEUsV0FBVyxFQUFFO2dCQUNULFNBQVMsRUFBRSxPQUFPO2dCQUNsQixRQUFRLEVBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxNQUFRO2dCQUM3QixhQUFhLEVBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxXQUFhO2dCQUN2QyxTQUFTLEVBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxPQUFTO2dCQUMvQixLQUFLLEVBQUMscUJBQXFCO2dCQUMzQixXQUFXLEVBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxTQUFXO2FBQ3RDO1NBQ0osQ0FBQyxDQUFDO1FBSUgsTUFBTSxjQUFjLEdBQUcsSUFBSSxNQUFNLENBQUMsUUFBUSxDQUFDLElBQUksRUFBRSxpQkFBaUIsRUFBRTtZQUNoRSxZQUFZLEVBQUMsNEJBQTRCO1lBQ3pDLElBQUksRUFBRSxjQUFjO1lBQ3BCLE9BQU8sRUFBRSxNQUFNLENBQUMsT0FBTyxDQUFDLFdBQVc7WUFDbkMsT0FBTyxFQUFFLHFCQUFxQjtZQUM5QixPQUFPLEVBQUUsR0FBRyxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDO1lBQ2hDLElBQUksRUFBRSxNQUFNLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsRUFBRSxJQUFJLEVBQUUsU0FBUyxDQUFDLENBQUM7WUFDbEUsV0FBVyxFQUFFO2dCQUNULFNBQVMsRUFBRSxPQUFPO2FBQ3JCO1NBQ0osQ0FBQyxDQUFDO1FBRUgsTUFBTSxnQkFBZ0IsR0FBRyxJQUFJLE1BQU0sQ0FBQyxRQUFRLENBQUMsSUFBSSxFQUFDLHlCQUF5QixFQUFDO1lBQ3hFLFlBQVksRUFBQyxnQ0FBZ0M7WUFDN0MsSUFBSSxFQUFFLHdCQUF3QjtZQUM5QixPQUFPLEVBQUUsTUFBTSxDQUFDLE9BQU8sQ0FBQyxXQUFXO1lBQ25DLE9BQU8sRUFBQyxrQkFBa0I7WUFDMUIsT0FBTyxFQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQztZQUMvQixJQUFJLEVBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxTQUFTLEVBQUMsSUFBSSxFQUFDLE9BQU8sQ0FBQyxDQUFDO1lBQzdELFdBQVcsRUFBRTtnQkFDVCxTQUFTLEVBQUUsT0FBTyxDQUFDLEdBQUcsQ0FBQyxPQUFTO2dCQUNoQyxVQUFVLEVBQUMsMEJBQTBCO2FBQ3hDO1NBQ0osQ0FBQyxDQUFBO1FBRUYsTUFBTSxVQUFVLEdBQUcsSUFBSSxNQUFNLENBQUMsUUFBUSxDQUFDLElBQUksRUFBQyxrQ0FBa0MsRUFBQztZQUMzRSxZQUFZLEVBQUMsMEJBQTBCO1lBQ3ZDLElBQUksRUFBRSx3QkFBd0I7WUFDOUIsT0FBTyxFQUFFLE1BQU0sQ0FBQyxPQUFPLENBQUMsV0FBVztZQUNuQyxPQUFPLEVBQUMsZ0JBQWdCO1lBQ3hCLE9BQU8sRUFBQyxHQUFHLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUM7WUFDL0IsSUFBSSxFQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsU0FBUyxFQUFDLElBQUksRUFBQyxPQUFPLENBQUMsQ0FBQztZQUM3RCxXQUFXLEVBQUU7Z0JBQ1QsVUFBVSxFQUFDLDBCQUEwQjthQUN4QztTQUNKLENBQUMsQ0FBQztRQUVILE1BQU0sYUFBYSxHQUFHLElBQUksTUFBTSxDQUFDLFFBQVEsQ0FBQyxJQUFJLEVBQUMsb0NBQW9DLEVBQUM7WUFDaEYsWUFBWSxFQUFDLDRCQUE0QjtZQUN6QyxJQUFJLEVBQUUsd0JBQXdCO1lBQzlCLE9BQU8sRUFBRSxNQUFNLENBQUMsT0FBTyxDQUFDLFdBQVc7WUFDbkMsT0FBTyxFQUFDLGtCQUFrQjtZQUMxQixPQUFPLEVBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDO1lBQy9CLElBQUksRUFBQyxNQUFNLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsRUFBQyxJQUFJLEVBQUMsT0FBTyxDQUFDLENBQUM7WUFDN0QsV0FBVyxFQUFFO2dCQUNULFVBQVUsRUFBQywwQkFBMEI7YUFDeEM7U0FDSixDQUFDLENBQUM7UUFFSCxNQUFNLFVBQVUsR0FBRyxJQUFJLE1BQU0sQ0FBQyxRQUFRLENBQUMsSUFBSSxFQUFDLGtDQUFrQyxFQUFDO1lBQzNFLFlBQVksRUFBQyxzQkFBc0I7WUFDbkMsSUFBSSxFQUFFLHdCQUF3QjtZQUM5QixPQUFPLEVBQUUsTUFBTSxDQUFDLE9BQU8sQ0FBQyxXQUFXO1lBQ25DLE9BQU8sRUFBQyxtQkFBbUI7WUFDM0IsT0FBTyxFQUFFLEdBQUcsQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQztZQUNoQyxJQUFJLEVBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxTQUFTLEVBQUMsSUFBSSxFQUFDLE9BQU8sQ0FBQyxDQUFDO1NBQ2hFLENBQUMsQ0FBQTtRQUVGLE1BQU0sYUFBYSxHQUFHLElBQUksTUFBTSxDQUFDLFFBQVEsQ0FBQyxJQUFJLEVBQUMseUNBQXlDLEVBQUM7WUFDdEYsWUFBWSxFQUFDLDRCQUE0QjtZQUN6QyxJQUFJLEVBQUUsd0JBQXdCO1lBQzlCLE9BQU8sRUFBRSxNQUFNLENBQUMsT0FBTyxDQUFDLFdBQVc7WUFDbkMsT0FBTyxFQUFDLDBCQUEwQjtZQUNsQyxPQUFPLEVBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDO1lBQy9CLElBQUksRUFBQyxNQUFNLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsRUFBQyxJQUFJLEVBQUMsT0FBTyxDQUFDLENBQUM7U0FDL0QsQ0FBQyxDQUFDO1FBRUgsTUFBTSxhQUFhLEdBQUcsSUFBSSxNQUFNLENBQUMsUUFBUSxDQUFDLElBQUksRUFBRSxzQ0FBc0MsRUFBQztZQUNwRixZQUFZLEVBQUMsd0JBQXdCO1lBQ3JDLElBQUksRUFBRSx3QkFBd0I7WUFDOUIsT0FBTyxFQUFFLE1BQU0sQ0FBQyxPQUFPLENBQUMsV0FBVztZQUNuQyxPQUFPLEVBQUMsb0JBQW9CO1lBQzVCLE9BQU8sRUFBQyxHQUFHLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUM7WUFDL0IsSUFBSSxFQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsU0FBUyxFQUFDLElBQUksRUFBQyxPQUFPLENBQUMsQ0FBQztTQUMvRCxDQUFDLENBQUM7UUFFSCxNQUFNLFdBQVcsR0FBRyxJQUFJLE1BQU0sQ0FBQyxRQUFRLENBQUMsSUFBSSxFQUFDLHFDQUFxQyxFQUFDO1lBQy9FLFlBQVksRUFBQyx5QkFBeUI7WUFDdEMsT0FBTyxFQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsV0FBVztZQUNsQyxPQUFPLEVBQUMsbUJBQW1CO1lBQzNCLE9BQU8sRUFBQyxHQUFHLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUM7WUFDL0IsSUFBSSxFQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsU0FBUyxFQUFDLElBQUksRUFBQyxjQUFjLENBQUMsRUFBQztnQkFDaEUsT0FBTyxFQUFDLENBQUMsY0FBYyxDQUFDO2FBQzNCLENBQUM7U0FDTCxDQUFDLENBQUE7UUFDRixLQUFLLENBQUMsa0JBQWtCLENBQUMsZ0JBQWdCLENBQUMsQ0FBQztRQUMzQyxLQUFLLENBQUMsa0JBQWtCLENBQUMsZ0JBQWdCLENBQUMsQ0FBQztRQUMzQyxLQUFLLENBQUMsYUFBYSxDQUFDLGFBQWEsQ0FBQyxDQUFDO1FBQ25DLEtBQUssQ0FBQyxhQUFhLENBQUMsZ0JBQWdCLENBQUMsQ0FBQztRQUN0QyxLQUFLLENBQUMsYUFBYSxDQUFDLG9CQUFvQixDQUFDLENBQUM7UUFDMUMsS0FBSyxDQUFDLGtCQUFrQixDQUFDLHdCQUF3QixDQUFDLENBQUM7UUFDbkQsS0FBSyxDQUFDLGtCQUFrQixDQUFDLFdBQVcsQ0FBQyxDQUFDO1FBQ3RDLFVBQVUsQ0FBQyxhQUFhLENBQUMsVUFBVSxDQUFDLENBQUM7UUFDckMsVUFBVSxDQUFDLGFBQWEsQ0FBQyxhQUFhLENBQUMsQ0FBQztRQUN4QyxVQUFVLENBQUMsa0JBQWtCLENBQUMsY0FBYyxDQUFDLENBQUM7UUFDOUMsVUFBVSxDQUFDLGtCQUFrQixDQUFDLHdCQUF3QixDQUFDLENBQUM7UUFDeEQsVUFBVSxDQUFDLGtCQUFrQixDQUFDLHdCQUF3QixDQUFDLENBQUM7UUFDeEQsVUFBVSxDQUFDLGFBQWEsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDO1FBQzNDLE1BQU0saUJBQWlCLEdBQUcsR0FBRyxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsT0FBTyxDQUFDLENBQUE7UUFDdkQsTUFBTSxnQkFBZ0IsR0FBRyxHQUFHLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxPQUFPLENBQUMsQ0FBQTtRQUd0RCxNQUFNLFdBQVcsR0FBRyxPQUFPLENBQUMsUUFBUSxDQUFDLGNBQWMsQ0FBQyxJQUFJLEVBQUMsU0FBUyxFQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsT0FBUyxDQUFDLENBQUM7UUFFMUYsSUFBSSxJQUFJLEdBQUMsU0FBUyxDQUFDO1FBQ25CLElBQUksQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLFFBQVE7WUFDeEIsSUFBSSxHQUFHLElBQUksVUFBVSxDQUFDLDBCQUEwQixDQUFDLElBQUksRUFBQyxvQkFBb0IsRUFBQztnQkFDekUsZ0JBQWdCLEVBQUMsQ0FBQyxXQUFXLENBQUM7Z0JBQzlCLGNBQWMsRUFBQyxpQkFBaUI7Z0JBQ2hDLGNBQWMsRUFBQyxVQUFVLENBQUMsY0FBYyxDQUFDLE1BQU0sQ0FBQyxlQUFlLENBQUM7YUFDbEUsQ0FBQyxDQUFDO1FBR0gsaUJBQWlCLENBQUMsU0FBUyxDQUFDLE1BQU0sRUFBRSxJQUFJLFVBQVUsQ0FBQyxpQkFBaUIsQ0FBQyxnQkFBZ0IsQ0FBQyxFQUFDO1lBQ25GLFVBQVUsRUFBRSxJQUFJO1NBQ25CLENBQUMsQ0FBQTtRQUNGLGlCQUFpQixDQUFDLFNBQVMsQ0FBQyxLQUFLLEVBQUUsSUFBSSxVQUFVLENBQUMsaUJBQWlCLENBQUMsZ0JBQWdCLENBQUMsRUFBQztZQUNsRixVQUFVLEVBQUUsSUFBSTtTQUNuQixDQUFDLENBQUM7UUFDSCxpQkFBaUIsQ0FBQyxTQUFTLENBQUMsUUFBUSxFQUFFLElBQUksVUFBVSxDQUFDLGlCQUFpQixDQUFDLGdCQUFnQixDQUFDLEVBQUM7WUFDckYsVUFBVSxFQUFFLElBQUk7U0FDbkIsQ0FBQyxDQUFDO1FBQ0gsZ0JBQWdCLENBQUMsU0FBUyxDQUFDLE1BQU0sRUFBQyxJQUFJLFVBQVUsQ0FBQyxpQkFBaUIsQ0FBQyxhQUFhLENBQUMsRUFBQztZQUM5RSxVQUFVLEVBQUUsSUFBSTtTQUNuQixDQUFDLENBQUE7UUFDRixnQkFBZ0IsQ0FBQyxTQUFTLENBQUMsS0FBSyxFQUFDLElBQUksVUFBVSxDQUFDLGlCQUFpQixDQUFDLFVBQVUsQ0FBQyxFQUFDO1lBQzFFLFVBQVUsRUFBQyxJQUFJO1NBQ2xCLENBQUMsQ0FBQTtRQUNGLE1BQU0sY0FBYyxHQUFHLGdCQUFnQixDQUFDLFdBQVcsQ0FBQyxTQUFTLENBQUMsQ0FBQztRQUMvRCxNQUFNLGFBQWEsR0FBRyxnQkFBZ0IsQ0FBQyxXQUFXLENBQUMsT0FBTyxDQUFDLENBQUM7UUFFNUQsTUFBTSxrQkFBa0IsR0FBRSxhQUFhLENBQUMsV0FBVyxDQUFDLFFBQVEsQ0FBQyxDQUFDO1FBQzlELE1BQU0sZ0JBQWdCLEdBQUcsaUJBQWlCLENBQUMsV0FBVyxDQUFDLFVBQVUsQ0FBQyxDQUFDO1FBQ25FLE1BQU0sYUFBYSxHQUFHLGlCQUFpQixDQUFDLFdBQVcsQ0FBQyxPQUFPLENBQUMsQ0FBQztRQUM3RCxNQUFNLGNBQWMsR0FBRyxpQkFBaUIsQ0FBQyxXQUFXLENBQUMsUUFBUSxDQUFDLENBQUM7UUFDL0QsTUFBTSxvQkFBb0IsR0FBRyxhQUFhLENBQUMsV0FBVyxDQUFDLFdBQVcsQ0FBQyxDQUFDO1FBQ3BFLE1BQU0sc0JBQXNCLEdBQUcsb0JBQW9CLENBQUMsV0FBVyxDQUFDLFFBQVEsQ0FBQyxDQUFDO1FBQzFFLE1BQU0sb0JBQW9CLEdBQUcsaUJBQWlCLENBQUMsV0FBVyxDQUFDLGFBQWEsQ0FBQyxDQUFDO1FBQzFFLHNCQUFzQixDQUFDLFNBQVMsQ0FBQyxLQUFLLEVBQUUsSUFBSSxVQUFVLENBQUMsaUJBQWlCLENBQUMsb0JBQW9CLENBQUMsRUFBQztZQUMzRixVQUFVLEVBQUMsSUFBSTtTQUNsQixDQUFDLENBQUE7UUFDRixnQkFBZ0IsQ0FBQyxTQUFTLENBQUMsS0FBSyxFQUFFLElBQUksVUFBVSxDQUFDLGlCQUFpQixDQUFDLGFBQWEsQ0FBQyxFQUFDO1lBQzlFLFVBQVUsRUFBQyxJQUFJO1NBQ2xCLENBQUMsQ0FBQTtRQUNGLGNBQWMsQ0FBQyxTQUFTLENBQUMsTUFBTSxFQUFFLElBQUksVUFBVSxDQUFDLGlCQUFpQixDQUFDLGdCQUFnQixDQUFDLEVBQUM7WUFDaEYsVUFBVSxFQUFDLElBQUk7U0FDbEIsQ0FBQyxDQUFDO1FBQ0gsY0FBYyxDQUFDLFNBQVMsQ0FBQyxLQUFLLEVBQUMsSUFBSSxVQUFVLENBQUMsaUJBQWlCLENBQUMsYUFBYSxDQUFDLEVBQUM7WUFDM0UsVUFBVSxFQUFDLElBQUk7U0FDbEIsQ0FBQyxDQUFDO1FBQ0gsYUFBYSxDQUFDLFNBQVMsQ0FBQyxLQUFLLEVBQUMsSUFBSSxVQUFVLENBQUMsaUJBQWlCLENBQUMsVUFBVSxDQUFDLEVBQUM7WUFDdkUsVUFBVSxFQUFFLElBQUk7U0FDbkIsQ0FBQyxDQUFBO1FBQ0Ysb0JBQW9CLENBQUMsU0FBUyxDQUFDLEtBQUssRUFBQyxJQUFJLFVBQVUsQ0FBQyxpQkFBaUIsQ0FBQyxhQUFhLENBQUMsRUFBQztZQUNqRixVQUFVLEVBQUUsSUFBSTtTQUNuQixDQUFDLENBQUE7UUFFRixrQkFBa0IsQ0FBQyxTQUFTLENBQUMsTUFBTSxFQUFDLElBQUksVUFBVSxDQUFDLGlCQUFpQixDQUFDLGFBQWEsQ0FBQyxFQUFDO1lBQ2hGLFVBQVUsRUFBRSxJQUFJO1NBQ25CLENBQUMsQ0FBQTtJQUNOLENBQUM7Q0FFSjtBQTFYRCxrRUEwWEMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBjZGsgZnJvbSAnQGF3cy1jZGsvY29yZSc7XG5pbXBvcnQge1JlbW92YWxQb2xpY3l9IGZyb20gJ0Bhd3MtY2RrL2NvcmUnO1xuaW1wb3J0ICogYXMgbGFtYmRhIGZyb20gJ0Bhd3MtY2RrL2F3cy1sYW1iZGEnO1xuaW1wb3J0ICogYXMgZHluYW1vZGIgZnJvbSAnQGF3cy1jZGsvYXdzLWR5bmFtb2RiJztcbmltcG9ydCAqIGFzIGFwaWdhdGV3YXkgZnJvbSAnQGF3cy1jZGsvYXdzLWFwaWdhdGV3YXknO1xuaW1wb3J0ICogYXMgaWFtIGZyb20gJ0Bhd3MtY2RrL2F3cy1pYW0nXG5pbXBvcnQgKiBhcyBwYXRoIGZyb20gJ3BhdGgnO1xuaW1wb3J0ICogYXMgY29nbml0byBmcm9tICdAYXdzLWNkay9hd3MtY29nbml0byc7XG5leHBvcnQgY2xhc3MgQXdzU2FtQ2xpQ2RrSGVsbG9Xb3JsZFN0YWNrIGV4dGVuZHMgY2RrLlN0YWNrIHtcbiAgICBjb25zdHJ1Y3RvcihzY29wZTogY2RrLkNvbnN0cnVjdCwgaWQ6IHN0cmluZywgcHJvcHM/OiBjZGsuU3RhY2tQcm9wcykge1xuICAgICAgICBzdXBlcihzY29wZSwgaWQsIHByb3BzKTtcblxuXG4gICAgICAgIGNvbnN0IHRhYmxlID0gbmV3IGR5bmFtb2RiLlRhYmxlKHRoaXMsICdBY2NvdW50c0NvbGxlY3Rpb24nLCB7XG4gICAgICAgICAgICBwYXJ0aXRpb25LZXk6IHsgbmFtZTogJ3BrJywgdHlwZTogZHluYW1vZGIuQXR0cmlidXRlVHlwZS5TVFJJTkcgfSxcbiAgICAgICAgICAgIHNvcnRLZXk6IHsgbmFtZTonY291bnRyeScsdHlwZTpkeW5hbW9kYi5BdHRyaWJ1dGVUeXBlLlNUUklOR30sXG4gICAgICAgICAgICBiaWxsaW5nTW9kZTogZHluYW1vZGIuQmlsbGluZ01vZGUuUFJPVklTSU9ORUQsXG4gICAgICAgICAgICByZWFkQ2FwYWNpdHk6IDUsXG4gICAgICAgICAgICB0YWJsZU5hbWU6J0FjY291bnRzQ29sbGVjdGlvbicsXG4gICAgICAgICAgICByZW1vdmFsUG9saWN5OlJlbW92YWxQb2xpY3kuREVTVFJPWSxcbiAgICAgICAgICAgIHdyaXRlQ2FwYWNpdHk6IDUsXG4gICAgICAgICAgICB0aW1lVG9MaXZlQXR0cmlidXRlOlwidHRsXCJcbiAgICAgICAgfSk7XG5cbiAgICAgICAgdGFibGUuYWRkR2xvYmFsU2Vjb25kYXJ5SW5kZXgoe1xuICAgICAgICAgICAgaW5kZXhOYW1lOidUeXBlSXRlbUNvdW50cnlJbmRleCcsXG4gICAgICAgICAgICBwYXJ0aXRpb25LZXk6e25hbWU6J2NvdW50cnknLHR5cGU6ZHluYW1vZGIuQXR0cmlidXRlVHlwZS5TVFJJTkd9LFxuICAgICAgICAgICAgc29ydEtleTp7bmFtZTondHlwZUl0ZW0nLHR5cGU6ZHluYW1vZGIuQXR0cmlidXRlVHlwZS5TVFJJTkd9LFxuICAgICAgICAgICAgcmVhZENhcGFjaXR5OiA1LFxuICAgICAgICAgICAgd3JpdGVDYXBhY2l0eTogNSxcbiAgICAgICAgICAgIHByb2plY3Rpb25UeXBlOiBkeW5hbW9kYi5Qcm9qZWN0aW9uVHlwZS5BTEwsXG4gICAgICAgIH0pXG5cblxuICAgICAgICBjb25zdCB1c2Vyc1RhYmxlID0gbmV3IGR5bmFtb2RiLlRhYmxlKHRoaXMsICdVc2Vyc1RhYmxlJywge1xuICAgICAgICAgICAgcGFydGl0aW9uS2V5OiB7IG5hbWU6ICdwaycsIHR5cGU6IGR5bmFtb2RiLkF0dHJpYnV0ZVR5cGUuU1RSSU5HIH0sXG4gICAgICAgICAgICBzb3J0S2V5OiB7IG5hbWU6J3NrJyx0eXBlOmR5bmFtb2RiLkF0dHJpYnV0ZVR5cGUuU1RSSU5HfSxcbiAgICAgICAgICAgIGJpbGxpbmdNb2RlOiBkeW5hbW9kYi5CaWxsaW5nTW9kZS5QUk9WSVNJT05FRCxcbiAgICAgICAgICAgIHJlYWRDYXBhY2l0eTogNSxcbiAgICAgICAgICAgIHRhYmxlTmFtZTonVXNlcnNDb2xsZWN0aW9uJyxcbiAgICAgICAgICAgIHJlbW92YWxQb2xpY3k6UmVtb3ZhbFBvbGljeS5ERVNUUk9ZLFxuICAgICAgICAgICAgd3JpdGVDYXBhY2l0eTogNVxuICAgICAgICB9KTtcbiAgICAgICAgdXNlcnNUYWJsZS5hZGRHbG9iYWxTZWNvbmRhcnlJbmRleCh7XG4gICAgICAgICAgICBpbmRleE5hbWU6XCJpbmRleF9za19hbmRfdHlwZVwiLFxuICAgICAgICAgICAgcGFydGl0aW9uS2V5OntuYW1lOidzaycsdHlwZTpkeW5hbW9kYi5BdHRyaWJ1dGVUeXBlLlNUUklOR30sXG4gICAgICAgICAgICBzb3J0S2V5OntuYW1lOlwidHlwZUl0ZW1cIix0eXBlOmR5bmFtb2RiLkF0dHJpYnV0ZVR5cGUuU1RSSU5HfSxcbiAgICAgICAgICAgIHJlYWRDYXBhY2l0eTo1LFxuICAgICAgICAgICAgd3JpdGVDYXBhY2l0eTo1LFxuICAgICAgICAgICAgcHJvamVjdGlvblR5cGU6ZHluYW1vZGIuUHJvamVjdGlvblR5cGUuQUxMXG4gICAgICAgIH0pXG5cbiAgICAgICAgY29uc3Qgcm9sZXNUYWJsZT1uZXcgZHluYW1vZGIuVGFibGUodGhpcywgJ1JvbGVzVGFibGUnLCB7XG4gICAgICAgICAgICBwYXJ0aXRpb25LZXk6IHsgbmFtZTogJ3BrJywgdHlwZTogZHluYW1vZGIuQXR0cmlidXRlVHlwZS5TVFJJTkcgfSxcbiAgICAgICAgICAgIHNvcnRLZXk6IHsgbmFtZTonc2snLHR5cGU6ZHluYW1vZGIuQXR0cmlidXRlVHlwZS5TVFJJTkd9LFxuICAgICAgICAgICAgYmlsbGluZ01vZGU6IGR5bmFtb2RiLkJpbGxpbmdNb2RlLlBST1ZJU0lPTkVELFxuICAgICAgICAgICAgcmVhZENhcGFjaXR5OiA1LFxuICAgICAgICAgICAgdGFibGVOYW1lOidSb2xlc0FjY2Vzc0NvbGxlY3Rpb24nLFxuICAgICAgICAgICAgcmVtb3ZhbFBvbGljeTpSZW1vdmFsUG9saWN5LkRFU1RST1ksXG4gICAgICAgICAgICB3cml0ZUNhcGFjaXR5OiA1XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHJvbGVzVGFibGUuYWRkR2xvYmFsU2Vjb25kYXJ5SW5kZXgoe1xuICAgICAgICAgICAgaW5kZXhOYW1lOlwiaW5kZXhfYnlfdHlwZUl0ZW1cIixcbiAgICAgICAgICAgIHBhcnRpdGlvbktleTp7bmFtZTondHlwZUl0ZW0nLHR5cGU6ZHluYW1vZGIuQXR0cmlidXRlVHlwZS5TVFJJTkd9LFxuICAgICAgICAgICAgc29ydEtleTp7bmFtZTpcInNrXCIsdHlwZTpkeW5hbW9kYi5BdHRyaWJ1dGVUeXBlLlNUUklOR30sXG4gICAgICAgICAgICBwcm9qZWN0aW9uVHlwZTpkeW5hbW9kYi5Qcm9qZWN0aW9uVHlwZS5BTEwsXG4gICAgICAgICAgICByZWFkQ2FwYWNpdHk6NSxcbiAgICAgICAgICAgIHdyaXRlQ2FwYWNpdHk6NVxuICAgICAgICB9KVxuXG5cbiAgICAgICAgY29uc3QgZHluYW1vSW5zZXJ0SXRlbSA9IG5ldyBsYW1iZGEuRnVuY3Rpb24odGhpcywgJ2R5bmFtby1sYW1iZGEtaW5zZXJ0LWZ1bmN0aW9uJywge1xuICAgICAgICAgICAgZnVuY3Rpb25OYW1lOlwic2FtLWNkay1kYi1pbnNlcnQtZnVuY3Rpb25cIixcbiAgICAgICAgICAgIHJ1bnRpbWU6IGxhbWJkYS5SdW50aW1lLk5PREVKU18xNF9YLFxuICAgICAgICAgICAgaGFuZGxlcjogJ2luc2VydC5oYW5kbGVyJyxcbiAgICAgICAgICAgIGVudmlyb25tZW50OiB7XG4gICAgICAgICAgICAgICAgXCJJU0xPQ0FMXCI6IFwiZmFsc2VcIixcbiAgICAgICAgICAgICAgICBcImFybkttc1wiOnByb2Nlc3MuZW52LmFybkttcyEhLFxuICAgICAgICAgICAgICAgIFwiYXJuS21zQWxpYXNcIjpwcm9jZXNzLmVudi5hcm5LbXNBbGlhcyEhXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgdGltZW91dDogY2RrLkR1cmF0aW9uLm1pbnV0ZXMoMSksXG4gICAgICAgICAgICBjb2RlOiBsYW1iZGEuQ29kZS5mcm9tQXNzZXQocGF0aC5qb2luKF9fZGlybmFtZSwgJy4uJywgJ2R5bmFtby1pdGVtcycpKSxcbiAgICAgICAgfSk7XG5cblxuICAgICAgICBjb25zdCBkeW5hbW9VcGRhdGVJdGVtID0gbmV3IGxhbWJkYS5GdW5jdGlvbih0aGlzLCAnZHluYW1vLWxhbWJkYS11cGRhdGUtZnVuY3Rpb24nLCB7XG4gICAgICAgICAgICBydW50aW1lOiBsYW1iZGEuUnVudGltZS5OT0RFSlNfMTRfWCxcbiAgICAgICAgICAgIGZ1bmN0aW9uTmFtZTpcInNhbS1jZGstZGItdXBkYXRlLWZ1bmN0aW9uXCIsXG4gICAgICAgICAgICBoYW5kbGVyOiAndXBkYXRlLmhhbmRsZXInLFxuICAgICAgICAgICAgZW52aXJvbm1lbnQ6IHtcbiAgICAgICAgICAgICAgICBcIklTTE9DQUxcIjogXCJmYWxzZVwiLFxuICAgICAgICAgICAgICAgIFwiYXJuS21zXCI6cHJvY2Vzcy5lbnYuYXJuS21zISEsXG4gICAgICAgICAgICAgICAgXCJhcm5LbXNBbGlhc1wiOnByb2Nlc3MuZW52LmFybkttc0FsaWFzISFcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB0aW1lb3V0OiBjZGsuRHVyYXRpb24ubWludXRlcygxKSxcbiAgICAgICAgICAgIGNvZGU6IGxhbWJkYS5Db2RlLmZyb21Bc3NldChwYXRoLmpvaW4oX19kaXJuYW1lLCAnLi4nLCAnZHluYW1vLWl0ZW1zJykpLFxuICAgICAgICB9KTtcblxuXG4gICAgICAgIGNvbnN0IGR5bmFtb0dldEl0ZW0gPSBuZXcgbGFtYmRhLkZ1bmN0aW9uKHRoaXMsICdkeW5hbW8tbGFtYmRhLWdldC1mdW5jdGlvbicsIHtcbiAgICAgICAgICAgIGZ1bmN0aW9uTmFtZTpcInNhbS1jZGstZGItZ2V0LWZ1bmN0aW9uXCIsXG4gICAgICAgICAgICBydW50aW1lOiBsYW1iZGEuUnVudGltZS5OT0RFSlNfMTRfWCxcbiAgICAgICAgICAgIGhhbmRsZXI6ICdnZXQuaGFuZGxlcicsXG4gICAgICAgICAgICBlbnZpcm9ubWVudDoge1xuICAgICAgICAgICAgICAgIFwiSVNMT0NBTFwiOiBcImZhbHNlXCJcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB0aW1lb3V0OiBjZGsuRHVyYXRpb24ubWludXRlcygxKSxcbiAgICAgICAgICAgIGNvZGU6IGxhbWJkYS5Db2RlLmZyb21Bc3NldChwYXRoLmpvaW4oX19kaXJuYW1lLCAnLi4nLCAnZHluYW1vLWl0ZW1zJykpLFxuICAgICAgICB9KTtcblxuICAgICAgICBjb25zdCBkeW5hbW9HZXRDb3VudHJ5VHlwZSA9IG5ldyBsYW1iZGEuRnVuY3Rpb24odGhpcywgJ2R5bmFtby1sYW1iZGEtZ2V0LWJ5LWNvdW50cnktdHlwZS1mdW5jdGlvbicsIHtcbiAgICAgICAgICAgIGZ1bmN0aW9uTmFtZTpcInNhbS1jZGstZGItZ2V0LWJ5LWNvdW50cnktdHlwZS1mdW5jdGlvblwiLFxuICAgICAgICAgICAgcnVudGltZTogbGFtYmRhLlJ1bnRpbWUuTk9ERUpTXzE0X1gsXG4gICAgICAgICAgICBoYW5kbGVyOiAnZ2V0LmhhbmRsZXJDb3VudHJ5VHlwZScsXG4gICAgICAgICAgICBlbnZpcm9ubWVudDoge1xuICAgICAgICAgICAgICAgIFwiSVNMT0NBTFwiOiBcImZhbHNlXCJcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB0aW1lb3V0OiBjZGsuRHVyYXRpb24ubWludXRlcygxKSxcbiAgICAgICAgICAgIGNvZGU6IGxhbWJkYS5Db2RlLmZyb21Bc3NldChwYXRoLmpvaW4oX19kaXJuYW1lLCAnLi4nLCAnZHluYW1vLWl0ZW1zJykpXG5cbiAgICAgICAgfSk7XG5cbiAgICAgICAgY29uc3QgZHluYW1vUmVtb3ZlSXRlbSA9IG5ldyBsYW1iZGEuRnVuY3Rpb24odGhpcywgJ2R5bmFtby1sYW1iZGEtcmVtb3ZlLWl0ZW0tZnVuY3Rpb24nLCB7XG4gICAgICAgICAgICBmdW5jdGlvbk5hbWU6XCJzYW0tY2RrLWRiLXJlbW92ZS1pdGVtLWZ1bmN0aW9uXCIsXG5cbiAgICAgICAgICAgIHJ1bnRpbWU6IGxhbWJkYS5SdW50aW1lLk5PREVKU18xNF9YLFxuICAgICAgICAgICAgaGFuZGxlcjogJ3JlbW92ZS5oYW5kbGVyJyxcbiAgICAgICAgICAgIHRpbWVvdXQ6IGNkay5EdXJhdGlvbi5taW51dGVzKDEpLFxuICAgICAgICAgICAgZW52aXJvbm1lbnQ6IHtcbiAgICAgICAgICAgICAgICBcIklTTE9DQUxcIjogXCJmYWxzZVwiXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgY29kZTogbGFtYmRhLkNvZGUuZnJvbUFzc2V0KHBhdGguam9pbihfX2Rpcm5hbWUsICcuLicsICdkeW5hbW8taXRlbXMnKSlcblxuICAgICAgICB9KTtcbiAgICAgICAgY29uc3QgZHluYW1vU2VhcmNoSXRlbSA9IG5ldyBsYW1iZGEuRnVuY3Rpb24odGhpcywgJ2R5bmFtby1sYW1iZGEtc2VhcmNoLWl0ZW0tZnVuY3Rpb24nLCB7XG4gICAgICAgICAgICBmdW5jdGlvbk5hbWU6XCJzYW0tY2RrLWRiLXNlYXJjaC1pdGVtLWZ1bmN0aW9uXCIsXG5cbiAgICAgICAgICAgIHJ1bnRpbWU6IGxhbWJkYS5SdW50aW1lLk5PREVKU18xNF9YLFxuICAgICAgICAgICAgaGFuZGxlcjogJ3NlYXJjaC5zZWFyY2hIYW5kbGVyJyxcbiAgICAgICAgICAgIHRpbWVvdXQ6IGNkay5EdXJhdGlvbi5taW51dGVzKDEpLFxuICAgICAgICAgICAgY29kZTogbGFtYmRhLkNvZGUuZnJvbUFzc2V0KHBhdGguam9pbihfX2Rpcm5hbWUsICcuLicsICdkeW5hbW8taXRlbXMnKSksXG4gICAgICAgICAgICBlbnZpcm9ubWVudDoge1xuICAgICAgICAgICAgICAgIFwiSVNMT0NBTFwiOiBcImZhbHNlXCIsXG4gICAgICAgICAgICAgICAgXCJhcm5LbXNcIjpwcm9jZXNzLmVudi5hcm5LbXMhISxcbiAgICAgICAgICAgICAgICBcImFybkttc0FsaWFzXCI6cHJvY2Vzcy5lbnYuYXJuS21zQWxpYXMhIVxuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcblxuICAgICAgICBjb25zdCBhcGkgPSBuZXcgYXBpZ2F0ZXdheS5MYW1iZGFSZXN0QXBpKHRoaXMsICdkeW5hbW8taXRlbXMnLCB7XG4gICAgICAgICAgICBoYW5kbGVyOiBkeW5hbW9HZXRJdGVtLFxuICAgICAgICAgICAgZGVmYXVsdENvcnNQcmVmbGlnaHRPcHRpb25zOntcbiAgICAgICAgICAgICAgICBhbGxvd09yaWdpbnM6IGFwaWdhdGV3YXkuQ29ycy5BTExfT1JJR0lOUyxcbiAgICAgICAgICAgICAgICBhbGxvd01ldGhvZHM6IGFwaWdhdGV3YXkuQ29ycy5BTExfTUVUSE9EUyxcbiAgICAgICAgICAgICAgICBhbGxvd0hlYWRlcnM6YXBpZ2F0ZXdheS5Db3JzLkRFRkFVTFRfSEVBREVSU1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGRlcGxveU9wdGlvbnM6e1xuICAgICAgICAgICAgICAgIHN0YWdlTmFtZTondGVzdCdcblxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHByb3h5OiBmYWxzZVxuICAgICAgICB9KTtcblxuICAgICAgICBjb25zdCByb2xlRm9yQ29nbml0byA9IG5ldyBpYW0uUm9sZSh0aGlzLCdSb2xlRm9yQ29nbml0bycse1xuICAgICAgICAgICAgcm9sZU5hbWU6XCJyb2xlRm9yQ29nbml0b1wiLFxuICAgICAgICAgICAgYXNzdW1lZEJ5Om5ldyBpYW0uQ29tcG9zaXRlUHJpbmNpcGFsKG5ldyBpYW0uU2VydmljZVByaW5jaXBhbChcImNvZ25pdG8taWRwLmFtYXpvbmF3cy5jb21cIiksXG4gICAgICAgICAgICBuZXcgaWFtLlNlcnZpY2VQcmluY2lwYWwoXCJsYW1iZGEuYW1hem9uYXdzLmNvbVwiKSksXG4gICAgICAgIG1hbmFnZWRQb2xpY2llczpbaWFtLk1hbmFnZWRQb2xpY3kuZnJvbUF3c01hbmFnZWRQb2xpY3lOYW1lKFwic2VydmljZS1yb2xlL0FXU0xhbWJkYUJhc2ljRXhlY3V0aW9uUm9sZVwiKV1cbiAgICAgICAgfSlcblxuICAgICAgICBjb25zdCByb2xlRm9yQWRtaW5Db2duaXRvQW5kREIgPSBuZXcgaWFtLlJvbGUodGhpcywnUm9sZUZvckFkbWluVXNlcnMnLHtcbiAgICAgICAgICAgcm9sZU5hbWU6XCJSb2xlRm9yQWRtaW5Vc2VyXCIsXG4gICAgICAgICAgIGFzc3VtZWRCeTogbmV3IGlhbS5TZXJ2aWNlUHJpbmNpcGFsKFwibGFtYmRhLmFtYXpvbmF3cy5jb21cIiksXG4gICAgICAgICAgIG1hbmFnZWRQb2xpY2llczpbaWFtLk1hbmFnZWRQb2xpY3kuZnJvbUF3c01hbmFnZWRQb2xpY3lOYW1lKFwic2VydmljZS1yb2xlL0FXU0xhbWJkYUJhc2ljRXhlY3V0aW9uUm9sZVwiKV0sXG4gICAgICAgICAgIGlubGluZVBvbGljaWVzOiB7XG4gICAgICAgICAgICAgICAgICBDb2duaXRvQWRtaW46IG5ldyBpYW0uUG9saWN5RG9jdW1lbnQoe1xuICAgICAgICAgICAgICAgICAgICAgIHN0YXRlbWVudHM6W25ldyBpYW0uUG9saWN5U3RhdGVtZW50KHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgYWN0aW9uczpbJ2NvZ25pdG8taWRwOkFkbWluRGVsZXRlVXNlcicsJ2NvZ25pdG8taWRwOkFkbWluQ3JlYXRlVXNlcicsJ2NvZ25pdG8taWRwOkFkbWluSW5pdGlhdGVBdXRoJywnY29nbml0by1pZHA6QWRtaW5TZXRVc2VyUGFzc3dvcmQnXSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzb3VyY2VzOltcIipcIl0sXG4gICAgICAgICAgICAgICAgICAgICAgICAgIGVmZmVjdDppYW0uRWZmZWN0LkFMTE9XXG4gICAgICAgICAgICAgICAgICAgICAgfSldXG4gICAgICAgICAgICAgICAgICB9KSxcblxuXG4gICAgICAgICAgICAgICAgfVxuXG5cbiAgICAgICAgfSk7XG5cblxuICAgICAgICBjb25zdCBjcmVhdGVTZXJ2ZXJzID0gbmV3IGxhbWJkYS5GdW5jdGlvbih0aGlzLCAnZHluYW1vLWxhbWJkYS1jcmVhdGUtc2VydmVyLWZ1bmN0aW9uJywge1xuICAgICAgICAgICAgZnVuY3Rpb25OYW1lOlwic2FtLWNkay1kYi1jcmVhdGUtc2VydmVyLWZ1bmN0aW9uXCIsXG4gICAgICAgICAgICBydW50aW1lOiBsYW1iZGEuUnVudGltZS5OT0RFSlNfMTRfWCxcbiAgICAgICAgICAgIGhhbmRsZXI6ICd1c2Vycy5jcmVhdGVTZXJ2ZXInLFxuICAgICAgICAgICAgcm9sZTpyb2xlRm9yQWRtaW5Db2duaXRvQW5kREIsXG4gICAgICAgICAgICB0aW1lb3V0OiBjZGsuRHVyYXRpb24ubWludXRlcygxKSxcbiAgICAgICAgICAgIGNvZGU6IGxhbWJkYS5Db2RlLmZyb21Bc3NldChwYXRoLmpvaW4oX19kaXJuYW1lLCAnLi4nLCAndXNlcnMnKSksXG4gICAgICAgICAgICBlbnZpcm9ubWVudDoge1xuICAgICAgICAgICAgICAgIFwiSVNMT0NBTFwiOiBcImZhbHNlXCIsXG4gICAgICAgICAgICAgICAgXCJhcm5LbXNcIjpwcm9jZXNzLmVudi5hcm5LbXMhISxcbiAgICAgICAgICAgICAgICBcImFybkttc0FsaWFzXCI6cHJvY2Vzcy5lbnYuYXJuS21zQWxpYXMhISxcbiAgICAgICAgICAgICAgICBcIlBPT0xfSURcIjpwcm9jZXNzLmVudi5QT09MX0lEISFcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG5cbiAgICAgICAgY29uc3QgbG9naW5Vc2VyID0gbmV3IGxhbWJkYS5GdW5jdGlvbih0aGlzLCAnZHluYW1vLWxhbWJkYS1sb2dpbi11c2VyLWZ1bmN0aW9uJywge1xuICAgICAgICAgICAgZnVuY3Rpb25OYW1lOlwic2FtLWNkay1kYi1sb2dpbi11c2VyLWZ1bmN0aW9uXCIsXG4gICAgICAgICAgICBydW50aW1lOiBsYW1iZGEuUnVudGltZS5OT0RFSlNfMTRfWCxcbiAgICAgICAgICAgIGhhbmRsZXI6ICd1c2Vycy5sb2dpblVzZXInLFxuICAgICAgICAgICAgcm9sZTpyb2xlRm9yQWRtaW5Db2duaXRvQW5kREIsXG4gICAgICAgICAgICB0aW1lb3V0OiBjZGsuRHVyYXRpb24ubWludXRlcygxKSxcbiAgICAgICAgICAgIGNvZGU6IGxhbWJkYS5Db2RlLmZyb21Bc3NldChwYXRoLmpvaW4oX19kaXJuYW1lLCAnLi4nLCAndXNlcnMnKSksXG4gICAgICAgICAgICBlbnZpcm9ubWVudDoge1xuICAgICAgICAgICAgICAgIFwiSVNMT0NBTFwiOiBcImZhbHNlXCIsXG4gICAgICAgICAgICAgICAgXCJhcm5LbXNcIjpwcm9jZXNzLmVudi5hcm5LbXMhISxcbiAgICAgICAgICAgICAgICBcImFybkttc0FsaWFzXCI6cHJvY2Vzcy5lbnYuYXJuS21zQWxpYXMhISxcbiAgICAgICAgICAgICAgICBcIlBPT0xfSURcIjpwcm9jZXNzLmVudi5QT09MX0lEISEsXG4gICAgICAgICAgICAgICAgXCJzdWJcIjpcInJlcGxhY2UtY29nbml0by1zdWJcIixcbiAgICAgICAgICAgICAgICBcIkNMSUVOVF9JRFwiOnByb2Nlc3MuZW52LkNMSUVOVF9JRCEhXG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuXG5cblxuICAgICAgICBjb25zdCBjb2duaXRvVHJpZ2dlciA9IG5ldyBsYW1iZGEuRnVuY3Rpb24odGhpcywgJ2NvZ25pdG8tdHJpZ2dlcicsIHtcbiAgICAgICAgICAgIGZ1bmN0aW9uTmFtZTpcInNhbS1jZGstZGItY29nbml0by10cmlnZ2VyXCIsXG4gICAgICAgICAgICByb2xlOiByb2xlRm9yQ29nbml0byxcbiAgICAgICAgICAgIHJ1bnRpbWU6IGxhbWJkYS5SdW50aW1lLk5PREVKU18xNF9YLFxuICAgICAgICAgICAgaGFuZGxlcjogJ3RyaWdnZXJDb2duaXRvLm1haW4nLFxuICAgICAgICAgICAgdGltZW91dDogY2RrLkR1cmF0aW9uLm1pbnV0ZXMoMSksXG4gICAgICAgICAgICBjb2RlOiBsYW1iZGEuQ29kZS5mcm9tQXNzZXQocGF0aC5qb2luKF9fZGlybmFtZSwgJy4uJywgJ3RyaWdnZXInKSksXG4gICAgICAgICAgICBlbnZpcm9ubWVudDoge1xuICAgICAgICAgICAgICAgIFwiSVNMT0NBTFwiOiBcImZhbHNlXCIsXG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGNvbnN0IGFkbWluVXNlckNvZ25pdG8gPSBuZXcgbGFtYmRhLkZ1bmN0aW9uKHRoaXMsJ2FkbWluLXVzZXItY29nbml0bzpxLWRiJyx7XG4gICAgICAgICAgICBmdW5jdGlvbk5hbWU6J3NhbS1jZGstZGItcmVtb3ZlLXVzZXItY29nbml0bycsXG4gICAgICAgICAgICByb2xlOiByb2xlRm9yQWRtaW5Db2duaXRvQW5kREIsXG4gICAgICAgICAgICBydW50aW1lOiBsYW1iZGEuUnVudGltZS5OT0RFSlNfMTRfWCxcbiAgICAgICAgICAgIGhhbmRsZXI6J3VzZXJzLnJlbW92ZVVzZXInLFxuICAgICAgICAgICAgdGltZW91dDpjZGsuRHVyYXRpb24ubWludXRlcygxKSxcbiAgICAgICAgICAgIGNvZGU6bGFtYmRhLkNvZGUuZnJvbUFzc2V0KHBhdGguam9pbihfX2Rpcm5hbWUsJy4uJywndXNlcnMnKSksXG4gICAgICAgICAgICBlbnZpcm9ubWVudDoge1xuICAgICAgICAgICAgICAgIFwiUE9PTF9JRFwiOiBwcm9jZXNzLmVudi5QT09MX0lEISEsXG4gICAgICAgICAgICAgICAgXCJVU0VSTkFNRVwiOlwicmVwbGFjZS11c2VybmVtZS1jb2duaXRvXCJcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSlcblxuICAgICAgICBjb25zdCBmbkdldFVzZXJzID0gbmV3IGxhbWJkYS5GdW5jdGlvbih0aGlzLCdkeW5hbW8tbGFtYmRhLWdldC11c2Vycy1mdW5jdGlvbicse1xuICAgICAgICAgICAgZnVuY3Rpb25OYW1lOidzYW0tY2RrLWRiLWdldC1hbGwtdXNlcnMnLFxuICAgICAgICAgICAgcm9sZTogcm9sZUZvckFkbWluQ29nbml0b0FuZERCLFxuICAgICAgICAgICAgcnVudGltZTogbGFtYmRhLlJ1bnRpbWUuTk9ERUpTXzE0X1gsXG4gICAgICAgICAgICBoYW5kbGVyOid1c2Vycy5nZXRVc2VycycsXG4gICAgICAgICAgICB0aW1lb3V0OmNkay5EdXJhdGlvbi5taW51dGVzKDEpLFxuICAgICAgICAgICAgY29kZTpsYW1iZGEuQ29kZS5mcm9tQXNzZXQocGF0aC5qb2luKF9fZGlybmFtZSwnLi4nLCd1c2VycycpKSxcbiAgICAgICAgICAgIGVudmlyb25tZW50OiB7XG4gICAgICAgICAgICAgICAgXCJVU0VSTkFNRVwiOlwicmVwbGFjZS11c2VybmVtZS1jb2duaXRvXCJcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG5cbiAgICAgICAgY29uc3QgZm5HZXRVU2VydmVycyA9IG5ldyBsYW1iZGEuRnVuY3Rpb24odGhpcywnZHluYW1vLWxhbWJkYS1nZXQtc2VydmVycy1mdW5jdGlvbicse1xuICAgICAgICAgICAgZnVuY3Rpb25OYW1lOidzYW0tY2RrLWRiLWdldC1hbGwtc2VydmVycycsXG4gICAgICAgICAgICByb2xlOiByb2xlRm9yQWRtaW5Db2duaXRvQW5kREIsXG4gICAgICAgICAgICBydW50aW1lOiBsYW1iZGEuUnVudGltZS5OT0RFSlNfMTRfWCxcbiAgICAgICAgICAgIGhhbmRsZXI6J3VzZXJzLmdldFNlcnZlcnMnLFxuICAgICAgICAgICAgdGltZW91dDpjZGsuRHVyYXRpb24ubWludXRlcygxKSxcbiAgICAgICAgICAgIGNvZGU6bGFtYmRhLkNvZGUuZnJvbUFzc2V0KHBhdGguam9pbihfX2Rpcm5hbWUsJy4uJywndXNlcnMnKSksXG4gICAgICAgICAgICBlbnZpcm9ubWVudDoge1xuICAgICAgICAgICAgICAgIFwiVVNFUk5BTUVcIjpcInJlcGxhY2UtdXNlcm5lbWUtY29nbml0b1wiXG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGNvbnN0IGZuR2V0Um9sZXMgPSBuZXcgbGFtYmRhLkZ1bmN0aW9uKHRoaXMsJ2R5bmFtby1sYW1iZGEtZ2V0LXJvbGVzLWZ1bmN0aW9uJyx7XG4gICAgICAgICAgICBmdW5jdGlvbk5hbWU6J3NhbS1jZGstZGItZ2V0LXJvbGVzJyxcbiAgICAgICAgICAgIHJvbGU6IHJvbGVGb3JBZG1pbkNvZ25pdG9BbmREQixcbiAgICAgICAgICAgIHJ1bnRpbWU6IGxhbWJkYS5SdW50aW1lLk5PREVKU18xNF9YLFxuICAgICAgICAgICAgaGFuZGxlcjoncm9sZXMub2J0YWluUm9sZXMnLFxuICAgICAgICAgICAgdGltZW91dDogY2RrLkR1cmF0aW9uLm1pbnV0ZXMoMSksXG4gICAgICAgICAgICBjb2RlOmxhbWJkYS5Db2RlLmZyb21Bc3NldChwYXRoLmpvaW4oX19kaXJuYW1lLCcuLicsJ3VzZXJzJykpXG4gICAgICAgIH0pXG5cbiAgICAgICAgY29uc3QgZm5BY2Nlc3NHcm91cCA9IG5ldyBsYW1iZGEuRnVuY3Rpb24odGhpcywnZHluYW1vLWxhbWJkYS1nZXQtYWNjZXNzLWdyb3VwLWZ1bmN0aW9uJyx7XG4gICAgICAgICAgIGZ1bmN0aW9uTmFtZTonc2FtLWNkay1kYi1nZXQtYWNjZXNzR3JvdXAnLFxuICAgICAgICAgICByb2xlOiByb2xlRm9yQWRtaW5Db2duaXRvQW5kREIsXG4gICAgICAgICAgIHJ1bnRpbWU6IGxhbWJkYS5SdW50aW1lLk5PREVKU18xNF9YLFxuICAgICAgICAgICBoYW5kbGVyOidyb2xlcy5vYnRhaW5BY2Nlc3NHcm91cHMnLFxuICAgICAgICAgICB0aW1lb3V0OmNkay5EdXJhdGlvbi5taW51dGVzKDEpLFxuICAgICAgICAgICBjb2RlOmxhbWJkYS5Db2RlLmZyb21Bc3NldChwYXRoLmpvaW4oX19kaXJuYW1lLCcuLicsJ3VzZXJzJykpXG4gICAgICAgIH0pO1xuXG4gICAgICAgIGNvbnN0IGZuQXNzaWduUm9sZXMgPSBuZXcgbGFtYmRhLkZ1bmN0aW9uKHRoaXMsICdkeW5hbW9kby1sYW1iZGEtYXNzaWduLXJvbGUtZnVuY3Rpb24nLHtcbiAgICAgICAgICAgZnVuY3Rpb25OYW1lOidzYW0tY2RrLXNiLWFzc2lnbi1yb2xlJyxcbiAgICAgICAgICAgcm9sZTogcm9sZUZvckFkbWluQ29nbml0b0FuZERCLFxuICAgICAgICAgICBydW50aW1lOiBsYW1iZGEuUnVudGltZS5OT0RFSlNfMTRfWCxcbiAgICAgICAgICAgaGFuZGxlcjoncm9sZXMuYXNzc2luZ1JvbGVzJyxcbiAgICAgICAgICAgdGltZW91dDpjZGsuRHVyYXRpb24ubWludXRlcygxKSxcbiAgICAgICAgICAgY29kZTpsYW1iZGEuQ29kZS5mcm9tQXNzZXQocGF0aC5qb2luKF9fZGlybmFtZSwnLi4nLCd1c2VycycpKVxuICAgICAgICB9KTtcblxuICAgICAgICBjb25zdCBiYXRjaFVwZGF0ZSA9IG5ldyBsYW1iZGEuRnVuY3Rpb24odGhpcywnZHluYW1vLWxhbWJkYS1iYXRjaC11cGRhdGUtZnVuY3Rpb24nLHtcbiAgICAgICAgICAgIGZ1bmN0aW9uTmFtZTonc2FtLWNkay1kYi1iYXRjaC11cGRhdGUnLFxuICAgICAgICAgICAgcnVudGltZTpsYW1iZGEuUnVudGltZS5OT0RFSlNfMTRfWCxcbiAgICAgICAgICAgIGhhbmRsZXI6J2JhdGNoLmJhdGNoVXBkYXRlJyxcbiAgICAgICAgICAgIHRpbWVvdXQ6Y2RrLkR1cmF0aW9uLm1pbnV0ZXMoNSksXG4gICAgICAgICAgICBjb2RlOmxhbWJkYS5Db2RlLmZyb21Bc3NldChwYXRoLmpvaW4oX19kaXJuYW1lLCcuLicsJ2R5bmFtby1pdGVtcycpLHtcbiAgICAgICAgICAgICAgICBleGNsdWRlOltcIm5vZGVfbW9kdWxlc1wiXVxuICAgICAgICAgICAgfSlcbiAgICAgICAgfSlcbiAgICAgICAgdGFibGUuZ3JhbnRSZWFkV3JpdGVEYXRhKGR5bmFtb0luc2VydEl0ZW0pO1xuICAgICAgICB0YWJsZS5ncmFudFJlYWRXcml0ZURhdGEoZHluYW1vVXBkYXRlSXRlbSk7XG4gICAgICAgIHRhYmxlLmdyYW50UmVhZERhdGEoZHluYW1vR2V0SXRlbSk7XG4gICAgICAgIHRhYmxlLmdyYW50UmVhZERhdGEoZHluYW1vU2VhcmNoSXRlbSk7XG4gICAgICAgIHRhYmxlLmdyYW50UmVhZERhdGEoZHluYW1vR2V0Q291bnRyeVR5cGUpO1xuICAgICAgICB0YWJsZS5ncmFudFJlYWRXcml0ZURhdGEocm9sZUZvckFkbWluQ29nbml0b0FuZERCKTtcbiAgICAgICAgdGFibGUuZ3JhbnRSZWFkV3JpdGVEYXRhKGJhdGNoVXBkYXRlKTtcbiAgICAgICAgdXNlcnNUYWJsZS5ncmFudFJlYWREYXRhKGZuR2V0VXNlcnMpO1xuICAgICAgICB1c2Vyc1RhYmxlLmdyYW50UmVhZERhdGEoZm5HZXRVU2VydmVycyk7XG4gICAgICAgIHVzZXJzVGFibGUuZ3JhbnRSZWFkV3JpdGVEYXRhKHJvbGVGb3JDb2duaXRvKTtcbiAgICAgICAgdXNlcnNUYWJsZS5ncmFudFJlYWRXcml0ZURhdGEocm9sZUZvckFkbWluQ29nbml0b0FuZERCKTtcbiAgICAgICAgcm9sZXNUYWJsZS5ncmFudFJlYWRXcml0ZURhdGEocm9sZUZvckFkbWluQ29nbml0b0FuZERCKTtcbiAgICAgICAgdXNlcnNUYWJsZS5ncmFudFJlYWREYXRhKGR5bmFtb0luc2VydEl0ZW0pO1xuICAgICAgICBjb25zdCBpdGVtc1Jvb3RSZXNvdXJjZSA9IGFwaS5yb290LmFkZFJlc291cmNlKCdpdGVtcycpXG4gICAgICAgIGNvbnN0IHVzZXJSb290UmVzb3VyY2UgPSBhcGkucm9vdC5hZGRSZXNvdXJjZSgndXNlcnMnKVxuXG5cbiAgICAgICAgY29uc3QgcG9vbENvZ25pdG8gPSBjb2duaXRvLlVzZXJQb29sLmZyb21Vc2VyUG9vbElkKHRoaXMsXCJwb29sLWlkXCIscHJvY2Vzcy5lbnYuUE9PTF9JRCEhKTtcblxuICAgICAgICBsZXQgYXV0aD11bmRlZmluZWQ7XG4gICAgICAgIGlmICghcHJvY2Vzcy5lbnYuSVNfTE9DQUwpXG4gICAgICAgICBhdXRoID0gbmV3IGFwaWdhdGV3YXkuQ29nbml0b1VzZXJQb29sc0F1dGhvcml6ZXIodGhpcywnY29nbml0by1hdXRob3JpemVyJyx7XG4gICAgICAgICAgIGNvZ25pdG9Vc2VyUG9vbHM6W3Bvb2xDb2duaXRvXSxcbiAgICAgICAgICAgYXV0aG9yaXplck5hbWU6XCJhdXRob3JpemVyLXBvb2xcIixcbiAgICAgICAgICAgaWRlbnRpdHlTb3VyY2U6YXBpZ2F0ZXdheS5JZGVudGl0eVNvdXJjZS5oZWFkZXIoJ0F1dGhvcml6YXRpb24nKVxuICAgICAgICB9KTtcblxuXG4gICAgICAgIGl0ZW1zUm9vdFJlc291cmNlLmFkZE1ldGhvZCgnUE9TVCcsIG5ldyBhcGlnYXRld2F5LkxhbWJkYUludGVncmF0aW9uKGR5bmFtb0luc2VydEl0ZW0pLHtcbiAgICAgICAgICAgIGF1dGhvcml6ZXI6IGF1dGhcbiAgICAgICAgfSlcbiAgICAgICAgaXRlbXNSb290UmVzb3VyY2UuYWRkTWV0aG9kKCdQVVQnLCBuZXcgYXBpZ2F0ZXdheS5MYW1iZGFJbnRlZ3JhdGlvbihkeW5hbW9VcGRhdGVJdGVtKSx7XG4gICAgICAgICAgICBhdXRob3JpemVyOiBhdXRoXG4gICAgICAgIH0pO1xuICAgICAgICBpdGVtc1Jvb3RSZXNvdXJjZS5hZGRNZXRob2QoJ0RFTEVURScsIG5ldyBhcGlnYXRld2F5LkxhbWJkYUludGVncmF0aW9uKGR5bmFtb1JlbW92ZUl0ZW0pLHtcbiAgICAgICAgICAgIGF1dGhvcml6ZXI6IGF1dGhcbiAgICAgICAgfSk7XG4gICAgICAgIHVzZXJSb290UmVzb3VyY2UuYWRkTWV0aG9kKCdQT1NUJyxuZXcgYXBpZ2F0ZXdheS5MYW1iZGFJbnRlZ3JhdGlvbihjcmVhdGVTZXJ2ZXJzKSx7XG4gICAgICAgICAgICBhdXRob3JpemVyOiBhdXRoXG4gICAgICAgIH0pXG4gICAgICAgIHVzZXJSb290UmVzb3VyY2UuYWRkTWV0aG9kKCdHRVQnLG5ldyBhcGlnYXRld2F5LkxhbWJkYUludGVncmF0aW9uKGZuR2V0VXNlcnMpLHtcbiAgICAgICAgICAgIGF1dGhvcml6ZXI6YXV0aFxuICAgICAgICB9KVxuICAgICAgICBjb25zdCBzZXJ2ZXJSZXNvdXJjZSA9IHVzZXJSb290UmVzb3VyY2UuYWRkUmVzb3VyY2UoXCJzZXJ2ZXJzXCIpO1xuICAgICAgICBjb25zdCByb2xlc1Jlc291cmNlID0gdXNlclJvb3RSZXNvdXJjZS5hZGRSZXNvdXJjZShcInJvbGVzXCIpO1xuXG4gICAgICAgIGNvbnN0IGFzc2luZ1JvbGVSZXNvdXJjZT0gcm9sZXNSZXNvdXJjZS5hZGRSZXNvdXJjZShcImFzc2lnblwiKTtcbiAgICAgICAgY29uc3QgaXRlbVN1YlJlc291cmNlcyA9IGl0ZW1zUm9vdFJlc291cmNlLmFkZFJlc291cmNlKCd7aXRlbUlkfScpO1xuICAgICAgICBjb25zdCBxdWVyeVJlc291cmNlID0gaXRlbXNSb290UmVzb3VyY2UuYWRkUmVzb3VyY2UoJ3F1ZXJ5Jyk7XG4gICAgICAgIGNvbnN0IHNlYXJjaFJlc291cmNlID0gaXRlbXNSb290UmVzb3VyY2UuYWRkUmVzb3VyY2UoJ3NlYXJjaCcpO1xuICAgICAgICBjb25zdCBjb3VudHJ5UXVlcnlSZXNvdXJjZSA9IHF1ZXJ5UmVzb3VyY2UuYWRkUmVzb3VyY2UoJ3tjb3VudHJ5fScpO1xuICAgICAgICBjb25zdCBjb3VudHJ5QW5kVHlwZVJlc291cmNlID0gY291bnRyeVF1ZXJ5UmVzb3VyY2UuYWRkUmVzb3VyY2UoJ3t0eXBlfScpO1xuICAgICAgICBjb25zdCBhY2Nlc3NHcm91cHNSZXNvdXJjZSA9IGl0ZW1zUm9vdFJlc291cmNlLmFkZFJlc291cmNlKCdhY2Nlc3NHcm91cCcpO1xuICAgICAgICBjb3VudHJ5QW5kVHlwZVJlc291cmNlLmFkZE1ldGhvZCgnR0VUJywgbmV3IGFwaWdhdGV3YXkuTGFtYmRhSW50ZWdyYXRpb24oZHluYW1vR2V0Q291bnRyeVR5cGUpLHtcbiAgICAgICAgICAgIGF1dGhvcml6ZXI6YXV0aFxuICAgICAgICB9KVxuICAgICAgICBpdGVtU3ViUmVzb3VyY2VzLmFkZE1ldGhvZCgnR0VUJywgbmV3IGFwaWdhdGV3YXkuTGFtYmRhSW50ZWdyYXRpb24oZHluYW1vR2V0SXRlbSkse1xuICAgICAgICAgICAgYXV0aG9yaXplcjphdXRoXG4gICAgICAgIH0pXG4gICAgICAgIHNlYXJjaFJlc291cmNlLmFkZE1ldGhvZCgnUE9TVCcsIG5ldyBhcGlnYXRld2F5LkxhbWJkYUludGVncmF0aW9uKGR5bmFtb1NlYXJjaEl0ZW0pLHtcbiAgICAgICAgICAgIGF1dGhvcml6ZXI6YXV0aFxuICAgICAgICB9KTtcbiAgICAgICAgc2VydmVyUmVzb3VyY2UuYWRkTWV0aG9kKCdHRVQnLG5ldyBhcGlnYXRld2F5LkxhbWJkYUludGVncmF0aW9uKGZuR2V0VVNlcnZlcnMpLHtcbiAgICAgICAgICAgIGF1dGhvcml6ZXI6YXV0aFxuICAgICAgICB9KTtcbiAgICAgICAgcm9sZXNSZXNvdXJjZS5hZGRNZXRob2QoJ0dFVCcsbmV3IGFwaWdhdGV3YXkuTGFtYmRhSW50ZWdyYXRpb24oZm5HZXRSb2xlcykse1xuICAgICAgICAgICAgYXV0aG9yaXplcjogYXV0aFxuICAgICAgICB9KVxuICAgICAgICBhY2Nlc3NHcm91cHNSZXNvdXJjZS5hZGRNZXRob2QoJ0dFVCcsbmV3IGFwaWdhdGV3YXkuTGFtYmRhSW50ZWdyYXRpb24oZm5BY2Nlc3NHcm91cCkse1xuICAgICAgICAgICAgYXV0aG9yaXplcjogYXV0aFxuICAgICAgICB9KVxuXG4gICAgICAgIGFzc2luZ1JvbGVSZXNvdXJjZS5hZGRNZXRob2QoJ1BPU1QnLG5ldyBhcGlnYXRld2F5LkxhbWJkYUludGVncmF0aW9uKGZuQXNzaWduUm9sZXMpLHtcbiAgICAgICAgICAgIGF1dGhvcml6ZXI6IGF1dGhcbiAgICAgICAgfSlcbiAgICB9XG5cbn1cbiJdfQ==