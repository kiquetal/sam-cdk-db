
const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
dayjs.extend(utc);

const return500Response = (data) => {

console.log(JSON.stringify(data));
    return {
        'headers': {
            'Content-Type': 'application/json'
        },
        'statusCode': 500,
        'body': JSON.stringify({
            code:500,
            message: data
        })

    };
}
const updateItemByPk = async (db, params) => {


    try {

        console.log(JSON.stringify(params));
        return await db.update(params).promise();
    } catch (err) {
        console.log("error" + err.message);
        console.log(JSON.stringify(err));
        return return500Response(err);
    }


}


const putItemByPk = async (db, params) => {

    try {
        console.log(JSON.stringify(params));
        await db.put(params).promise();

        return await db.get({
            TableName: 'AccountsCollection',
            Key: {
                pk: params.Item.pk,
                country: params.Item.country
            }
        }).promise();
    } catch (err) {
        return return500Response(err);


    }
}

const getItemByPk = async (db, params) =>
{
console.log("from getItem");
console.log(JSON.stringify(params));
    try {
        return await db.get(params).promise();
    } catch (err) {
        return return500Response(err);
    }


}

const  obtainCountry = (pk) => {

    const [_, country, ...rest] = pk.split("#");
    return country;

}


const checkPermissions = () => {
    const AWS = require("aws-sdk");
    const logical = async (request) => {

        if (request.event.hasOwnProperty("warmInput")){
            console.log("warmInput detected-middleware");
            return "ok"
        }

        const sub = request.event.requestContext.authorizer.claims.sub;
        const db = new AWS.DynamoDB.DocumentClient();
        const paramsUsers = {
            TableName: 'UsersCollection',
            Key: {
                "pk": sub,
                "sk": "USER#ID"
            },
            ProjectionExpression: "email, #roles, accessGroup",
            ExpressionAttributeNames: {
                "#roles": "roles"
            }
        };
        const paramsServers = {
            TableName: 'UsersCollection',
            Key: {
                "pk": sub,
                "sk": "SERVER#ID"
            },
            ProjectionExpression: "email, #accessGroup",
            ExpressionAttributeNames: {
                "#accessGroup": "accessGroup"
            }
        };

        let rp = await db.get(paramsUsers).promise();
        if (!rp.hasOwnProperty("Item")) {
            rp = await db.get(paramsServers).promise();
            if (rp.hasOwnProperty("Item"))
            {
                const roles = rp["Item"]["roles"];
                const accessGroup = rp["Item"]["accessGroup"];
                Object.assign(request.context,{"roles":roles,"accessGroup":accessGroup,"isServer":true});
                console.log(JSON.stringify(rp["Item"]));

            }
            else {
                console.log("not recognized user");
            }
        }
        else
        {
            const roles = rp["Item"]["roles"];
            const accessGroup = rp["Item"]["accessGroup"];
            Object.assign(request.context,{"roles":roles,"accessGroup":accessGroup,"isServer":false});
        }

    }
    return {
        before: logical
    }
};


const fnError=async (req)=> {
    if (req.error) {
        return return500Response(req.error);

    }
};

const AUDIT_ACTIONS = {
    CREATE: "CREATE_ITEM",
    UPDATE: "UPDATE_ITEM",
    DELETE: "DELETE_ITEM",
    GET: "GET_ITEM",
    CREATE_SERVER: "CREATE_SERVER",
    DELETE_SERVER: "DELETE_SERVER",
    UPDATE_SERVER: "UPDATE_SERVER",
    };

const insertToAudit= async ({pk,...rest},action) => {

    const AWS = require("aws-sdk");
    const db = new AWS.DynamoDB.DocumentClient();
    const params = {
        TableName: 'AuditCollection',
        Item: {
            pk: pk,
            sk: dayjs().utc().format("YYYY-MM-DDTHH:mm:ss.SSS"),
            ...rest,
            action: action,
            timestamp: dayjs.utc().unix()
        }
    };
    try {
        await db.put(params).promise();
    }
    catch (err) {
        console.log(err);
    }

}




exports.getItemByPk = getItemByPk;
exports.putItem = putItemByPk;
exports.updateItem = updateItemByPk;
exports.return500Response = return500Response;
exports.obtainCountry = obtainCountry;
exports.checkPermission = checkPermissions
exports.fnErrors = fnError
exports.insertToAudit = insertToAudit;
exports.AUDIT_ACTIONS = AUDIT_ACTIONS;
