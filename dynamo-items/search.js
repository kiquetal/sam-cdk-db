const middy = require("@middy/core");
const AWS = require("aws-sdk");
const cors = require('@middy/http-cors');
const utilEncrypt = require('./util');
const  jsonBodyParser = require('@middy/http-json-body-parser');
const lib = require("lib");
const dayjs = require("dayjs");
const utc = require('dayjs/plugin/utc');
dayjs.extend(utc);
const options = {
    region: "localhost",
    endpoint: "http://dynamodb:8000",
    secretAccessKey: 'aasa',
    accessKeyId: 'asdsd'
};
const baseSearchHandler = async(event,context) => {


    try {

        console.log("env" +process.env.ISLOCAL);
        const db =process.env.ISLOCAL=="true"?new AWS.DynamoDB.DocumentClient(options):new AWS.DynamoDB.DocumentClient();
        let { pk } = event.body;

        let resp = await lib.getItemByPk(db, {
            TableName: 'AccountsCollection',
            Key: {
                'pk': pk,
                'country': lib.obtainCountry(pk)
            }
        });

        console.log(JSON.stringify(resp));

        if (resp && !resp.hasOwnProperty("Item"))
        {
            return {
                'headers': {
                    'Content-Type': 'application/json'
                },
                'statusCode': 404,
                'body': JSON.stringify({
                  "error":{
                      "message":"Item not found"
                  }
                })
            };
        }
        if (resp.Item.hasOwnProperty("enc"))
        {
            resp.Item.data = JSON.parse(await utilEncrypt.decrypt(resp.Item.data));

        }
        console.log(resp.Item.ttl);
        if (resp.Item.hasOwnProperty("ttl"))
        resp.Item.ttl=dayjs.unix(resp.Item.ttl).utc(true).format()

        return {
                'headers': {
                    'Content-Type': 'application/json'
                },
                'statusCode': 200,
                'body': JSON.stringify({
                    ...resp.Item
                })
        };
    }
    catch (err)
    {
        if (err.message)
            return lib.return500Response({"message":err.message});
        else
            return lib.return500Response(err.message);

    }

};
exports.searchHandler= middy(baseSearchHandler).use(cors()).use(jsonBodyParser());
