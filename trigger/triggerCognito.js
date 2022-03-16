const AWS = require("aws-sdk");
const cognitoHandler = async(event,context) => {

    console.log(event.request.userAttributes)

    let userType="SERVER#ID"
    if (event.request.userAttributes.hasOwnProperty("identities"))
    {
        userType="USER#ID"
    }
    const db =new AWS.DynamoDB.DocumentClient();
    const params = {
        TableName: 'UsersCollection',
        Item: {
            pk:event.request.userAttributes["sub"],
            sk:userType,
            email:event.request.userAttributes["email"],
            typeItem:"USER"

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
