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

    try {
        const {name, description} = event.body;
        const sub = event.requestContext.authorizer.claims.sub;
        const db = new AWS.DynamoDB.DocumentClient();
        const params = {
            TableName: "RolesAccessCollection",
            Item: {
                "pk": name,
                "sk":"access#role",
                "description": description,
                "typeItem": "role",
                "createdAt": dayjs().utc().format(),
                "creator":{
                    "sub": sub,
                    "email":context.email
                }

            },
            ConditionExpression: "attribute_not_exists(pk)",
            ReturnValues: "ALL_OLD"
        };
        const res = await db.put(params).promise();
        console.log(JSON.stringify(res));
        return {
            statusCode: 201,
            headers: {
                ContentType: "application/json",
            },
            body: JSON.stringify({
                "message": "Role created successfully"
            })
        }
    }
    catch(ex)   {
        console.log("exception",ex.message);
        return lib.return500Response({"code":500,"message":ex.message})

    }




}

const inputSchema = {
    type: 'object',
    properties: {
        body: {
            type: 'object',
            properties: {
                name: {type: 'string'},
                description: {type: 'string'}
            },
            required: ['name']
        }
    }
}
const assignRole= async (event,context)=>{
    try {
        let { role, subId } = event.body;
        const rp = await executeQuery("role");
        const rolesDB= rp["Items"].map(v => {
            return v["pk"]
        });

        if (rolesDB.includes(role))
        {

            const db = new AWS.DynamoDB.DocumentClient();
            const listToAdd = [role];
           if (await hasAlreadyRole(role,subId)) {
               return {
                   statusCode: 400,
                   headers: {
                       "Content-Type": "application/json"
                   },
                   body: JSON.stringify({"code": 400, "message": "User has already specific role"})
               };
           }
            const params = {
                TableName: 'UsersCollection',
                Key:{
                    pk:subId,
                    sk:"USER#ID"
                },
                UpdateExpression:"SET #role = list_append(if_not_exists(#role,:emptyList),:listAdd)",
                ExpressionAttributeNames:{
                    "#role":"roles"
                },
                ExpressionAttributeValues: {
                    ":listAdd":listToAdd,
                    ":emptyList":[]
                },
                ReturnValues:"ALL_NEW"
            }

            const res = await db.update(params).promise();

            return {
                "statusCode":200,
                "headers":{
                    "Content-Type":"application/json"
                },
                body:JSON.stringify(res)
            }
        }
        else
        {
            return {
                 statusCode:400,
                headers:{
                     "Content-Type":"application/json"
                },
                body:JSON.stringify({
                     "code":400,

                    "message":"Role not exists"
                })

            };
        }

    }
    catch(ex)
    {
        console.log("exception assign role",ex.message);
    }
};

const hasAlreadyRole = async (role,subId) =>
{
    try {
        const db= new AWS.DynamoDB.DocumentClient();
        const params = {
            TableName:"UsersCollection",
            Key:{
                "pk":subId,
                "sk":"USER#ID"
            },
            ProjectionExpression:"#roles",
            ExpressionAttributeNames: {
                "#roles":"roles"
            }
        };

        const rp= await db.get(params).promise()
        console.log(JSON.stringify(rp));cd
        if (!rp.hasOwnProperty("Item"))
            return false;
        const roles= rp["Item"]["roles"];
        if (roles.includes(role.toLowerCase()))
            return true;

        return false;
    }
    catch(ex)
    {
        console.log("error checkrole",ex.message);
        return false
    }


}

const createAccessGroup= async(event,context)=>{

    try {
        const { accessGroup, description } = event.body;
        const db = new AWS.DynamoDB.DocumentClient();
        const params = {
            TableName: 'RolesAccessCollection',
            Item: {
                pk: accessGroup,
                sk: "access#group",
                description: description,
                typeItem: "accessGroup",
                creator:{
                    email:context.email,
                    sub:event.requestContext.authorizer.claims.sub
                },
                createdAt:  dayjs.utc().format()
            }
        };
        const res = await db.put(params).promise();
        return {
            "statusCode":200,
            "headers":{
                "Content-Type":"application/json"
            },
            body:JSON.stringify({
                "message":"Access group created"
            })
        }
    }
    catch (e) {
        console.log("error create access group",e.message);
        return lib.return500Response({"code":500,"message":e.message})
    }

}

exports.obtainRoles = middy(obtainRoles).use(cors()).use(httpError()).use(lib.checkPermisson()).onError(lib.fnErrors);
exports.obtainAccessGroups = middy(obtainAccessGroup).use(cors()).use(httpError()).onError(lib.fnErrors);
exports.createRoles = middy(createRole).use(cors()).use(jsonBodyParser()).use(lib.checkPermisson()).use(validator({inputSchema:inputSchema})).onError(lib.fnErrors);
exports.asssingRoles = middy(assignRole).use(lib.checkPermisson()).use(cors()).use(jsonBodyParser()).onError(lib.fnErrors);
exports.createAccessGroups = middy(createAccessGroup).use(cors()).use(jsonBodyParser()).use(lib.checkPermisson()).onError(lib.fnErrors);
