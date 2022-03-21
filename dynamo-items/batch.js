const AWS = require("aws-sdk");
const batchUpdate=async (event,context) => {
    try {
        const db = new AWS.DynamoDB.DocumentClient();
        const params = {
            TableName: 'AccountsCollection',
            IndexName: 'TypeItemCountryIndex',
            KeyConditionExpression: 'country = :country and typeItem = :typeItem',
            ExpressionAttributeValues: {
                ":country": "BO",
                ":typeItem": "BASIC_CREDENTIALS"
            },
            ProjectionExpression: "pk,country"
        }
        let dynamoResponse = await db.query(params).promise();
        let items = dynamoResponse["Items"]
        while (dynamoResponse.LastEvaluatedKey) {
            params["ExclusiveStartKey"] = dynamoResponse.LastEvaluatedKey
            dynamoResponse = await db.query(params).promise();
            items = items.concat(dynamoResponse["Items"])
        }


        //transactionWrite
        console.log(JSON.stringify(items));
        await transactionWrite(db,items);

        console.log("finish update");
    } catch (exception) {

        console.log(exception.message)
    }

};

const transactionWrite = async (db,items)=>{


    const params= {
        TransactItems:[]
    };

    try {
        items.forEach(async values => {

            params["TransactItems"].push(createTransactionWriteItem(values));

            if (params["TransactItems"].length % 25 === 0) {
                try {
                    await db.transactWrite(params).promise()
                    console.log("execution" + JSON.stringify(params["TransactItems"]));
                    params["TransactItems"] = [];
                } catch (ex) {
                    console.log(ex.message);
                }
            }

        });
        if (params["TransactItems"].length > 0) {
            console.log(params);
            await db.transactWrite(params).promise()
        }

    }

    catch(ex)
    {
        console.log(ex.message);
    }
};

const batchWrite= async (db,items)=>{
    const paramsToUpdate = {
        "RequestItems": {
            'AccountsCollection':[]
        }
    };
    items.forEach(async value => {
        paramsToUpdate["RequestItems"]["AccountsCollection"].push(creatEDeleteItem(value))

        if (paramsToUpdate["RequestItems"]["AccountsCollection"].length % 25 == 0)
        {
            try {
                await db.batchWrite(paramsToUpdate).promise()
                console.log("execution" + JSON.stringify(paramsToUpdate["RequestItems"]["AccountsCollection"]));
                paramsToUpdate["RequestItems"]["AccountsCollection"] = [];
            }
            catch(ex)
            {
                console.log(ex.message);
            }
        }
    });

    if (paramsToUpdate["RequestItems"]["AccountsCollection"].length>0) {

        await db.batchWrite(paramsToUpdate).promise()

    }

}

const createTransactionWriteItem=(item)=>{
return {
    Update: {
        TableName:'AccountsCollection',
        Key:{
            pk:item["pk"],
            country:item["country"]
        },
        UpdateExpression: "set accessGroup = :accessGroup",
        ExpressionAttributeValues: {
            ":accessGroup":"public"
        }
    }
}
}

const createDeleteItem=(item) => {

    return {
        DeleteRequest: {
            Key: {
                "pk": item["pk"],
                "country": item["country"]
            }
        }
    };
}
const createPutRequest=(item)=>{
        return {
            PutRequest:{
                Item:{
                    pk:item["pk"],
                    country:item["country"],
                    accessGroup:"public"
                }
            }
        }

}



exports.batchUpdate = batchUpdate
