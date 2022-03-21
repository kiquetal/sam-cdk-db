const AWS = require("aws-sdk");
const batchUpdate=async (event,context) => {
    try {
        const db = new AWS.DynamoDB.DocumentClient();
        const params = {
            TableName:'AccountsCollection',
            IndexName:'TypeItemCountryIndex',
            KeyConditionExpression: 'country = :country and typeItem = :typeItem',
            ExpressionAttributeValues:{
                ":country":"co",
                ":typeItem":"MSISDN"
            },
            ProjectionExpression:"pk,country"
        }
        let dynamoResponse = await db.query(params).promise();
        let items = dynamoResponse["Items"]
        while  (dynamoResponse.LastEvaluatedKey)
        {
            params["ExclusiveStartKey"]=dynamoResponse.LastEvaluatedKey
            dynamoResponse = await db.query(params).promise();
            items=items.concat(dynamoResponse["Items"])
        }

        const paramsToUpdate = {
            "TransactionItems":[]
        } ;
        items.forEach(value => {
           paramsToUpdate["TransactionItems"].push(createPutRequest(value)) ;

        });
        console.log(JSON.stringify(paramsToUpdate));



    }
    catch(exception)
    {

    }



const createPutRequest=(item)=>{
        return {
            Update:{
                TableName:'AccountsCollection',
                Key:{
                    pk: item["pk"],
                    country: item['country']
                },
                UpdateExpression:"set accessGroup = :accessGroup",
                ExpressionAttributeValues: {
                    ':accessGroup':'public'
                }
            }
        }

}


};
exports.batchUpdate = batchUpdate
