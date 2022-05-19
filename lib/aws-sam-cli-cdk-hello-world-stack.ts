import * as cdk from '@aws-cdk/core';
import {RemovalPolicy} from '@aws-cdk/core';
import * as lambda from '@aws-cdk/aws-lambda';
import * as dynamodb from '@aws-cdk/aws-dynamodb';
import * as apigateway from '@aws-cdk/aws-apigateway';
import * as iam from '@aws-cdk/aws-iam';
import * as ec2 from '@aws-cdk/aws-ec2';
import * as path from 'path';
import * as cognito from '@aws-cdk/aws-cognito';
import * as events from '@aws-cdk/aws-events';
import * as targets from "@aws-cdk/aws-events-targets";
export class AwsSamCliCdkHelloWorldStack extends cdk.Stack {
    constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);


        const vpc = new ec2.Vpc(this, 'tdms-vpc', {
            vpcName: 'tdms-vpc',
            cidr: '10.0.0.0/16',
            natGateways: 1,
            maxAzs: 2,
            subnetConfiguration: [{
                subnetType: ec2.SubnetType.PRIVATE_WITH_NAT,
                name: 'tdms-private-subnet',
                cidrMask: 24
            }, {
                subnetType: ec2.SubnetType.PUBLIC,
                name: 'tdms-public-subnet',
                cidrMask: 24
            }]

        });

        const dynamoGateway = vpc.addGatewayEndpoint('tdms-dynamo-gateway', {
            service: ec2.GatewayVpcEndpointAwsService.DYNAMODB,
            subnets: [{
                subnetType: ec2.SubnetType.PRIVATE_WITH_NAT
            }]
        });


        const lambdaSG = new ec2.SecurityGroup(this, 'tdms-sg', {
            securityGroupName: 'lambda-sg',
            vpc: vpc
        });

        const interfaceKMSSG = new ec2.SecurityGroup(this, 'tdms-kms-sg', {
            securityGroupName: 'tdms-kms-sg',
            vpc: vpc
        });
        const awsInterfaceKMS = vpc.addInterfaceEndpoint('tdms-kms-interface', {
            service: ec2.InterfaceVpcEndpointAwsService.KMS,
            subnets: vpc.selectSubnets({subnetType: ec2.SubnetType.PRIVATE_WITH_NAT}),
            securityGroups: [interfaceKMSSG]
        });

        /*
        const awsInterfaceAPIGW = vpc.addInterfaceEndpoint('tdms-apigw-interface', {
            service: ec2.InterfaceVpcEndpointAwsService.APIGATEWAY,
            subnets: vpc.selectSubnets({subnetType: ec2.SubnetType.PRIVATE_WITH_NAT}),
            securityGroups: [apiGTWSG],
            privateDnsEnabled: false
        });
*/
        interfaceKMSSG.addIngressRule(lambdaSG, ec2.Port.tcp(443));

        lambdaSG.addEgressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(443));

        const accountsTable = new dynamodb.Table(this, 'AccountsCollection', {
            partitionKey: {name: 'pk', type: dynamodb.AttributeType.STRING},
            sortKey: {name: 'country', type: dynamodb.AttributeType.STRING},
            billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,

            tableName: 'AccountsCollection',
            removalPolicy: RemovalPolicy.DESTROY,

            timeToLiveAttribute: "ttl"
        });

        accountsTable.addGlobalSecondaryIndex({
            indexName: 'CountryTypeItemIndex',
            partitionKey: {name: 'country', type: dynamodb.AttributeType.STRING},
            sortKey: {name: 'typeItem', type: dynamodb.AttributeType.STRING},
            projectionType: dynamodb.ProjectionType.ALL,
        });


        accountsTable.addGlobalSecondaryIndex({
            indexName: 'TypeItemCountryIndex',
            partitionKey: {name: 'typeItem', type: dynamodb.AttributeType.STRING},
            sortKey: {name: 'country', type: dynamodb.AttributeType.STRING},
            projectionType: dynamodb.ProjectionType.ALL
        })

        const usersTable = new dynamodb.Table(this, 'UsersTable', {
            partitionKey: {name: 'pk', type: dynamodb.AttributeType.STRING},
            sortKey: {name: 'sk', type: dynamodb.AttributeType.STRING},
            billingMode: dynamodb.BillingMode.PROVISIONED,
            readCapacity: 10,
            tableName: 'UsersCollection',
            removalPolicy: RemovalPolicy.DESTROY,
            writeCapacity: 10
        });
        usersTable.addGlobalSecondaryIndex({
            indexName: "index_sk_and_type",
            partitionKey: {name: 'sk', type: dynamodb.AttributeType.STRING},
            sortKey: {name: "typeItem", type: dynamodb.AttributeType.STRING},
            readCapacity: 10,
            writeCapacity: 10,
            projectionType: dynamodb.ProjectionType.ALL
        })

        const rolesTable = new dynamodb.Table(this, 'RolesTable', {
            partitionKey: {name: 'pk', type: dynamodb.AttributeType.STRING},
            sortKey: {name: 'sk', type: dynamodb.AttributeType.STRING},
            billingMode: dynamodb.BillingMode.PROVISIONED,
            readCapacity: 10,
            tableName: 'RolesAccessCollection',
            removalPolicy: RemovalPolicy.DESTROY,
            writeCapacity: 10
        });

        rolesTable.addGlobalSecondaryIndex({
            indexName: "index_by_typeItem",
            partitionKey: {name: 'typeItem', type: dynamodb.AttributeType.STRING},
            sortKey: {name: "sk", type: dynamodb.AttributeType.STRING},
            projectionType: dynamodb.ProjectionType.ALL,
            readCapacity: 10,
            writeCapacity: 10
        })
        const auditTable = new dynamodb.Table(this, 'AuditTable', {
            partitionKey: {name: 'pk', type: dynamodb.AttributeType.STRING},
            sortKey: {name: 'sk', type: dynamodb.AttributeType.STRING},
            billingMode: dynamodb.BillingMode.PROVISIONED,
            readCapacity: 5,
            tableName: 'AuditCollection',
            removalPolicy: RemovalPolicy.DESTROY,
            writeCapacity: 5
        });

        auditTable.addGlobalSecondaryIndex({
            indexName: "index_by_action_date",
            partitionKey: {name: 'action', type: dynamodb.AttributeType.STRING},
            sortKey: {name: "sk", type: dynamodb.AttributeType.STRING},
            projectionType: dynamodb.ProjectionType.ALL,
            readCapacity: 5,
            writeCapacity: 5
        })


        auditTable.addGlobalSecondaryIndex({
            indexName: "index_by_itemPk",
            partitionKey: {name: 'itemPk', type: dynamodb.AttributeType.STRING},
            sortKey: {name: "sk", type: dynamodb.AttributeType.STRING},
            projectionType: dynamodb.ProjectionType.ALL,
            readCapacity: 5,
            writeCapacity: 5
        })


        const dynamoInsertItem = new lambda.Function(this, 'dynamo-lambda-insert-function', {

            vpc: vpc,

            securityGroups: [lambdaSG],
            vpcSubnets: {
                subnetType: ec2.SubnetType.PRIVATE_WITH_NAT
            },
            functionName: "tdms-db-insert-function",
            runtime: lambda.Runtime.NODEJS_14_X,
            handler: 'insert.handler',
            environment: {
                "ISLOCAL": "false",
                "arnKms": process.env.arnKms!!,
                "arnKmsAlias": process.env.arnKmsAlias!!
            },

            timeout: cdk.Duration.minutes(1),
            code: lambda.Code.fromAsset(path.join(__dirname, '..', 'dynamo-items')),
        });


        const dynamoUpdateItem = new lambda.Function(this, 'dynamo-lambda-update-function', {
            vpc: vpc,
            securityGroups: [lambdaSG],
            vpcSubnets: {
                subnetType: ec2.SubnetType.PRIVATE_WITH_NAT
            },
            runtime: lambda.Runtime.NODEJS_14_X,
            functionName: "tdms-db-update-function",
            handler: 'update.handler',
            environment: {
                "ISLOCAL": "false",
                "arnKms": process.env.arnKms!!,
                "arnKmsAlias": process.env.arnKmsAlias!!
            },
            timeout: cdk.Duration.minutes(1),
            code: lambda.Code.fromAsset(path.join(__dirname, '..', 'dynamo-items')),
        });


        const dynamoGetItem = new lambda.Function(this, 'dynamo-lambda-get-function', {

            vpc: vpc,
            securityGroups: [lambdaSG],
            vpcSubnets: {
                subnetType: ec2.SubnetType.PRIVATE_WITH_NAT
            },
            functionName: "tdms-db-get-function",
            runtime: lambda.Runtime.NODEJS_14_X,
            handler: 'get.handler',
            environment: {
                "ISLOCAL": "false"
            },
            timeout: cdk.Duration.minutes(1),
            code: lambda.Code.fromAsset(path.join(__dirname, '..', 'dynamo-items')),
        });

        const dynamoGetCountryType = new lambda.Function(this, 'dynamo-lambda-get-by-country-type-function', {
            functionName: "tdms-db-get-by-country-type-function",
            runtime: lambda.Runtime.NODEJS_14_X,
            vpc: vpc,
            securityGroups: [lambdaSG],
            vpcSubnets: {
                subnetType: ec2.SubnetType.PRIVATE_WITH_NAT
            },
            handler: 'get.handlerCountryType',
            environment: {
                "ISLOCAL": "false",
                "arnKms": process.env.arnKms!!,
                "arnKmsAlias": process.env.arnKmsAlias!!,
                AWS_NODEJS_CONNECTION_REUSE_ENABLED: '1'
            },
            timeout: cdk.Duration.minutes(1),
            code: lambda.Code.fromAsset(path.join(__dirname, '..', 'dynamo-items'))

        });
        /*
        dynamoGetCountryType.currentVersion.addAlias('latest',{
            provisionedConcurrentExecutions:2
        });
*/
        const dynamoRemoveItem = new lambda.Function(this, 'dynamo-lambda-remove-item-function', {
            functionName: "tdms-db-remove-item-function",
            vpc: vpc,
            securityGroups: [lambdaSG],
            vpcSubnets: {
                subnetType: ec2.SubnetType.PRIVATE_WITH_NAT
            },
            runtime: lambda.Runtime.NODEJS_14_X,
            handler: 'remove.removeFn',
            timeout: cdk.Duration.minutes(1),
            environment: {
                "ISLOCAL": "false"
            },
            code: lambda.Code.fromAsset(path.join(__dirname, '..', 'dynamo-items'))

        });
        const dynamoSearchItem = new lambda.Function(this, 'dynamo-lambda-search-item-function', {
            functionName: "tdms-db-search-item-function",

            vpc: vpc,
            securityGroups: [lambdaSG],
            vpcSubnets: {
                subnetType: ec2.SubnetType.PRIVATE_WITH_NAT
            },
            runtime: lambda.Runtime.NODEJS_14_X,
            handler: 'search.searchHandler',
            timeout: cdk.Duration.minutes(1),
            code: lambda.Code.fromAsset(path.join(__dirname, '..', 'dynamo-items')),
            environment: {
                "ISLOCAL": "false",
                "arnKms": process.env.arnKms!!,
                "arnKmsAlias": process.env.arnKmsAlias!!,
                AWS_NODEJS_CONNECTION_REUSE_ENABLED: '1'
            }
        });

        const lambdaAPIGTW = new lambda.Function(this, 'tdms-api-gateway-function', {
            functionName: "tdms-api-gateway-function",
            runtime: lambda.Runtime.NODEJS_14_X,
            vpc: vpc,
            securityGroups: [lambdaSG],
            vpcSubnets: {
                subnetType: ec2.SubnetType.PRIVATE_WITH_NAT
            },
            handler: 'vpc.vpcAPIGW',
            timeout: cdk.Duration.minutes(1),
            code: lambda.Code.fromAsset(path.join(__dirname, '..', 'dynamo-items')),
        });
        const api = new apigateway.LambdaRestApi(this, 'tdms', {
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

        const apiServer = new apigateway.LambdaRestApi(this, 'tdms-servers', {
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
            assumedBy: new iam.CompositePrincipal(new iam.ServicePrincipal("cognito-idp.amazonaws.com"),
                new iam.ServicePrincipal("lambda.amazonaws.com")),
            managedPolicies: [iam.ManagedPolicy.fromAwsManagedPolicyName("service-role/AWSLambdaBasicExecutionRole")]
        });

        const roleForAdminCognitoAndDB = new iam.Role(this, 'RoleForAdminUsers', {
            roleName: "RoleForAdminUser",
            assumedBy: new iam.ServicePrincipal("lambda.amazonaws.com"),
            managedPolicies: [//iam.ManagedPolicy.fromAwsManagedPolicyName("service-role/AWSLambdaBasicExecutionRole"),
                iam.ManagedPolicy.fromAwsManagedPolicyName("service-role/AWSLambdaVpcAccessExecutionRole")
            ],
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

        const roleForAdminVPCAndDB = new iam.Role(this, 'RoleForVPCDB', {
            roleName: "RoleForAdminVPCDBUser",
            assumedBy: new iam.ServicePrincipal("lambda.amazonaws.com"),
            managedPolicies: [iam.ManagedPolicy.fromAwsManagedPolicyName("service-role/AWSLambdaVpcAccessExecutionRole")],
        });


        const createServers = new lambda.Function(this, 'dynamo-lambda-create-server-function', {
            functionName: "tdms-db-create-server-function",
            runtime: lambda.Runtime.NODEJS_14_X,
            handler: 'users.createServer',
            vpc: vpc,
            securityGroups: [lambdaSG],
            vpcSubnets: {
                subnetType: ec2.SubnetType.PRIVATE_WITH_NAT
            },
            role: roleForAdminCognitoAndDB,
            timeout: cdk.Duration.minutes(1),
            code: lambda.Code.fromAsset(path.join(__dirname, '..', 'users')),
            environment: {
                "ISLOCAL": "false",
                "arnKms": process.env.arnKms!!,
                "arnKmsAlias": process.env.arnKmsAlias!!,
                "POOL_ID": process.env.POOL_ID!!
            }
        });

        const loginUser = new lambda.Function(this, 'dynamo-lambda-login-user-function', {
            functionName: "tdms-db-login-user-function",
            runtime: lambda.Runtime.NODEJS_14_X,
            handler: 'users.loginUser',
            role: roleForAdminCognitoAndDB,
            timeout: cdk.Duration.minutes(1),
            code: lambda.Code.fromAsset(path.join(__dirname, '..', 'users')),
            environment: {
                "ISLOCAL": "false",
                "arnKms": process.env.arnKms!!,
                "arnKmsAlias": process.env.arnKmsAlias!!,
                "POOL_ID": process.env.POOL_ID!!,
                "sub": "replace-cognito-sub",
                "CLIENT_ID": process.env.CLIENT_ID!!
            }
        });


        const cognitoTrigger = new lambda.Function(this, 'cognito-trigger', {
            functionName: "tdms-db-cognito-trigger",
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
            functionName: 'tdms-db-remove-user-cognito',
            role: roleForAdminCognitoAndDB,
            runtime: lambda.Runtime.NODEJS_14_X,
            handler: 'users.removeUser',
            timeout: cdk.Duration.minutes(1),
            code: lambda.Code.fromAsset(path.join(__dirname, '..', 'users')),
            environment: {
                "POOL_ID": process.env.POOL_ID!!,
                "USERNAME": "replace-userneme-cognito"
            }
        });

        const fnGetUsers = new lambda.Function(this, 'dynamo-lambda-get-users-function', {
            functionName: 'tdms-db-get-all-users',
            role: roleForAdminCognitoAndDB,
            vpc: vpc,
            securityGroups: [lambdaSG],
            vpcSubnets: {
                subnetType: ec2.SubnetType.PRIVATE_WITH_NAT
            },
            runtime: lambda.Runtime.NODEJS_14_X,
            handler: 'users.getUsers',
            timeout: cdk.Duration.minutes(1),
            code: lambda.Code.fromAsset(path.join(__dirname, '..', 'users')),
            environment: {
                "USERNAME": "replace-userneme-cognito"
            }
        });

        const fnGetUServers = new lambda.Function(this, 'dynamo-lambda-get-servers-function', {
            functionName: 'tdms-db-get-all-servers',
            role: roleForAdminCognitoAndDB,
            vpc: vpc,
            securityGroups: [lambdaSG],
            vpcSubnets: {
                subnetType: ec2.SubnetType.PRIVATE_WITH_NAT
            },

            runtime: lambda.Runtime.NODEJS_14_X,
            handler: 'users.getServers',
            timeout: cdk.Duration.minutes(1),
            code: lambda.Code.fromAsset(path.join(__dirname, '..', 'users')),
            environment: {
                "USERNAME": "replace-userneme-cognito"
            }
        });

        const fnGetRoles = new lambda.Function(this, 'dynamo-lambda-get-roles-function', {
            functionName: 'tdms-db-get-roles',
            vpc: vpc,
            securityGroups: [lambdaSG],
            vpcSubnets: {
                subnetType: ec2.SubnetType.PRIVATE_WITH_NAT
            },
            role: roleForAdminVPCAndDB,
            runtime: lambda.Runtime.NODEJS_14_X,
            handler: 'roles.obtainRoles',
            timeout: cdk.Duration.minutes(1),
            code: lambda.Code.fromAsset(path.join(__dirname, '..', 'users'))
        });

        const fnAccessGroup = new lambda.Function(this, 'dynamo-lambda-get-access-group-function', {
            functionName: 'tdms-db-get-accessGroup',
            role: roleForAdminCognitoAndDB,
            vpc: vpc,
            securityGroups: [lambdaSG],
            vpcSubnets: {
                subnetType: ec2.SubnetType.PRIVATE_WITH_NAT
            },
            runtime: lambda.Runtime.NODEJS_14_X,
            handler: 'roles.obtainAccessGroups',
            timeout: cdk.Duration.minutes(1),
            code: lambda.Code.fromAsset(path.join(__dirname, '..', 'users'))
        });

        const fnAssignRoles = new lambda.Function(this, 'dynamodo-lambda-assign-role-function', {
            functionName: 'tdms-sb-assign-role',
            role: roleForAdminCognitoAndDB,
            vpc: vpc,
            securityGroups: [lambdaSG],
            vpcSubnets: {
                subnetType: ec2.SubnetType.PRIVATE_WITH_NAT
            },
            runtime: lambda.Runtime.NODEJS_14_X,
            handler: 'roles.asssingRoles',
            timeout: cdk.Duration.minutes(1),
            code: lambda.Code.fromAsset(path.join(__dirname, '..', 'users'))
        });

        const batchUpdate = new lambda.Function(this, 'dynamo-lambda-batch-update-function', {
            functionName: 'tdms-db-batch-update',
            runtime: lambda.Runtime.NODEJS_14_X,
            handler: 'batch.batchUpdate',
            timeout: cdk.Duration.minutes(5),
            code: lambda.Code.fromAsset(path.join(__dirname, '..', 'dynamo-items'), {
                exclude: ["node_modules"]
            })
        });

        const fnCreateRoles = new lambda.Function(this, 'dynamo-lambda-create-roles-function', {
            functionName: 'tdms-db-create-roles',
            role: roleForAdminCognitoAndDB,
            vpc: vpc,
            securityGroups: [lambdaSG],
            vpcSubnets: {
                subnetType: ec2.SubnetType.PRIVATE_WITH_NAT
            },
            runtime: lambda.Runtime.NODEJS_14_X,
            handler: 'roles.createRoles',
            timeout: cdk.Duration.minutes(1),
            code: lambda.Code.fromAsset(path.join(__dirname, '..', 'users'))
        });

        const fnCreateAccessGroup = new lambda.Function(this, 'dynamo-lambda-create-access-group-function', {
            functionName: 'tdms-db-create-access-group',
            role: roleForAdminCognitoAndDB,
            vpc: vpc,
            securityGroups: [lambdaSG],
            vpcSubnets: {
                subnetType: ec2.SubnetType.PRIVATE_WITH_NAT
            },
            runtime: lambda.Runtime.NODEJS_14_X,
            handler: 'roles.createAccessGroups',
            timeout: cdk.Duration.minutes(1),
            code: lambda.Code.fromAsset(path.join(__dirname, '..', 'users'))
        });

        const fnGetItemsForServer = new lambda.Function(this, 'dynamo-lambda-get-items-for-server-function', {
            functionName: 'tdms-db-get-items-for-server',
            role: roleForAdminCognitoAndDB,
            vpc: vpc,
            securityGroups: [lambdaSG],
            vpcSubnets: {
                subnetType: ec2.SubnetType.PRIVATE_WITH_NAT
            },
            runtime: lambda.Runtime.NODEJS_14_X,
            handler: 'server.obtainItems',
            timeout: cdk.Duration.minutes(1),
            environment: {
                "arnKms": process.env.arnKms!!,
                "arnKmsAlias": process.env.arnKmsAlias!!,
                "POOL_ID": process.env.POOL_ID!!,
                "CLIENT_ID": process.env.CLIENT_ID!!,
                URL_ITEMS: process.env.URL_ITEMS_DOMAIN!!,
            },
            code: lambda.Code.fromAsset(path.join(__dirname, '..', 'users'))
        });

        const fnUpdateUser = new lambda.Function(this, 'dynamo-lambda-update-subject-function', {
            functionName: 'tdms-db-update-subject',
            role: roleForAdminCognitoAndDB,
            vpc: vpc,
            securityGroups: [lambdaSG],
            vpcSubnets: {
                subnetType: ec2.SubnetType.PRIVATE_WITH_NAT
            },
            runtime: lambda.Runtime.NODEJS_14_X,
            handler: 'users.updateUsers',
            timeout: cdk.Duration.minutes(1),
            code: lambda.Code.fromAsset(path.join(__dirname, '..', 'users'))
        });

        const fnGetUserProfile = new lambda.Function(this,'dynamo-lambda-get-profile',{
           functionName: 'tdms-db-get-profile',
           role: roleForAdminCognitoAndDB,
           vpc: vpc,
           securityGroups: [lambdaSG],
           vpcSubnets: {
               subnetType: ec2.SubnetType.PRIVATE_WITH_NAT
           },
           runtime: lambda.Runtime.NODEJS_14_X,
           handler: 'users.profile',
           timeout: cdk.Duration.minutes(1),
           code: lambda.Code.fromAsset(path.join(__dirname, '..', 'users'))
        });

        const fnPreviewList = new lambda.Function(this,'dynamo-lambda-query-preview',{
           functionName: 'tdms-db-query-preview',
           role: roleForAdminCognitoAndDB,
           vpc: vpc,
           securityGroups: [lambdaSG],
           vpcSubnets: {
               subnetType: ec2.SubnetType.PRIVATE_WITH_NAT
           },
           runtime: lambda.Runtime.NODEJS_14_X,
           handler: 'get.previewList',
           timeout: cdk.Duration.minutes(1),
           code: lambda.Code.fromAsset(path.join(__dirname, '..', 'dynamo-items'))

        });
        /*
        fnGetItemsForServer.currentVersion.addAlias('latest',{
           provisionedConcurrentExecutions:3
        });
*/


        const rule = new events.Rule(this, 'Rule', {
            description: "Rule to avoid coldstart lambda",
            schedule: events.Schedule.expression('rate(5 minutes)')
        });
        const eventWarm = {
            "warmInput": true
        };

        rule.addTarget(new targets.LambdaFunction(fnGetItemsForServer, {

            event: events.RuleTargetInput.fromObject(eventWarm)
        }));
        rule.addTarget(new targets.LambdaFunction(dynamoGetCountryType, {
            event: events.RuleTargetInput.fromObject(eventWarm)
        }));

        auditTable.grantReadWriteData(dynamoRemoveItem);
        auditTable.grantReadWriteData(roleForAdminCognitoAndDB);
        auditTable.grantReadWriteData(dynamoUpdateItem);
        auditTable.grantReadWriteData(dynamoInsertItem);
        auditTable.grantReadWriteData(dynamoGetItem);
        auditTable.grantReadWriteData(dynamoGetCountryType)
        accountsTable.grantReadWriteData(dynamoInsertItem);
        accountsTable.grantReadWriteData(dynamoUpdateItem);
        accountsTable.grantReadData(dynamoGetItem);
        accountsTable.grantReadData(dynamoSearchItem);
        accountsTable.grantReadData(dynamoGetCountryType);
        accountsTable.grantReadWriteData(dynamoRemoveItem);
        usersTable.grantReadData(dynamoRemoveItem);
        usersTable.grantReadData(dynamoGetCountryType);
        accountsTable.grantReadWriteData(roleForAdminCognitoAndDB);
        accountsTable.grantReadWriteData(batchUpdate);
        usersTable.grantReadData(fnGetUsers);
        usersTable.grantReadData(fnGetUServers);
        usersTable.grantReadWriteData(roleForCognito);
        usersTable.grantReadWriteData(roleForAdminCognitoAndDB);
        rolesTable.grantReadWriteData(roleForAdminCognitoAndDB);
        usersTable.grantReadData(dynamoInsertItem);
        usersTable.grantReadData(dynamoUpdateItem);
        auditTable.grantReadWriteData(dynamoInsertItem);
        rolesTable.grantReadWriteData(dynamoInsertItem);

        usersTable.grantReadData(roleForAdminVPCAndDB);
        auditTable.grantReadWriteData(roleForAdminVPCAndDB);
        rolesTable.grantReadData(roleForAdminVPCAndDB);

        const poolCognito = cognito.UserPool.fromUserPoolId(this, "pool-id", process.env.POOL_ID!!);


        const auth = new apigateway.CognitoUserPoolsAuthorizer(this, 'cognito-authorizer', {
            cognitoUserPools: [poolCognito],
            authorizerName: "authorizer-pool",
            identitySource: apigateway.IdentitySource.header('Authorization')
        });


        //FOR API ITEMS
        const itemsRootResource = api.root.addResource('items')
        const userRootResource = api.root.addResource('users');
        //FOR API SERVERS
        const serverRootApi = apiServer.root.addResource('servers');

        //Resources for api ITEMS
        const serverResource = userRootResource.addResource("servers");
        const rolesResource = userRootResource.addResource("roles");
        const userProfile = userRootResource.addResource("profile");
        const assingRoleResource = rolesResource.addResource("assign");
        const itemSubResources = itemsRootResource.addResource('{itemId}');
        const queryResource = itemsRootResource.addResource('query');
        const previewResource = queryResource.addResource('preview');
        const searchResource = itemsRootResource.addResource('search');
        const countryQueryResource = queryResource.addResource('{country}');
        const countryAndTypeResource = countryQueryResource.addResource('{type}');
        const accessGroupsResource = itemsRootResource.addResource('accessGroup');

        //Resources for api SERVERS
        const itemForServers = serverRootApi.addResource('items');
        const countryItemServer = itemForServers.addResource('{country}');
        const countryAndTypeItemServer = countryItemServer.addResource('{type}');

        countryAndTypeItemServer.addMethod('GET', new apigateway.LambdaIntegration(fnGetItemsForServer));

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

        userRootResource.addMethod('PUT', new apigateway.LambdaIntegration(fnUpdateUser), {
            authorizer: auth
        });


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

        rolesResource.addMethod('POST', new apigateway.LambdaIntegration(fnCreateRoles), {
            authorizer: auth
        });
        accessGroupsResource.addMethod('GET', new apigateway.LambdaIntegration(fnAccessGroup), {
            authorizer: auth
        });

        accessGroupsResource.addMethod('POST', new apigateway.LambdaIntegration(fnCreateAccessGroup), {
            authorizer: auth
        });
        assingRoleResource.addMethod('POST', new apigateway.LambdaIntegration(fnAssignRoles), {
            authorizer: auth
        });

        userProfile.addMethod('GET', new apigateway.LambdaIntegration(fnGetUserProfile), {
            authorizer: auth
        });

        previewResource.addMethod('GET', new apigateway.LambdaIntegration(fnPreviewList), {
            authorizer: auth
        });
    }


}
