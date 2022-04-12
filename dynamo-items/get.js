const AWS = require("aws-sdk");
const middy = require("@middy/core");
const lib = require('./lib');
const util = require('./util');
const cors = require('@middy/http-cors');
const {AUDIT_ACTIONS} = require("./lib");

const options = {
    region: "localhost",
    endpoint: "http://dynamodb:8000",
    secretAccessKey: 'aasa',
    accessKeyId: 'asdsd'
};


exports.handler=async (event, context) => {
    const db = new AWS.DynamoDB.DocumentClient(options);

    console.log(event.pathParameters.itemId)
    response = {
        'headers': {
            'Content-Type':'application/json'
        },
        'statusCode': 200,
        'body': JSON.stringify({
            message: 'GET-ITEM',
            // location: ret.data.trim()
        })
    }

    return response;

};

const filteredByAccessGroup=(items, accessGroup)=> {

    if (accessGroup.length === 0) {
        return [];
    }
   return items.filter(item => {
           return accessGroup.find(group => {
                return item.accessGroup.includes(group)
            });
    });



}

const obtainRoleFromContext=(roles, country)=> {
    if (roles.length === 0) {
        return false;
    }
    if (roles.includes("admin")) return true;
    const filteredRole =roles.filter(role => {
        return role.includes(country);
    });
    console.log("roles from auth", JSON.stringify(roles));
    console.log("roles from query", country);
    return filteredRole.length > 0


}

const baseHandlerCountryType=async (event,context)=> {


    console.log(JSON.stringify(event));
    if (event.hasOwnProperty("warmInput"))
    {
        console.log("warmInput detected");
        return "ok"
    }

    console.log("env" +process.env.ISLOCAL);
    console.log("context",context);
    console.log("change event");


    const roles = context.hasOwnProperty("roles")?context["roles"]?context["roles"]:[]:[];
    const accessGroup = context.hasOwnProperty("accessGroup")?context["accessGroup"]?context["accessGroup"]:[]:[];
    const sub = event.requestContext.authorizer.claims.sub;
    const db =process.env.ISLOCAL=="true"?new AWS.DynamoDB.DocumentClient(options):new AWS.DynamoDB.DocumentClient();
    let {country, type} = event.pathParameters;

    let expressionAttributesValues = {
        ':country': country.toUpperCase(),
        ':typeItem': type.toUpperCase(),

    };
    const params = {
        TableName: 'AccountsCollection',
        IndexName: 'TypeItemCountryIndex',
        KeyConditionExpression: 'country = :country and typeItem = :typeItem',
        ExpressionAttributeValues: expressionAttributesValues,
    };

    if (event.queryStringParameters) {
        params['FilterExpression'] = "";
        let filterExpression = "";
        let indexTerm=0;
        Object.entries(event.queryStringParameters).forEach(([key, item]) => {
            if (key!="conditions" && key!="tags") {
                params.ExpressionAttributeValues[`:${key}`] = `${item}`
                params['FilterExpression'] += `${key} = :${key} AND `
            }
            else
            {
               const teramToSearch = item.split(",")
               console.log(JSON.stringify(teramToSearch))

                teramToSearch.forEach((term,index) => {

                    params.ExpressionAttributeValues[`:con_${indexTerm}`] = `${term}`
                    filterExpression += ` contains(${key},:con_${indexTerm})  AND`

                });
                console.log(filterExpression.substring(0, filterExpression.length - 3));
                indexTerm++;
            }
        });
        params['FilterExpression'] = params['FilterExpression'].slice(0, -4);
        if (filterExpression>"")
        {
            if (params['FilterExpression'].length>0)
            {
                params['FilterExpression'] += " AND " + filterExpression.substring(0, filterExpression.length - 3);
            }
            else
            {
                params['FilterExpression'] = filterExpression.substring(0, filterExpression.length - 3);
            }
        }
    }
    console.log(JSON.stringify(params));
    try {

        let dynamoResponse = await db.query(params).promise();
        let items = dynamoResponse["Items"]
        while  (dynamoResponse.LastEvaluatedKey)
        {
            params["ExclusiveStartKey"]=dynamoResponse.LastEvaluatedKey
            dynamoResponse = await db.query(params).promise();
            items=items.concat(dynamoResponse["Items"])
        }


        let filteredList=[]
        const isAdminOrCountryContext = obtainRoleFromContext(roles,country.toLowerCase());
        if (isAdminOrCountryContext)
        {
               filteredList = items;
        }
        else {

            console.log("accessGroup from user:" + accessGroup);
            filteredList = filteredByAccessGroup(items, accessGroup);
            console.log(JSON.stringify(filteredList));

            if (context.isServer==true)
            {
                console.log("isServer");
               filteredList = await decryptListKms(filteredList);
            }

            await  lib.insertToAudit({
                pk: sub,
                items: filteredList.map(value => value["pk"]),
            },AUDIT_ACTIONS.GET)

        }
        return {
            'headers': {
                'Content-Type': 'application/json'
            },
            'statusCode': 200,
            'body': JSON.stringify(filteredList)
        };
    } catch (err) {

        if (err.message)
            return lib.return500Response({"message":err.message});
        else
            return lib.return500Response(err.message);

    }
}

const decryptListKms= async (list) =>{

    const decrypt = []
    for (const item in list)
    {

       if (list[item]["enc"]=="true")
       {
           const dItem = await util.decrypt(list[item].data)
          list[item].data=JSON.parse(dItem);
       }
       decrypt.push(list[item])

    }
    return decrypt;
}



exports.handlerCountryType= middy(baseHandlerCountryType).use(cors()).use(lib.checkPermission()).onError(lib.fnErrors);

