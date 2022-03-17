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

        let {typeItem, country,data, resourceGroup, backendName,enc,...rest } = event.body;

        //schema-de-input

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
                ...rest,
                creator:{
                    sub,
                    email
                }
            }
        };


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
     //   let insertIndex = insertIndexDb(id,pk,db);


        response = {
            'headers': {
                'Content-Type':'application/json'
            },
            'statusCode': 201,
            'body': JSON.stringify({
                pk
            })
        }

    }
    catch(err)
    {
        if (err.message)
            return lib.return500Response({"message":err.message});
        else
            return lib.return500Response(err.message);

    }


return response;
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
