// const axios = require('axios')
// const url = 'http://checkip.amazonaws.com/';
const middy = require("@middy/core");
let response;
const AWS = require("aws-sdk");
const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
dayjs.extend(utc);
const nano = require('nanoid');
const  jsonBodyParser = require('@middy/http-json-body-parser');
const httpError = require('@middy/http-error-handler');
const lib = require('lib');

const utilEncrypt = require('./util');
const cors = require('@middy/http-cors');
const options = {
        region: "localhost",
        endpoint: "http://dynamodb:8000",
        secretAccessKey: 'aasa',
        accessKeyId: 'asdsd'
    };


const crypto = require('@aws-crypto/client-node');
const {insertToAudit, AUDIT_ACTIONS} = require("./lib");

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
const baseHandler = async (event, context) => {


    try {

        console.log("env" +process.env.ISLOCAL);
        const sub = event.requestContext.authorizer.claims.sub;
        const email = event.requestContext.authorizer.claims.email;
        const db =process.env.ISLOCAL=="true"?new AWS.DynamoDB.DocumentClient(options):new AWS.DynamoDB.DocumentClient();
        let {typeItem, country,data, resourceGroup, accessGroup ,backendName,enc,...rest } = event.body;

        if (!Array.isArray(accessGroup))
            return {
                statusCode: 400,
                body: JSON.stringify({
                    code: "400",
                    message: "accessGroup must be an array"
                })
            };
        console.log("after array validation");
        //schema-de-input
        country = country.toUpperCase();
        const roles = context.roles;
        console.log(roles);
        if (!roles.includes("admin"))
        {
           const permissionsByCountry = roles.filter(v=>{
                return v.includes(country.toLowerCase());
            })
            console.log(permissionsByCountry);
            if (permissionsByCountry.length <1 )
                return {
                  "statusCode":403,
                   "headers":{
                      "Content-Type":"application/json"
                   } ,
                    "body":JSON.stringify({
                      code:403,
                        message:"Forbbiden"
                    })
                }
        }
        else {
            console.log("has admin role");
        }
        if (enc)
        {

            rest["enc"]="true";
        }
        console.log(JSON.stringify(rest));
        if (!rest.hasOwnProperty("ttl"))
        {
            const plus7days = dayjs().add(7,'day').unix();
            console.log(`we are goin to set ttl;${plus7days}`);
            console.log(`we are goin to set ttl;${plus7days}`);
            rest["ttl"]=plus7days;
        }
        const id= nano.customAlphabet("1234567890abcdef",10)();
        const pk=`#${country}#${typeItem}#${resourceGroup}#${backendName}#${id}`;
        const params = {
            TableName: 'AccountsCollection',
            Item: {
                pk:pk,
                country: country,
                backendName,
                resourceGroup,
                createdDate : dayjs.utc().unix(),
                typeItem,
                accessGroup,
                ...rest,
                creator:{
                    sub,
                    email
                }
            }
        };

        console.log(JSON.stringify(rest));
        let dataValue={}
        let dataToClient="";
        switch(typeItem)
        {
            case "TOKEN":
                dataValue =  data
                break;
            case "BASIC_CREDENTIALS":
                dataValue = data
                dataToClient="*"
                break;
            case "OAUTH_CLIENT_CREDENTIALS":
                dataValue = data
                dataToClient="*"
                break;
            case "MSISDN":
                dataValue = data;
                dataToClient=dataValue;
                break;
            default:
                break;


        }
        if (enc)
        {

            console.log("for enc");
            const encrypt = await utilEncrypt.encrypt(data);

            params.Item["data"]=encrypt;
        }

        else
        {

            params.Item["data"] = dataValue;
        }

        console.log(JSON.stringify(params));
        let dynamoResponse = await db.put(params).promise();

        await insertToAudit({
            pk: sub,
            currentValue: params["Item"],
            },AUDIT_ACTIONS.CREATE);


        response = {
            'headers': {
                'Content-Type':'application/json'
            },
            'statusCode': 201,
            'body': JSON.stringify({
                pk
            })
        }
        return response;

    }
    catch(err)
    {
        console.log("error",err.message);
        if (err.message)
            return lib.return500Response(err.message);
        else
            return lib.return500Response(err.message);

    }


};


const insertIndexDb = async (id,pk,db) => {

    const params= {
        TableName: 'AccountsCollection',
        Item: {
            pk: id,
            country: pk,
        }
        };
    try {
       await db.put(params).promise();

    }
    catch(err)
    {
        console.log("error+setting+index"+err.toString());
    }
}

exports.handler = middy(baseHandler).use(jsonBodyParser()).use(httpError()).use(cors()).use(lib.checkPermission()).onError(async (req) => {
    if (req.error) {
        return lib.return500Response(req.error);
    }
});
