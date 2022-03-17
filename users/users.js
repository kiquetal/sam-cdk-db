const AWS = require("aws-sdk");
const cors = require('@middy/http-cors');
const middy = require("@middy/core");
const jsonBodyParser = require('@middy/http-json-body-parser');
const httpError = require('@middy/http-error-handler');
const lib = require("./lib");
const util = require("./util");
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


const creatUser = async (event, context) => {
    try {
        const body = event.body;
        const params = {
            UserPoolId: process.env.POOL_ID,
            Username: body["username"],
            MessageAction: "SUPPRESS",
            UserAttributes: [
                {
                    "Name": "email",
                    "Value": body["username"]
                },
                {
                    "Name": "email_verified",
                    "Value": "true"
                }
            ]
        }

        const cognito = new AWS.CognitoIdentityServiceProvider();
        const responseCognito = await cognito.adminCreateUser(params).promise();
        const attributes = responseCognito["User"]["Attributes"];
        const sub = attributes.filter(a => a["Name"] == "sub")[0]

        const paramsPassword = {
            Password: body["password"],
            UserPoolId: process.env.POOL_ID,
            Permanent: true,
            Username: body["username"]
        }
        console.log("for password" + body["password"]);
        await cognito.adminSetUserPassword(paramsPassword).promise();

        await saveCredentialsDb(sub["Value"], body["username"], body["password"], body["country"]);

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


const saveCredentialsDb = async (sub, username, password, country) => {

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
                "typeItem": "USER"
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

const checkPermissions = () => {
    const logical = async (request) => {
        const sub = request.event.requestContext.authorizer.claims.sub;
        const db = new AWS.DynamoDB.DocumentClient();
        const params = {
            TableName: 'UsersCollection',
            Key: {
                "pk": sub,
                "sk": "USER#ID"
            },
            ProjectionExpression: "email, #roles",
            ExpressionAttributeNames: {
                "#roles": "roles"
            }
        };
        const rp = await db.get(params).promise();
        let hasPermission = []

        if (!rp.hasOwnProperty("Item")) {

            return {
                statusCode: 401,
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({"code": 401, "message": "unathorized"})
            };

        }
        const roles = rp["Item"]["roles"];
        let {country} = request.event.body;
        if (roles) {
            if (roles.includes("admin"))
                hasPermission = ["admin"];
            else
                hasPermission = roles.filter(r => r.includes(country));
        }
        if (!hasPermission.length > 0) {
            return {
                statusCode: 401,
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({"code": 401, "message": "unathorized"})
            };
        }


    }
    return {
        before: logical
    }
};

exports.createUser = middy(creatUser).use(jsonBodyParser()).use(httpError()).use(cors()).use(checkPermissions()).onError(async (req) => {
    if (req.error) {
        return lib.return500Response(req.error);
    }
})


exports.removeUser =: removeUserFn
exports.loginUser = loginUserFn
