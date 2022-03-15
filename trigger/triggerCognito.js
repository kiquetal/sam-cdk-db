const AWS = require("aws-sdk");
const cognitoHandler = async(event,context) => {

    console.log(event.request.userAttributes)

    let userType="SERVERID"
    if (event.request.userAttributes.hasOwnProperty("identities"))
    {
        userType="USERID"
    }
    const db =new AWS.DynamoDB.DocumentClient();
    const params = {
        TableName: 'UsersCollection',
        Item: {
            pk:event.request.userAttributes["sub"],
            sk:userType,
            email:event.request.userAttributes["email"]

        },
        ConditionExpression:"attribute_not_exists(pk) AND attribute_not_exists(sk)"
    };

    try {
        await db.put(params).promise()
    }
    catch (e)
    {
        console.log("error",e.message)
    }

    return event

}
exports.main = cognitoHandler
