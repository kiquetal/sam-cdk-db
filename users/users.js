const AWS = require("aws-sdk");
const cors = require('@middy/http-cors');
const middy = require("@middy/core");
const  jsonBodyParser = require('@middy/http-json-body-parser');
const httpError = require('@middy/http-error-handler');
const lib = require("lib");
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


const creatUser = async(event,context) => {
    try {
        const body = JSON.parse(event.body);
        const params = {
            UserPoolId: proccess.env.UserPoolId,
            Username: body["username"],
            MessageAction: "SUPPRESS",
            UserAttributes:[
                {
                    "Name":"email",
                    "Value":body["username"]
                },
                {
                  "Name":"email_verified",
                  "Value":"true"
                }
            ]
        }

        const cognito = new AWS.CognitoIdentityServiceProvider();
        await cognito.adminCreateUser(params).promise()

    }
    catch (exception)
    {
        console.log("creating user exception",ex);
    }
}

exports.createUser = middy(creatUser).use(jsonBodyParser()).use(httpError()).use(cors()).onError(async (req) => {
    if (req.error) {
        return lib.return500Response(req.error);
    }
})
exports.removeUser = removeUserFn
