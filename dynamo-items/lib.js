

const updateItemByPk = async(db,params) =>
{


 try {

  console.log(JSON.stringify(params));
  let responseDynamod = await db.update(params).promise();

  return responseDynamod;
 }
 catch (err)
 {
  console.log("error" + err.message);
  console.log(JSON.stringify(err));
  return {
   'headers': {
    'Content-Type': 'application/json'
   },
   'statusCode': 500,
   'body': JSON.stringify({
    'error': err
   })
  }
 }

};

const putItemByPk = async(db,params)=> {

 try {
  console.log(JSON.stringify(params));
   await db.put(params).promise();

  let dynamoResponse = await db.get({
   TableName: 'AccountsCollection',
   Key: {
    pk: params.Item.pk,
    country: params.Item.country
   }
  }).promise();
  return dynamoResponse;
 } catch (err) {
  return {
   'headers': {
    'Content-Type': 'application/json'
   },
   'statusCode': 500,
   'body': JSON.stringify({
    'error': err
   })
  };


 }
}

const getIemByPk = async (db, params) => {


 try {
  console.log(JSON.stringify(params));
  let dynamoResponse = await db.get(params).promise();

  return dynamoResponse;
 }
 catch(err)
 {
  return {
   'headers': {
    'Content-Type':'application/json'
   },
   'statusCode': 500,
   'body': JSON.stringify({
    'error':err
   })
  };
 }


}
exports.getItemByPk = getIemByPk;
exports.putItem = putItemByPk;
exports.updateItem = updateItemByPk;
