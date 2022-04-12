// const axios = require('axios')
// const url = 'http://checkip.amazonaws.com/';
let response;
const AWS = require("aws-sdk");
const middy = require("@middy/core");
const lib = require("./lib")
const cors = require('@middy/http-cors');
const validator = require("@middy/validator");
const jsonBodyParser = require("@middy/http-json-body-parser");

const options = {
    region: "localhost",
    endpoint: "http://dynamodb:8000",
    secretAccessKey: 'aasa',
    accessKeyId: 'asdsd'
};




/**
 *
 * Event doc: https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html#api-gateway-simple-proxy-for-lambda-input-format
 * @param {Object} event - API Gateway Lambda Proxy Input Format
 *
 * Context doc: https://docs.aws.amazon.com/lambda/latest/dg/nodejs-prog-model-context.html
 * @param {Object} context
 *
 * Return doc: https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html
 * @returns {Object} object - API Gateway Lambda Proxy Output Format
 *
 */
const handler=async (event, context) => {

    try {
     const sub = event.requestContext.authorizer.claims.sub;
     const db =process.env.ISLOCAL=="true"?new AWS.DynamoDB.DocumentClient(options):new AWS.DynamoDB.DocumentClient();
     const { pk } = event.body;
     let { roles } = context;

     if (!roles) {
         roles = [];
     }

     const params = {
         TableName: "AccountsCollection",
         Key: {
             pk: pk,
             country:getCountry(pk)
         },
         ProjectionExpression:"country,accessGroup,#roles",
         ExpressionAttributeNames:{
             "#roles": "roles"
         }
     };

     console.log(JSON.stringify(params));
     const result = await db.get(params).promise();
     if (!result.hasOwnProperty("Item"))
     {
         return {
             statusCode:404,
             body:JSON.stringify({
                 code:404,
                 message:"Item not found"
             })
         }
     }


     const hasPermission = hasPermissions(roles, result.Item["country"],false);

     if (!hasPermission)
     {
         return {
             statusCode:403,
             body:JSON.stringify({
                 code:403,
                 message:"You don't have permission to perform this action"
             })
         }
     }

     await db.delete({
         TableName: "AccountsCollection",
         Key: {
             pk: pk,
             country:result.Item["country"]
         }
     }).promise();

     await lib.insertToAudit({
         pk:sub,
     itemPk:pk
     },lib.AUDIT_ACTIONS.DELETE)

        return {
            statusCode: 200,
            body: JSON.stringify({
                message: "Item deleted"
            })
        }
    }
    catch (err) {
        console.log(err)
        return lib.return500Response(err);
    }

};


const inputSchema = {
    type: 'object',
    properties: {
        body: {
            type: 'object',
            properties: {
                pk: {type: 'string'}
            },
            required: ['pk'] // Insert here all required event properties
        }
    }
}

const getCountry=(pk)=> {

    const country = pk.substring(1,3);
    return country;
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


exports.removeFn = middy(handler).use(cors()).use(lib.checkPermission()).use(jsonBodyParser()).use(validator({inputSchema})).onError(lib.fnErrors)
