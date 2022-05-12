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
            Authorization: "eyJraWQiOiIraXR5RVd6K2xjdDBWM1RoaFhRd3ZqaHRVUGRkaE51T3dKNFBZM2dDQU5NPSIsImFsZyI6IlJTMjU2In0.eyJhdF9oYXNoIjoiTkJxZUQ0cWVjRk9Uakl5TWpPWmV4USIsInN1YiI6ImIxNGY5MjA4LWI5NDAtNGYxNi1iZDkwLTQ2YzVhMzgxNGE0NyIsImNvZ25pdG86Z3JvdXBzIjpbInVzLWVhc3QtMV9DUU5GZ2FveHVfc3NvLW1pbGxpY29tIl0sImVtYWlsX3ZlcmlmaWVkIjpmYWxzZSwiaXNzIjoiaHR0cHM6XC9cL2NvZ25pdG8taWRwLnVzLWVhc3QtMS5hbWF6b25hd3MuY29tXC91cy1lYXN0LTFfQ1FORmdhb3h1IiwiY29nbml0bzp1c2VybmFtZSI6InNzby1taWxsaWNvbV9lZHVhcmRvLmZpbGlwcGlAZWRnZS5jb20ucHkiLCJvcmlnaW5fanRp"
        };
        const data = await axios.get('https://vpce-03da84937f37c7213-8fywoafk.execute-api.us-east-1.vpce.amazonaws.com',{headers: headersRequest});
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
