const AWS = require("aws-sdk");
const cors = require('@middy/http-cors');
const middy = require("@middy/core");
const jsonBodyParser = require('@middy/http-json-body-parser');
const httpError = require('@middy/http-error-handler');
const lib = require("./lib");
const util = require("./util");
const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
dayjs.extend(utc);

const removeUserFn = async (event, context) => {
    const USERNAME = process.env.USERNAME
    const POOL_ID = process.env.POOL_ID
    const cognito = new AWS.CognitoIdentityServiceProvider();
    try {
        await cognito.adminDeleteUser({
            UserPoolId: POOL_ID,
            Username: USERNAME
        }).promise();
    } catch (exception) {
        console.log("error-for-delete", exception);
        return {
            "message": "error"
        }

    }
    return {
        "message": "finish"
    }
}


const createServer = async (event, context) => {
    try {
        const body = event.body;
        const requiredFields=["country","serverName","email","password"];
        let missingFields=[]
        requiredFields.forEach(value => {
            if (!body.hasOwnProperty(value))
                missingFields.push(value)
        });
        if (missingFields.length>0)
        {
            return lib.returnResponse(400,{"code":400,"message":`Required fields ${missingFields}`})
        }

        const params = {
            UserPoolId: process.env.POOL_ID,
            Username: body["email"],
            MessageAction: "SUPPRESS",
            UserAttributes: [
                {
                    "Name": "email",
                    "Value": body["email"]
                },
                {
                    "Name": "email_verified",
                    "Value": "true"
                }
            ]
        }

        const emailCreator = event.requestContext.authorizer.claims.email;
        const subCreator = event.requestContext.authorizer.claims.sub;

        const cognito = new AWS.CognitoIdentityServiceProvider();
        const responseCognito = await cognito.adminCreateUser(params).promise();
        const attributes = responseCognito["User"]["Attributes"];
        const sub = attributes.filter(a => a["Name"] == "sub")[0]

        const paramsPassword = {
            Password: body["password"],
            UserPoolId: process.env.POOL_ID,
            Permanent: true,
            Username: body["email"]
        }
        await cognito.adminSetUserPassword(paramsPassword).promise();

        await saveCredentialsDb(sub["Value"], body["email"], body["password"], body["country"],body["serverName"],{"email":emailCreator,
        "sub":subCreator});

        return {
            'headers': {
                'Content-Type': 'application/json'
            },
            'statusCode': 201,
            'body': JSON.stringify({"message": "User created successfully"})
        };
    } catch (exception) {
        return {
            "headers": {
                'Content-Type': 'application/json'
            },
            "statusCode": 500,
            "body": JSON.stringify({"code": 500, "message": exception.message})
        }
        console.log("creating user exception", exception);
    }
}


const saveCredentialsDb = async (sub, username, password, country,serverName,creator) => {

    try {
        const db = new AWS.DynamoDB.DocumentClient();
        const password64 = await util.encrypt(password)
        const params = {
            TableName: 'UsersCollection',
            Item: {
                'pk': sub,
                'sk': "SERVER#ID",
                'password': password64,
                "country": country,
                'email': username,
                "serverName":serverName,
                "typeItem": "USER",
                "creator":creator,
                "createdAt":dayjs.utc().unix()
            }
        };
        let dynamoResponse = await db.put(params).promise();
    } catch (exception) {

        console.log("exception saving credentialbs", exception.message)
    }

    return {
        "ok": true
    }
}


const loginUserFn = async (event, contex) => {

    try {
        const sub = process.env.sub;
        const db = new AWS.DynamoDB.DocumentClient();

        const params = {
            TableName: 'UsersCollection',
            Key: {
                'pk': sub,
                'sk': 'SERVERID'
            }
        }
        const rp = await db.get(params).promise()
        if (rp && rp.hasOwnProperty("Item")) {

            const password = await util.decrypt(rp["Item"]["password"])
            const username = rp["Item"]["email"]


            const cognito = new AWS.CognitoIdentityServiceProvider();
            const initAuth = {
                AuthFlow: "ADMIN_USER_PASSWORD_AUTH",
                UserPoolId: process.env.POOL_ID,
                ClientId: process.env.CLIENT_ID,
                AuthParameters: {
                    USERNAME: username,
                    PASSWORD: JSON.parse(password)
                }
            }
            const resp = await cognito.adminInitiateAuth(initAuth).promise()
            console.log(JSON.stringify(resp));
        } else {
            console.log("sub not found")
        }
    } catch (ex) {
        console.log("exeception login", ex.message)
    }


}


const getUsersFn = async (event, request) => {
    try {
        const items = await fnDynamoQuery({"sk":"USER#ID"});
        if (!items){
            return lib.returnResponse(404,{
                    "code":404,
                    "message":"Users not found"
                });

        }
        const responseJson=[]
        items.forEach(value => {
            responseJson.push({
                "email":value["email"],
                "id":value["pk"],
                "roles":value["roles"]
            })
        });
        return lib.returnResponse(200,responseJson)
    }
    catch(ex)
    {
        return lib.return500Response(ex.message);
    }


}

const fnError=async(req)=> {
    if (req.error) {
        return lib.return500Response(req.error);

    }
};


const fnDynamoQuery=async (objSearch) => {

    try {
        const db = new AWS.DynamoDB.DocumentClient();
        const params = {
            TableName: 'UsersCollection',
            IndexName: 'index_sk_and_type',
            KeyConditionExpression: "sk=:sk",
            ExpressionAttributeValues: {
                ":sk": objSearch["sk"]
            }
        };
        console.log(params);
        let dynamoResponse = await db.query(params).promise()
        let items = dynamoResponse["Items"]
        while (dynamoResponse.LastEvaluatedKey) {
            params["ExclusiveStartKey"] = dynamoResponse.LastEvaluatedKey
            dynamoResponse = await db.query(params).promise();
            items = items.concat(dynamoResponse["Items"])
        }
        return items;

    }
    catch(ex)
    {
        return null;
    }
}
const getServersFn= async (event,request)=>{

    try {
        const items = await fnDynamoQuery({"sk":"SERVER#ID"});
        if (!items){
            return lib.returnResponse(404,{
                "code":404,
                "message":"Servers not found"
            });

        }
        const responseJson=[]
        items.forEach(value => {
            responseJson.push({
                "serverName":value["serverName"],
                "email":value["email"],
                "country":value["country"],
                "id":value["pk"],
                "creator":value["creator"]
            })
        });
        return lib.returnResponse(200,responseJson);
    }
    catch(ex)
    {
        return lib.return500Response(ex.message);
    }


}

exports.createServer = middy(createServer).use(jsonBodyParser()).use(httpError()).use(cors()).use(lib.checkPermisson()).onError(fnError)
exports.getUsers = middy(getUsersFn).use(cors()).onError(fnError);
exports.getServers = middy(getServersFn).use(cors()).onError(fnError)
exports.removeUser = removeUserFn
exports.loginUser = loginUserFn
exports.checkPermissions=checkPermissions
