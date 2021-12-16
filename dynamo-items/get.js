const AWS = require("aws-sdk");
const middy = require("@middy/core");
const lib = require('lib');

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

const baseHandlerCountryType=async (event,context)=> {

    console.log("env" +process.env.ISLOCAL);
    const db =process.env.ISLOCAL=="true"?new AWS.DynamoDB.DocumentClient(options):new AWS.DynamoDB.DocumentClient();
    let {country, type} = event.pathParameters;

    let expressionAttributesValues = {
        ':country': country.toUpperCase(),
        ':typeItem': type.toUpperCase(),

    };
    const params = {
        TableName: 'AccountsCollection',
        IndexName: 'TypeItemCountryIndex',
        KeyConditionExpression: 'country = :country and typeItem = :typeItem',
        ExpressionAttributeValues: expressionAttributesValues
    };

    if (event.queryStringParameters) {
        params['FilterExpression'] = "";
        Object.entries(event.queryStringParameters).forEach(([key, item]) => {
            params.ExpressionAttributeValues[`:${key}`] = `${item}`
            params['FilterExpression'] += `${key} = :${key} AND `
        });

        params['FilterExpression'] = params['FilterExpression'].slice(0, -4);

    }

    console.log(JSON.stringify(params));
    try {

        let dynamoResponse = await db.query(params).promise();
        return {
            'headers': {
                'Content-Type': 'application/json'
            },
            'statusCode': 200,
            'body': JSON.stringify({
                ...dynamoResponse
            })
        };
    } catch (err) {

        if (err.message)
            return lib.return500Response({"message":err.message});
        else
            return lib.return500Response(err.message);

    }
}


exports.handlerCountryType= middy(baseHandlerCountryType).onError(async (req) => {


    if (req.error) {
        return lib.return500Response(req.error);
    }
});

