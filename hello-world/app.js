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
        // const ret = await axios(url);

const db = new AWS.DynamoDB.DocumentClient(options);
console.log("lets check");


 const params = {
    TableName: 'MusicCollection' ,
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
