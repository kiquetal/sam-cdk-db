const AWS = require("aws-sdk");
const removeUserFn = async(event,context)=>{
    const USERNAME = process.env.USERNAME
    const POOL_ID = process.env.POOL_ID
    const cognito = new AWS.CognitoIdentityServiceProvider();
    try {
        await cognito.adminDeleteUser({
            UserPoolId:POOL_ID,
            Username:USERNAME
        }).promise();
    }
    catch (exception) {
        console.log("error-for-delete",exception);
        return {
            "message":"error"
        }

    }
    return {
          "message":"finish"
    }


}
exports.removeUser = removeUserFn
