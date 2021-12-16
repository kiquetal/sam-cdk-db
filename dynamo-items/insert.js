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

const cors = require('@middy/http-cors');
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
const baseHandler = async (event, context) => {


    try {

        console.log("env" +process.env.ISLOCAL);
        const db =process.env.ISLOCAL=="true"?new AWS.DynamoDB.DocumentClient(options):new AWS.DynamoDB.DocumentClient();

        let {typeItem, country,data, resourceGroup, backendName,enc,...rest } = event.body;

        //schema-de-input

        if (enc)
        {
            //symmetric encrypt and base64

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
                ...rest
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
        params.Item["data"]=dataValue;

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

exports.handler = middy(baseHandler).use(jsonBodyParser()).use(httpError()).use(cors()).onError(async (req) => {
    if (req.error) {
        return lib.return500Response(req.error);
    }
});
