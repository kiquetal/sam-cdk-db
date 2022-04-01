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

const obtainItems = async (event,context) => {

    try
    {

        console.log(JSON.stringify(event.queryStringParameters));
        const { subId , ...rest}= event.queryStringParameters;


        const { country, itemType} = event.pathParameters
        console.log(subId);
        console.log(country);
        console.log(itemType);
        const db = new AWS.DynamoDB.DocumentClient();

        const params = {
            TableName: 'UsersCollection',
            Key: {
                'pk': subId,
                'sk': 'SERVER#ID'
            }
        }
        const rp = await db.get(params).promise()
        if (rp && rp.hasOwnProperty("Item")) {
            const password = await util.decrypt(rp["Item"]["password"])
            const username = rp["Item"]["email"]
            const cognito = new AWS.CognitoIdentityServiceProvider();
            const initAuth = {
                AuthFlow: "ADMIN_USER_PASSWORD_AUTH",
                UserPoolId: process.env.POOL_ID,
                ClientId: process.env.CLIENT_ID,
                AuthParameters: {
                    USERNAME: username,
                    PASSWORD: JSON.parse(password)
                }
            }
            const resp = await cognito.adminInitiateAuth(initAuth).promise()
            const idToken = resp["AuthenticationResult"]["IdToken"]

            axios.get(process.env.URL_ITEMS+`/items/query/${country}/${itemType}`,{
                headers:{
                    "Authorization": idToken
                },
                params:rest
            }).then(resp => {
                console.log(resp.data);
                return {
                    statusCode: 200,
                    body: JSON.stringify(resp.data)
                }
            }).catch(err => {
                return {
                    statusCode: 500,
                    body: JSON.stringify(err)
                }
            })

        }

    }
    catch (e)   {
        console.log(e);
        return lib.return500Response({ code: "500", message: e.message});
    }



}

exports.obtainItems = middy(obtainItems).use(cors()).use(httpErrorHandler());
