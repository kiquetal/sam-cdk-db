const AWS = require("aws-sdk");
const  jsonBodyParser = require('@middy/http-json-body-parser');
const httpError = require('@middy/http-error-handler');
const middy = require("@middy/core");

const options = {
    region: "localhost",
    endpoint: "http://dynamodb:8000",
    secretAccessKey: 'aasa',
    accessKeyId: 'asdsd'
};


exports.handler=async (event, context) => {
    const db = new AWS.DynamoDB.DocumentClient(options);

    console.log(event.pathParameters.itemId)
    response = {
        'headers': {
            'Content-Type':'application/json'
        },
        'statusCode': 200,
        'body': JSON.stringify({
            message: 'GET-ITEM',
            // location: ret.data.trim()
        })
    }

    return response;

};

exports.handlerCountryType= async (event,context)=> {

    const db = new AWS.DynamoDB.DocumentClient(options);
    let  { country, type } = event.pathParameters;
    let resourceGroup=null;
    if (event.queryStringParameters)
         resourceGroup  = event.queryStringParameters.resourceGroup;

    let expressionAttributesValues = {
        ':country': country.toUpperCase(),
        ':type': type.toUpperCase(),

    };
    const params = {
        TableName: 'AccountsCollection',
        IndexName: 'TypeAccountCountryIndex',
        KeyConditionExpression: 'country = :country and typeAccount = :type',
        ExpressionAttributeValues: expressionAttributesValues
    };

    if (resourceGroup) {
        params.ExpressionAttributeValues={
            ...expressionAttributesValues,
            ':rg':resourceGroup
        }
        params["FilterExpression"] = ' resourceGroup = :rg'
    }

        console.log(JSON.stringify(params));
        let dynamoResponse = await db.query(params).promise();
    return {
            'headers': {
                'Content-Type':'application/json'
            },
            'statusCode': 200,
            'body': JSON.stringify({
             dynamoResponse
            })
        };
}
