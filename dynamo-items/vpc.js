// const axios = require('axios')
// const url = 'http://checkip.amazonaws.com/';
let response;
const AWS = require("aws-sdk");
const middy = require("@middy/core");
const lib = require("./lib")
const cors = require('@middy/http-cors');
const validator = require("@middy/validator");
const jsonBodyParser = require("@middy/http-json-body-parser");
const axios = require("axios");

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


        const headersRequest = {
            Host: "ff6cs2tdu4.execute-api.us-east-1.amazonaws.com",
            Authorization: "x-auth"
        };
        const data = await axios.get('https://ff6cs2tdu4.execute-api.us-east-1.amazonaws.com/test/items/query/co/basic_credentials',{headers: headersRequest});
        console.log(JSON.stringify(data.data));
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


exports.vpcAPIGW = middy(handler)
