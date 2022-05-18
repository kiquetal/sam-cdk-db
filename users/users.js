const AWS = require("aws-sdk");
const cors = require('@middy/http-cors');
const middy = require("@middy/core");
const jsonBodyParser = require('@middy/http-json-body-parser');
const httpError = require('@middy/http-error-handler');
const lib = require("./lib");
const validator = require('@middy/validator');

const util = require("./util");
const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const httpErrorHandler = require("@middy/http-error-handler");
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


const hasPermissions=(roles,country,onlyAdmin)=> {
    console.log(JSON.stringify(roles));
   const admin= roles.filter(role => {
        if (role === "admin") {
            return true;
        }
    })
    if (admin.length > 0) {
        return true;
    }
    if (onlyAdmin) return false
   const filtered = roles.filter(role => {
        if (role.includes(country.toLowerCase())) {
            return true;
        }
    })

    return filtered.length>0;
}

const createServer = async (event, context) => {
    try {
        const body = event.body;
  /*      const requiredFields=["country","serverName","email","password"];
        let missingFields=[]
        requiredFields.forEach(value => {
            if (!body.hasOwnProperty(value))
                missingFields.push(value)
        });
        if (missingFields.length>0)
        {
            return lib.returnResponse(400,{"code":400,"message":`Required fields ${missingFields}`})
        }
*/
        let { roles } = context;
        if (!roles)
            roles = [];
        const hasPermission=hasPermissions(roles,body.country,false)
        if (!hasPermission) {
            return lib.returnResponse(403, {
                "code": 403,
                "message": "You don't have permission to create server"
            })
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
        const sub = attributes.filter(a => a["Name"] === "sub")[0]

        const paramsPassword = {
            Password: body["password"],
            UserPoolId: process.env.POOL_ID,
            Permanent: true,
            Username: body["email"]
        }
        await cognito.adminSetUserPassword(paramsPassword).promise();

        await saveCredentialsDb(sub["Value"], body["email"], body["password"], body["country"],body["serverName"],{"email":emailCreator,
        "sub":subCreator},body["accessGroup"]);

        await lib.insertToAudit({pk:subCreator,
            currentValue:{
            subjectId:sub["Value"],
            country:body["country"],
            serverName:body["serverName"],
            accessGroup:body["accessGroup"],
            }
        },lib.AUDIT_ACTIONS.CREATE_SERVER)

        return {
            'headers': {
                'Content-Type': 'application/json'
            },
            'statusCode': 201,
            'body': JSON.stringify({"message": "Sever created successfully"})
        };
    } catch (exception) {
        console.log("error-for-create", exception);
        return {
            "headers": {
                'Content-Type': 'application/json'
            },
            "statusCode": 500,
            "body": JSON.stringify({"code": 500, "message": exception.message})
        }
    }
}


const saveCredentialsDb = async (sub, username, password, country,serverName,creator,accessGroup) => {

    try {
        const db = new AWS.DynamoDB.DocumentClient();
        const password64 = await util.encrypt(password)
        const params = {
            TableName: 'UsersCollection',
            Item: {
                'pk': sub,
                'sk': "SERVER#ID",
                'password': password64,
                "country": country.toUpperCase(),
                "accessGroup":accessGroup,
                'email': username,
                "serverName":serverName,
                "typeItem": "USER",
                "creator":creator,
                "createdAt":dayjs.utc().unix()
            }
        };
         await db.put(params).promise();
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
                'sk': 'SERVER#ID'
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
                "roles":value["roles"],
                "accessGroup":value["accessGroup"],
            })
        });
        return lib.returnResponse(200,responseJson)
    }
    catch(ex)
    {
        return lib.return500Response(ex.message);
    }


}



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
                "creator":value["creator"],
                "accessGroup": value["accessGroup"],
            })
        });
        return lib.returnResponse(200,responseJson);
    }
    catch(ex)
    {
        return lib.return500Response(ex.message);
    }


}

const inputSchema = {

        type: 'object',
        properties: {
            body: {
                type: 'object',
                properties: {
                    email: {type: 'string'},
                    password: {type: 'string'},
                    country:{type:'string'},
                    serverName:{type:'string'},
                    accessGroup:{ type:'array'}
                },
                required: ['email','password','country','serverName','accessGroup'] // Insert here all required event properties
            }
        }
   };


const createAccessGroupsFn=async (event,context)=>{

    try {

    const roles = context.roles;
    if (!roles.include("admin") )
        return {
            statusCode: 403,
            headers:{
                ContentType:"application/json"
            },
            body: JSON.stringify({
                code:403,
                message: "Forbbiden"
            })
        }



    }
    catch (ex) {
        console.log(ex.message);
        return lib.return500Response(ex.message);
    }


}

const inputSchemaUpdateUser = {
    type: 'object',
    properties: {
        body: {
            type: 'object',
            properties: {
                pk: {type: 'string'},
                typeItem: {type: 'string'}
            },
            required: ['pk', 'typeItem'] // Insert here all required event properties

        }
    }
}

const updateUsersFn = async (event,context) =>{

    try {
        const sub = event.requestContext.authorizer.claims.sub;
        const db = new AWS.DynamoDB.DocumentClient();
        const roles = context.roles?context.roles:[];
        const { pk, typeItem, password,...rest} = event.body;

        const params = {
            TableName: 'UsersCollection',
            Key: {
                pk: pk,
                sk: typeItem
            },

            ReturnValues: "UPDATED_NEW"
        };

        const obtainParams = {
            TableName: 'UsersCollection',
            Key: {
                'pk': pk,
                'sk': typeItem
            },
            ProjectionExpression:"pk,sk,accessGroup,country,serverName,#roles,email",
            ExpressionAttributeNames:{
                "#roles": "roles"
            }
        };
        const user = await db.get(obtainParams).promise();
        console.log(JSON.stringify(user))
        if (!user.hasOwnProperty("Item")) {
            return lib.returnResponse(404,{
                "code":404,
                "message":"User not found"
            })

        }
        let onlyAdmin = false;
        if (typeItem==="USER#ID")
            onlyAdmin = true;
        const hasPermission = hasPermissions(roles,user["Item"]["country"],onlyAdmin);
        if (!hasPermission )
            return {
                statusCode: 403,
                headers:{
                    ContentType:"application/json"
                },
                body: JSON.stringify({
                    code:403,
                    message: "Forbbiden"
                })
            }
        const expressionAttributeValues = {}
        const expressionAttributeNames = {}
        let updateExpression = "SET";

        rest["updatedAt"]= dayjs().utc().unix();
        Object.keys(rest).forEach(key => {
            expressionAttributeValues[`:${key}`] = rest[key];
            expressionAttributeNames[`#${key}`] = key;
            updateExpression += ` #${key} = :${key},`
        });
        updateExpression = updateExpression.slice(0, -1);

        Object.assign(params, {
            UpdateExpression: updateExpression,
            ExpressionAttributeValues: expressionAttributeValues,
            ExpressionAttributeNames: expressionAttributeNames
        });
        console.log(JSON.stringify(updateExpression))
        const data = await db.update(params).promise();

        const typeItemAudit = typeItem==="USER#ID"?lib.AUDIT_ACTIONS.UPDATE_USER:lib.AUDIT_ACTIONS.UPDATE_SERVER
        await lib.insertToAudit({
            pk: sub,
            currentValue: data.Attributes,
            subjectPk: pk,
            previousValue: user.Item,
        },typeItemAudit);

        return {
            statusCode: 200,
            headers:{
                ContentType:"application/json"
            },
            body: JSON.stringify({
                code:200,
                message: "Subject updated",
                pk: data["Attributes"]["pk"],
            })
        }

    }
    catch (e) {
        console.log(e.message);
        return lib.return500Response(e.message);
    }

}

const profileFn = async(event,context) => {

    try {

        const sub = event.requestContext.authorizer.claims.sub;
        const db = new AWS.DynamoDB.DocumentClient();
        const params = {
            TableName: 'UsersCollection',
            Key: {
                pk: sub,
                sk: "USER#ID"
            },
            ProjectionExpression:"accessGroup,#roles",
            ExpressionAttributeNames:{
                "#roles": "roles"
            }
        };
        const user = await db.get(params).promise();

        if (!user.hasOwnProperty("Item")) {
            return lib.returnResponse(404,{
                "code":404,
                "message":"User not found"
            })

        }
        return lib.returnResponse(200,{
            "data":user.Item
        })

    }
    catch (e){
        console.log(e.message);
        return lib.return500Response(e.message);
    }

}




exports.createServer = middy(createServer).use(jsonBodyParser()).use(cors()).use(validator({ inputSchema: inputSchema})).use(lib.checkPermisson()).onError(lib.fnErrors)
exports.getUsers = middy(getUsersFn).use(cors()).onError(lib.fnErrors);
exports.getServers = middy(getServersFn).use(cors()).onError(lib.fnErrors);
exports.createAccessGroups = middy(createAccessGroupsFn).use(cors()).use(jsonBodyParser()).use(lib.checkPermisson()).onError(lib.fnErrors);
exports.removeUser = removeUserFn
exports.loginUser = loginUserFn
exports.updateUsers = middy(updateUsersFn).use(jsonBodyParser()).use(cors()).use(validator({inputSchema:inputSchemaUpdateUser})).use(lib.checkPermisson()).onError(lib.fnErrors)
exports.profile = middy(profileFn).use(cors()).onError(lib.fnErrors)
