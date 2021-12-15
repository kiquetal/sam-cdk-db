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
exports.handler=async (event, context) => {

    response = {
        'headers': {
            'Content-Type':'application/json'
        },
        'statusCode': 200,
        'body': JSON.stringify({
            message: 'ForRemove',
            // location: ret.data.trim()
        })
    }

    return response;

};
