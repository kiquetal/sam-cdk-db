// const axios = require('axios')
// const url = 'http://checkip.amazonaws.com/';
let response;
const middy = require("@middy/core");
const jsonBodyParser = require('@middy/http-json-body-parser');
const httpError = require('@middy/http-error-handler');
const validator = require('@middy/validator');
const AWS = require("aws-sdk");

const lib = require('lib');
const dayjs = require("dayjs");

const utc = require('dayjs/plugin/utc');
dayjs.extend(utc);
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
const inputSchema = {
    type: 'object',
    properties: {
        body: {
            type: 'object',
            properties: {
                pk: {type: 'string'},
                data: {type: 'object'}
            },
            required: ['pk', 'data'] // Insert here all required event properties
        }
    }
}


const handlerUpdate = async (event, context) => {


    try {
        console.log("env" +process.env.ISLOCAL);
        const db =process.env.ISLOCAL=="true"?new AWS.DynamoDB.DocumentClient(options):new AWS.DynamoDB.DocumentClient();
        const {pk, type, ...rest} = event.body;
        let resp = await lib.getItemByPk(db, {
            TableName: 'AccountsCollection',
            Key: {
                'pk': pk,
                'country': lib.obtainCountry(pk)
            }
        });
        if (resp.hasOwnProperty('Item')) {


            let expressionUpdate = {
                UpdateExpression: 'set ',
                ExpressionAttributeNames: {},
                ExpressionAttributeValues: {}
            }

            rest["updatedTime"] = dayjs.utc().unix();
            Object.entries(rest).forEach(([key, item]) => {
                expressionUpdate.UpdateExpression += ` #${key} = :${key},`;
                expressionUpdate.ExpressionAttributeNames[`#${key}`] = key;
                expressionUpdate.ExpressionAttributeValues[`:${key}`] = item;
            });

            expressionUpdate.UpdateExpression = expressionUpdate.UpdateExpression.slice(0, -1);

            let updateItem = await lib.updateItem(db, {
                TableName: 'AccountsCollection',
                Key: {
                    pk: pk,
                    country: lib.obtainCountry(pk)
                },
                ...expressionUpdate,
                ReturnValues: "ALL_NEW"
            });

            response = {
                'headers': {
                    'Content-Type': 'application/json'
                },
                'statusCode': 200,
                'body': JSON.stringify({
                    ...updateItem.Attributes
                })
            }
            return response;


        } else {
            console.log("empty");
            return response = {
                'headers': {
                    'Content-Type': 'application/json'
                },
                'statusCode': 404,
                'body': JSON.stringify({
                    error: {
                        'message': 'Item not found'
                    }
                })
            }
        }

    } catch (err) {
        if (err.message)
            return lib.return500Response({"message":err.message});
        else
            return lib.return500Response(err.message);

    }
};
exports.handler = middy(handlerUpdate).use(jsonBodyParser()).use(validator({inputSchema})).onError(async (req) => {


    if (req.error) {
        return lib.return500Response(req.error);
    }
});
