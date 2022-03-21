const return500Response = (data) => {

console.log(JSON.stringify(data));
    return {
        'headers': {
            'Content-Type': 'application/json'
        },
        'statusCode': 500,
        'body': JSON.stringify({
            'error': data
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
        const sub = request.event.requestContext.authorizer.claims.sub;
        const db = new AWS.DynamoDB.DocumentClient();
        const params = {
            TableName: 'UsersCollection',
            Key: {
                "pk": sub,
                "sk": "USER#ID"
            },
            ProjectionExpression: "email, #roles",
            ExpressionAttributeNames: {
                "#roles": "roles"
            }
        };
        const rp = await db.get(params).promise();
        if (!rp.hasOwnProperty("Item")) {
            console.log("User has no role attached");
            return {
                statusCode: 401,
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({"code": 401, "message": "unauthorized"})
            };

        }
        const roles = rp["Item"]["roles"];
        console.log(JSON.stringify(roles));
        if (roles) {
            Object.assign(request.context,{"roles":roles})
        }
    }
    return {
        before: logical
    }
};



exports.getItemByPk = getItemByPk;
exports.putItem = putItemByPk;
exports.updateItem = updateItemByPk;
exports.return500Response = return500Response;
exports.obtainCountry = obtainCountry;
exports.checkPermission = checkPermissions
