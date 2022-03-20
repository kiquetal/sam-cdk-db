const cors = require('@middy/http-cors');
const middy = require("@middy/core");
const jsonBodyParser = require('@middy/http-json-body-parser');
const AWS = require("aws-sdk");
const lib = require("./lib");
const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const validator = require('@middy/validator');

const httpError = require("@middy/http-error-handler");
dayjs.extend(utc);
const obtainRoles = async(event,context)=>{

    try {

        console.log(JSON.stringify(context));
        const rp = await executeQuery("role");
        return lib.returnResponse(200,  {
                "roles":rp["Items"]
                }
        );

    }
    catch(ex)
    {
        return lib.return500Response({"code":500,"message":ex.message})
    }
}

const executeQuery = async (typeItem)=>{

    try {
        const db = new AWS.DynamoDB.DocumentClient();
        const params = {
            TableName: "RolesAccessCollection",
            IndexName: "index_by_typeItem",
            KeyConditionExpression: "typeItem = :type",
            ExpressionAttributeValues: {
                ":type": typeItem
            }
        }
        const items = await db.query(params).promise()
        return items;
    }
    catch( ex)
    {
        throw new Error(ex.message);
    }
}

const obtainAccessGroup = async(event,contex)=> {

    try {

        const rp = await executeQuery("accessGroup");
        return lib.returnResponse(200,{
            "accessGroup":rp["Items"]
        })

    }
    catch(ex)
    {
        return lib.return500Response({"code":500,"message":ex.message})
    }

}

const createRole = async(event,context)=>{

    const { name ,description } = event.body;





}

const inputSchema = {
    type: 'object',
    properties: {
        body: {
            type: 'object',
            properties: {
                name: {type: 'string'},
                description: {type: 'object'}
            },
            required: ['name']
        }
    }
}

const checkPermissions = () => {

    const checkPermission=(request)=> {





    };


    return {
         after:checkPermission
    }

}

exports.obtainRoles = middy(obtainRoles).use(cors()).use(httpError()).use(lib.checkPermisson()).onError(lib.fnError);
exports.obtainAccessGroups = middy(obtainAccessGroup).use(cors()).use(httpError()).onError(lib.fnError);
exports.createRoles = middy(createRole).use(cors()).use(jsonBodyParser()).use(httpError()).use(validator({inputSchema:inputSchema})).onError(lib.fnError)
