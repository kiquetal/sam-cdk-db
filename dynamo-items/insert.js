// const axios = require('axios')
// const url = 'http://checkip.amazonaws.com/';
const middy = require("@middy/core");

let response;
const AWS = require("aws-sdk");


const  jsonBodyParser = require('@middy/http-json-body-parser');


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
exports.lambdaHandler = async (event, context) => {
    try {

const db = new AWS.DynamoDB.DocumentClient(options);
console.log("lets check");
 const params = {
    TableName: 'ion' ,
    KeyConditionExpression:'Artist = :artist',
    ExpressionAttributeValues:{
   ':artist' :'led_zepellin'
    }
  };



            console.log("before response3");
  const response3 = await db.query(params).promise();
 console.log("response3");





	    response = {
             'headers': {
             'Content-Type':'application/json'
	     },
            'statusCode': 200,
            'body': JSON.stringify({
                message: 'hello world',
		data:response3
                // location: ret.data.trim()
            })
        }
    } catch (err) {
        console.log(err);
        return err;
    }

    return response
};


const baseHandler = async (event, context) => {

    const db = new AWS.DynamoDB.DocumentClient(options);


    try {


        let {type, country,value, resourceGroup, backendName,plans } = event.body;

        const params = {
            TableName: 'AccountsCollection',
            Item: {
                pk: `#${country}#${type}#${resourceGroup}`,
                country: country,
                backendName,
                createdDate : new Date().getUTCDate(),
                type: type,
            }
        };


        let dataValue={}
        switch(type)
        {
            case "TOKEN":
                dataValue = { value }
                break;

            case "BASIC_CREDENTIALS":
                dataValue = { value }
                break;
            case "OAUTH_CLIENT_CREDENTIALS":

                let {clientId,clientSecret } = value.split(":");
                   dataValue = {
                    clientId:clientId,
                    clientSecret:clientSecret
                }

                break;
            case "MSISDN":
                params.Item["plans"]=plans
                dataValue = value;
                break;
            default:
                break;


        }
        params.Item[data]=dataValue;




        let dynamoResponse = await db.put(params).promise();
    }
    catch(err)
    {
        console.log(err.toString());
    }
    response = {
        'headers': {
            'Content-Type':'application/json'
        },
        'statusCode': 200,
        'body': JSON.stringify({
            message: 'ForInsert',
            name:resourceGroup,
            tem:'temperatura-nueva-from-code-low-code'
            // location: ret.data.trim()
        })
    }

return response;
};

exports.handler = middy(baseHandler).use(jsonBodyParser());

exports.lambdaUpdate=async (event, context) => {

    response = {
        'headers': {
            'Content-Type':'application/json'
        },
        'statusCode': 200,
        'body': JSON.stringify({
            message: 'ForUpdate',
            // location: ret.data.trim()
        })
    }

    return response;

};
