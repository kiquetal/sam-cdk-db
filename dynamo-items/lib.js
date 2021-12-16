const return500Response = (data) => {


    return {
        'headers': {
            'Content-Type': 'application/json'
        },
        'statusCode': 500,
        'body': JSON.stringify({
            'error': data
        })

    };
}
const updateItemByPk = async (db, params) => {


    try {

        console.log(JSON.stringify(params));
        return await db.update(params).promise();
    } catch (err) {
        console.log("error" + err.message);
        console.log(JSON.stringify(err));
        return return500Response(err);
    }


}


const putItemByPk = async (db, params) => {

    try {
        console.log(JSON.stringify(params));
        await db.put(params).promise();

        return await db.get({
            TableName: 'AccountsCollection',
            Key: {
                pk: params.Item.pk,
                country: params.Item.country
            }
        }).promise();
    } catch (err) {
        return return500Response(err);


    }
}

const getIemByPk = async (db, params) => {


    try {
        console.log(JSON.stringify(params));
        return await db.get(params).promise();
    } catch (err) {
        return return500Response(err);
    }


}
exports.getItemByPk = getIemByPk;
exports.putItem = putItemByPk;
exports.updateItem = updateItemByPk;
exports.return500Response = return500Response;
