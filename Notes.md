## Create network within docker
docker network create lambda-local


## Start a dynamodb locally using the same network docker
docker run -d -v "$PWD":/dynamodb_local_db -p 8000:8000 --network lambda-local --name dynamodb cnadiminti/dynamodb-local

## Start sam-beta-cdk with the desired network
sam-beta-cdk local start-api --docker-network lambda-local

## Create table

aws dynamodb create-table     --table-name MusicCollection     --attribute-definitions AttributeName=Artist,AttributeType=S AttributeName=SongTitle,AttributeType=S     --key-schema AttributeName=Artist,KeyType=HASH AttributeName=SongTitle,KeyType=RANGE     --provisioned-throughput ReadCapacityUnits=5,WriteCapacityUnits=5     --tags Key=Owner,Value=blueTeam --endpoint http://127.0.0.1:8000 --profile devKiquetal

## Dynamodb data types

https://usefulangle.com/post/332/dynamodb-attribute-types


AWS DynamoDB supports 10 different data types for attribute values in a table. They are :

Number
String
Boolean
Null
Binary
List
Map
Number Set
String Set
Binary Set

1) Number Data Type — N
The number data type represented by N is used to store a number.

Number can be positive, negative or zero.
Number can be integer or float (up to 38 digits of precision).
To maximize compatibility, DynamoDB sends numbers across the network as strings. However internally they are treated as numbers while performing calculations.
Leading and trailing zeros are truncated.
10

15.5

-23.76676786768778

0

2) String Data Type — S
The string data type represented by S is used to store a UTF-8 encoded string.

Hello

Wat's up

3) Boolean Data Type — BOOL
The boolean data type represented by BOOL is used to store a boolean value — either true or false.

true

false

4) Null Data Type — NULL
The null data type represented by NULL is used to store a value that is null, undefined or signifies an unknown state.

Values allowed can be either true (representing a null) or false (representing not null).
true

false

5) Binary Data Type — B
The binary data type represented by B is used to store binary data like base64 encoded image data, encrypted data etc.

bXkgc3VwZXIgc2VjcmV0IHRleHQh==

6) List Data Type — L
The list data type represented by L is used to store an ordered collection of values. This is similar to a JSON array.

Order of values is preserved.
Values of any data type can be stored. Items in the list can be of different types if required.
["Tree", "Sand"]

["Hello", "World", 100.54]

7) Map Data Type — M
The map data type represented by M is used to store an unordered collection of name-value pairs. This is similar to a JSON object.

Map is ideal for saving JSON data / document in DynamoDB.
Nested values can go up to 32 levels deep.
{
	"address": {
		"street_1": "19th Main",
		"street_2": "",
		"city": "Bangalore",
		"state": "KA" 
	}
}

8) Number Set Data Type — NS
The number set data type represented by NS is used to store a set of numbers.

Only numeric values are allowed. No other data type is allowed.
Each value must be unique within the set.
Order of values is not preserved.
Empty number set is not supported.
[42.2, -19, 7.5, 3.14]

9) String Set Data Type — SS
The string set data type represented by SS is used to store a set of UTF-8 strings.

Only string values are allowed. No other data type is allowed.
Each value must be unique within the set.
Order of values is not preserved.
Empty string set is not supported.
["Black", "Green", "Red"]

10) Binary Set Data Type — BS
The binary set data type represented by BS is used to store a set of binary values.

Each value must be unique within the set.
Order of values is not preserved.
Empty binary set is not supported.

### Create Secondary global indexes

aws dynamodb update-table \
   --table-name AccountsCollection \
   --attribute-definitions '[
       {
         "AttributeName":"country",
         "AttributeType":"S"
       },
       {
         "AttributeName":"typeAccount",
         "AttributeType":"S" 
       }]'\
  --global-secondary-index-updates '[
     {
      "Create": {
          "IndexName":"TypeAccountCountryIndex",
          "KeySchema":[
           {
            "AttributeName":"country",
            "KeyType":"HASH"
          },
          {
           "AttributeName":"typeAccount",
           "KeyType":"RANGE"
          }
       ],
        "Projection":{
            "ProjectionType":"ALL"
          },
        "ProvisionedThroughput":{
               "ReadCapacityUnits":1,
               "WriteCapacityUnits":1 
             }
         }
     }
     ]' \
    --endpoint http://127.0.0.1:8000 --profile devKiquetal

## Query Secondary index

   aws dynamodb query \
    --table-name AccountsCollection \
    --index-name TypeCountryIndex \
    --key-condition-expression "country = :country" \
    --expression-attribute-values  '{":country":{"S":"BO"}}'
    --endpoint http://127.0.0.1:8000 --profile devKiquetal


## Remove Secondary index

aws dynamodb update-table \
    --table-name Reply \
    --global-secondary-index-updates '[{
        "Delete":{
            "IndexName": "TypeCountryIndex"
        }
    }
]' --endpoint http://127.0.0.1:8000 --profile devKiquetal


## Eager container

sam-beta-cdk local start-api --docker-network lambda-local --warm-containers EAGER -n env.json


### Create ttl 

aws dynamodb update-time-to-live --table-name TTLExample --time-to-live-specification "Enabled=true, AttributeName=ttl"
