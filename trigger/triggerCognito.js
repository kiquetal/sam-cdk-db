const AWS = require("aws-sdk");
const cognitoHandler = async(event,context) => {

    console.log(event.request.userAttributes)

    let userType="SERVERID"
    if (event.request.userAttribtes.hasOwnProperty("identities"))
    {
        userType="USERID"
    }
    const db =new AWS.DynamoDB.DocumentClient();
    const params = {
        TableName: 'UsersTable',
        Item: {
            pk:event.request.userAttributes["sub"],
            sk:userType,
            email:event.request.userAttributes["email"]

        },
        ConditionExpression:"attribute_not_exists(pk) AND atribute_not_exists(sk)"
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
