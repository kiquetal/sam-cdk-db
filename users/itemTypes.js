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

const inputSchema = {
    type: 'object',
    properties: {
        body: {
            type: 'object',
            properties: {
                name: {type: 'string'},
                schema: {type: 'object'}
            },
            required: ['name,schema'] // Insert here all required event properties
        }
    }
}


const createItemTypes = async (event,context) => {
    const { roles } = context;
    console.log(JSON.stringify(roles))
    if (!roles.includes("admin"))
    {
        return {
            statusCode:403,
            headers:{
                'Content-Type':"application/json"
            },
            body:JSON.stringify({
                "code":403,
                "message":"Forbidden"
            })
        };
    }
    const { name, schema } = event.body;



    return lib.returnResponse(201, {
        "name":name,
        "schema":schema
    });


};

exports.createItemTypes = middy(createItemTypes).use(cors()).use(jsonBodyParser()).use(validator({inputSchema})).use(httpError()).use(lib.checkPermisson()).onError(lib.fnErrors);
