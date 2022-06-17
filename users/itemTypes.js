const AWS = require("aws-sdk");
const cors = require('@middy/http-cors');
const middy = require("@middy/core");
const jsonBodyParser = require('@middy/http-json-body-parser');
const httpError = require('@middy/http-error-handler');
const lib = require("./lib");
const validator = require('@middy/validator');

const util = require("./util");
const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const httpErrorHandler = require("@middy/http-error-handler");
const axios = require("axios");
dayjs.extend(utc);

const inputSchema = {
    type: 'object',
    properties: {
        body: {
            type: 'object',
            properties: {
                name: {type: 'string'},
                schema: {type: 'object'}
            },
            required: ['name','schema'] // Insert here all required event properties
        }
    }
}

const getItemTypes = async (event,context) => {
  try {
      const db = new AWS.DynamoDB.DocumentClient();
        const params = {
            TableName: "RolesAccessCollection",
            IndexName: "index_by_typeItem",
            KeyConditionExpression: "typeItem = :type AND sk = :sk",
            ExpressionAttributeValues: {
                ":type": "ItemType",
                ":sk": "item#type"
            },
            ProjectionExpression: "pk,#schema",
            ExpressionAttributeNames: {
                "#schema": "schema"
            }
        }
        const items = await db.query(params).promise()
        return lib.returnResponse(200, {
                "itemTypes":items["Items"]
        });
  }
    catch (ex) {
        console.log("exception", ex.message);
        return lib.return500Response({"code": 500, "message": ex.message})
    }
};

const createItemTypes = async (event,context) => {
    const { roles } = context;
    console.log(JSON.stringify(roles))
    if (!roles.includes("admin"))
    {
        return {
            statusCode:403,
            headers:{
                'Content-Type':"application/json"
            },
            body:JSON.stringify({
                "code":403,
                "message":"Forbidden"
            })
        };
    }
    const { name, schema } = event.body;

    try {
        const db = new AWS.DynamoDB.DocumentClient();
        const params = {
            TableName: "RolesAccessCollection",
            Item: {
                pk: name,
                sk: "item#type",
                typeItem: "ItemType",
                createdAt: dayjs().utc().format(),
                creator: {
                    email: context.email,
                    sub: event.requestContext.authorizer.claims.sub
                },
                schema
            },
            ConditionExpression: "attribute_not_exists(pk) and attribute_not_exists(sk)",
        }
        const res = await db.put(params).promise();
        await lib.insertToAudit({ pk: event.requestContext.authorizer.claims.sub,
            currentValue: event.body }, lib.AUDIT_ACTIONS.CREATE_ITEM_TYPE);
        return {
            statusCode: 201,
            headers: {
                ContentType: "application/json",
            },
            body: JSON.stringify({
                "message": "ItemType created successfully"
            })
        };
    }
    catch (ex) {
        console.log("exception", ex.message);
        return lib.return500Response({"code": 500, "message": ex.message})
    }



};

exports.createItemTypes = middy(createItemTypes).use(cors()).use(jsonBodyParser()).use(validator({inputSchema})).use(httpError()).use(lib.checkPermisson()).onError(lib.fnErrors);
exports.getItemTypes = middy(getItemTypes).use(cors()).use(httpError()).onError(lib.fnErrors);
