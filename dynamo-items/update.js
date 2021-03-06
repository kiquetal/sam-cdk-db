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
const cors = require('@middy/http-cors');
const utilEncrypt = require('./util');

const utc = require('dayjs/plugin/utc');
const {AUDIT_ACTIONS} = require("./lib");
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
            required: ['pk'] // Insert here all required event properties
        }
    }
}


const handlerUpdate = async (event, context) => {


    try {
        const db =process.env.ISLOCAL=="true"?new AWS.DynamoDB.DocumentClient(options):new AWS.DynamoDB.DocumentClient();
        const sub = event.requestContext.authorizer.claims.sub;
        let {pk, type, country,accessGroup,...rest} = event.body;
        let resp = await lib.getItemByPk(db, {
            TableName: 'AccountsCollection',
            Key: {
                'pk': pk,
                'country': lib.obtainCountry(pk)
            }
        });

        if (!Array.isArray(accessGroup)){
            return {
                statusCode:400,
                headers:{
                    ContentType:'application/json',
                },
                body: JSON.stringify({
                    code:400,
                    message: "accessGroup must be an array"
                })
            }
        }

        if (resp.hasOwnProperty('Item')) {

            let expressionUpdate = {
                UpdateExpression: 'set ',
                ExpressionAttributeNames: {},
                ExpressionAttributeValues: {}
            }

            rest["updatedTime"] = dayjs.utc().unix();
            if (resp.Item.hasOwnProperty("enc") && resp.Item.enc =="true")
            {

                console.log("data was encrypted");
            }
            else {
                console.log("data was no encrypted");
                    if (rest["enc"]!="true")
                        delete rest["enc"];

                    else {
                        console.log("going to encrypt");
                        if (rest.hasOwnProperty("data"))
                        rest["data"]=await encryptData(rest["data"]);
                        else
                            rest["data"]= await encryptData(resp.Item.data);
                    }

            }

                console.log(accessGroup);
                console.log(resp.Item.accessGroup)

                const uniqueAccessGroup = [...new Set(accessGroup)];
                Object.entries(rest).forEach(([key, item]) => {
                expressionUpdate.UpdateExpression += ` #${key} = :${key},`;
                expressionUpdate.ExpressionAttributeNames[`#${key}`] = key;
                expressionUpdate.ExpressionAttributeValues[`:${key}`] = item;
            });

            expressionUpdate.UpdateExpression = expressionUpdate.UpdateExpression.slice(0, -1);
            expressionUpdate.UpdateExpression=expressionUpdate.UpdateExpression+', accessGroup = :accessGroup';
            expressionUpdate.ExpressionAttributeValues[':accessGroup'] = uniqueAccessGroup;
            let updateItem = await lib.updateItem(db, {
                TableName: 'AccountsCollection',
                Key: {
                    pk: pk,
                    country: lib.obtainCountry(pk)
                },
                ...expressionUpdate,
                ReturnValues: "ALL_NEW",
                ConditionExpression:"attribute_exists(pk) AND attribute_exists(country)"
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

            await lib.insertToAudit({pk:sub,
            itemPk:pk,
            previousValue:resp.Item,
            currentValue:updateItem.Attributes,
            },AUDIT_ACTIONS.UPDATE)

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

const encryptData = async (data) => {

    return await utilEncrypt.encrypt(data);
}

exports.handler = middy(handlerUpdate).use(lib.checkPermission()).use(jsonBodyParser()).use(validator({inputSchema})).use(cors()).onError(lib.fnErrors);

