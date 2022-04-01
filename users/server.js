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
dayjs.extend(utc);

const obtainItems = (event,context) => {

    try
    {

        const subId = event.queryStringParameters.subId;
        console.log(subId)

    }
    catch (e)   {
        console.log(e);
        return lib.return500Response({ code: "500", message: e.message});
    }



}

exports.obtainItems = middy(obtainItems).use(cors()).use(httpErrorHandler());
