## Create network within docker
docker network create lambda-local


## Start a dynamodb locally using the same network docker
docker run -d -v "$PWD":/dynamodb_local_db -p 8000:8000 --network lambda-local --name dynamodb cnadiminti/dynamodb-local

## Start sam-beta-cdk with the desired network
sam-beta-cdk local start-api --docker-network lambda-local

## Create table

aws dynamodb create-table     --table-name MusicCollection     --attribute-definitions AttributeName=Artist,AttributeType=S AttributeName=SongTitle,AttributeType=S     --key-schema AttributeName=Artist,KeyType=HASH AttributeName=SongTitle,KeyType=RANGE     --provisioned-throughput ReadCapacityUnits=5,WriteCapacityUnits=5     --tags Key=Owner,Value=blueTeam --endpoint http://127.0.0.1:8000 --profile devKiquetal


