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

const createItemTypes = async (event,context) => {

    const { roles } = context;
    console.log(JSON.stringify(roles));
};

exports.createItemTypes = middy(createItemTypes).use(cors()).use(httpError()).use(lib.checkPermisson()).onError(lib.fnErrors);
