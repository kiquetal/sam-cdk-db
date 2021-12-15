const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
dayjs.extend(utc);

console.log(dayjs.utc().valueOf());

let pk="#PY#BASIC_CREDENTIALS#AMAZON_PRIME#FOX#2009daedd0";

console.log(pk.split("#"));

const myObject = {key:"hola",world:"py",complex:{"j":"na","na":344234}};
Object.entries().forEach(([key,item])=>{
console.log("key=" + key + " item " + JSON.stringify(item));
});
