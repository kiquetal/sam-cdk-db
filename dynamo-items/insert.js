// const axios = require('axios')
// const url = 'http://checkip.amazonaws.com/';
let response;
const AWS = require("aws-sdk");


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


exports.handler=async (event, context) => {

    const db = new AWS.DynamoDB.DocumentClient(options);

    let body=JSON.parse(event.body);

    try {
        var params = {
            TableName: 'AccountsCollection',
            Item: {
                pk: `#${body.country}#${body.type}#${body.resourceGroup}`,
                country: body.country,
                data: {"value": "soy el valor"}
            }
        };

        let dynamoResponse = await db.put(params).promise();
    }
    catch(err)
    {
        console.log(err.toString());
    }
    console.log('bodyyyy');
console.log('mi body');
console.log(JSON.stringify(event.body));
console.log(body.type);
    response = {
        'headers': {
            'Content-Type':'application/json'
        },
        'statusCode': 200,
        'body': JSON.stringify({
            message: 'ForInsert',
            bodyJSON: body,
            name:body.name,
            tem:'temperatura-nueva-from-code-low-code'
            // location: ret.data.trim()
        })
    }

return response;
};


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
