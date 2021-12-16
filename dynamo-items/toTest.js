const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
dayjs.extend(utc);

console.log(dayjs.utc().valueOf());

let pk="#PY#BASIC_CREDENTIALS#AMAZON_PRIME#FOX#2009daedd0";

console.log(pk.split("#"));



const toFlter =" RESOURCE_GROUP IS NONE AND BACKEND_NAME= SOMETHING AND";
console.log(toFlter.slice(0,-3));
