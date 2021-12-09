## Create network within docker
docker network create lambda-local


## Start a dynamodb locally using the same network docker
docker run -d -v "$PWD":/dynamodb_local_db -p 8000:8000 --network lambda-local --name dynamodb cnadiminti/dynamodb-local

## Start sam-beta-cdk with the desired network

ssam-beta-cdk local start-api --docker-network lambda-local


