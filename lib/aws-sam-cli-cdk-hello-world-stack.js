"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AwsSamCliCdkHelloWorldStack = void 0;
const cdk = require("@aws-cdk/core");
const lambda = require("@aws-cdk/aws-lambda");
const apigateway = require("@aws-cdk/aws-apigateway");
const path = require("path");
class AwsSamCliCdkHelloWorldStack extends cdk.Stack {
    constructor(scope, id, props) {
        super(scope, id, props);
        // The code that defines your stack goes here
        const backend = new lambda.Function(this, 'hello-world-lambda-function', {
            runtime: lambda.Runtime.NODEJS_14_X,
            handler: 'app.lambdaHandler',
            timeout: cdk.Duration.minutes(1),
            code: lambda.Code.fromAsset(path.join(__dirname, '..', 'hello-world')),
        });
        const dynamoInsertItem = new lambda.Function(this, 'dynamo-lambda-insert-function', {
            runtime: lambda.Runtime.NODEJS_14_X,
            handler: 'insert.handler',
            timeout: cdk.Duration.minutes(1),
            code: lambda.Code.fromAsset(path.join(__dirname, '..', 'dynamo-items')),
        });
        const dynamoUpdateItem = new lambda.Function(this, 'dynamo-lambda-update-function', {
            runtime: lambda.Runtime.NODEJS_14_X,
            handler: 'update.handler',
            timeout: cdk.Duration.minutes(1),
            code: lambda.Code.fromAsset(path.join(__dirname, '..', 'dynamo-items')),
        });
        const dynamoGetItem = new lambda.Function(this, 'dynamo-lambda-get-function', {
            runtime: lambda.Runtime.NODEJS_14_X,
            handler: 'get.handler',
            timeout: cdk.Duration.minutes(1),
            code: lambda.Code.fromAsset(path.join(__dirname, '..', 'dynamo-items')),
        });
        const dynamoGetCountryType = new lambda.Function(this, 'dynamo-lambda-get-by-country-type-function', {
            runtime: lambda.Runtime.NODEJS_14_X,
            handler: 'get.handlerCountryType',
            timeout: cdk.Duration.minutes(1),
            code: lambda.Code.fromAsset(path.join(__dirname, '..', 'dynamo-items'))
        });
        const api = new apigateway.LambdaRestApi(this, 'hello-world-api', {
            handler: backend,
            proxy: false
        });
        const hello = api.root.addResource('hello');
        const itemsRootResource = api.root.addResource('items');
        //   const greedy = api.root.addResource('greedy');
        itemsRootResource.addMethod('POST', new apigateway.LambdaIntegration(dynamoInsertItem));
        itemsRootResource.addMethod('PUT', new apigateway.LambdaIntegration(dynamoUpdateItem));
        const itemSubResources = itemsRootResource.addResource('{itemId}');
        const queryResource = itemsRootResource.addResource('query');
        const countryQueryResource = queryResource.addResource('{country}');
        const countryAndTypeResource = countryQueryResource.addResource('{type}');
        countryAndTypeResource.addMethod('GET', new apigateway.LambdaIntegration(dynamoGetCountryType));
        itemSubResources.addMethod('GET', new apigateway.LambdaIntegration(dynamoGetItem));
        hello.addMethod('GET');
        /*  greedy.addProxy(
    
              {  defaultIntegration: new apigateway.LambdaIntegration(backend)});
    
    
         */
    }
}
exports.AwsSamCliCdkHelloWorldStack = AwsSamCliCdkHelloWorldStack;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXdzLXNhbS1jbGktY2RrLWhlbGxvLXdvcmxkLXN0YWNrLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiYXdzLXNhbS1jbGktY2RrLWhlbGxvLXdvcmxkLXN0YWNrLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUFBLHFDQUFxQztBQUNyQyw4Q0FBOEM7QUFDOUMsc0RBQXNEO0FBQ3RELDZCQUE2QjtBQUU3QixNQUFhLDJCQUE0QixTQUFRLEdBQUcsQ0FBQyxLQUFLO0lBQ3hELFlBQVksS0FBb0IsRUFBRSxFQUFVLEVBQUUsS0FBc0I7UUFDbEUsS0FBSyxDQUFDLEtBQUssRUFBRSxFQUFFLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFFeEIsNkNBQTZDO1FBQzdDLE1BQU0sT0FBTyxHQUFHLElBQUksTUFBTSxDQUFDLFFBQVEsQ0FBQyxJQUFJLEVBQUUsNkJBQTZCLEVBQUU7WUFDdkUsT0FBTyxFQUFFLE1BQU0sQ0FBQyxPQUFPLENBQUMsV0FBVztZQUNuQyxPQUFPLEVBQUUsbUJBQW1CO1lBQzVCLE9BQU8sRUFBRSxHQUFHLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUM7WUFDaEMsSUFBSSxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsU0FBUyxFQUFFLElBQUksRUFBRSxhQUFhLENBQUMsQ0FBQztTQUN2RSxDQUFDLENBQUM7UUFFSCxNQUFNLGdCQUFnQixHQUFHLElBQUksTUFBTSxDQUFDLFFBQVEsQ0FBQyxJQUFJLEVBQUUsK0JBQStCLEVBQUU7WUFDbEYsT0FBTyxFQUFFLE1BQU0sQ0FBQyxPQUFPLENBQUMsV0FBVztZQUNuQyxPQUFPLEVBQUUsZ0JBQWdCO1lBQ3pCLE9BQU8sRUFBRSxHQUFHLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUM7WUFDaEMsSUFBSSxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxJQUFJLENB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YUFBYSxDQUFDLENBQUMsQ0FBQTtRQUVqRixLQUFLLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBRXZCOzs7OztXQUtHO0lBQ0wsQ0FBQztDQUVGO0FBcEVELGtFQW9FQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIGNkayBmcm9tICdAYXdzLWNkay9jb3JlJztcbmltcG9ydCAqIGFzIGxhbWJkYSBmcm9tICdAYXdzLWNkay9hd3MtbGFtYmRhJztcbmltcG9ydCAqIGFzIGFwaWdhdGV3YXkgZnJvbSAnQGF3cy1jZGsvYXdzLWFwaWdhdGV3YXknO1xuaW1wb3J0ICogYXMgcGF0aCBmcm9tICdwYXRoJztcblxuZXhwb3J0IGNsYXNzIEF3c1NhbUNsaUNka0hlbGxvV29ybGRTdGFjayBleHRlbmRzIGNkay5TdGFjayB7XG4gIGNvbnN0cnVjdG9yKHNjb3BlOiBjZGsuQ29uc3RydWN0LCBpZDogc3RyaW5nLCBwcm9wcz86IGNkay5TdGFja1Byb3BzKSB7XG4gICAgc3VwZXIoc2NvcGUsIGlkLCBwcm9wcyk7XG5cbiAgICAvLyBUaGUgY29kZSB0aGF0IGRlZmluZXMgeW91ciBzdGFjayBnb2VzIGhlcmVcbiAgICBjb25zdCBiYWNrZW5kID0gbmV3IGxhbWJkYS5GdW5jdGlvbih0aGlzLCAnaGVsbG8td29ybGQtbGFtYmRhLWZ1bmN0aW9uJywge1xuICAgICAgcnVudGltZTogbGFtYmRhLlJ1bnRpbWUuTk9ERUpTXzE0X1gsXG4gICAgICBoYW5kbGVyOiAnYXBwLmxhbWJkYUhhbmRsZXInLFxuICAgICAgdGltZW91dDogY2RrLkR1cmF0aW9uLm1pbnV0ZXMoMSksXG4gICAgICBjb2RlOiBsYW1iZGEuQ29kZS5mcm9tQXNzZXQocGF0aC5qb2luKF9fZGlybmFtZSwgJy4uJywgJ2hlbGxvLXdvcmxkJykpLFxuICAgIH0pO1xuXG4gICAgY29uc3QgZHluYW1vSW5zZXJ0SXRlbSA9IG5ldyBsYW1iZGEuRnVuY3Rpb24odGhpcywgJ2R5bmFtby1sYW1iZGEtaW5zZXJ0LWZ1bmN0aW9uJywge1xuICAgICAgcnVudGltZTogbGFtYmRhLlJ1bnRpbWUuTk9ERUpTXzE0X1gsXG4gICAgICBoYW5kbGVyOiAnaW5zZXJ0LmhhbmRsZXInLFxuICAgICAgdGltZW91dDogY2RrLkR1cmF0aW9uLm1pbnV0ZXMoMSksXG4gICAgICBjb2RlOiBsYW1iZGEuQ29kZS5mcm9tQXNzZXQocGF0aC5qb2luKF9fZGlybmFtZSwgJy4uJywgJ2R5bmFtby1pdGVtcycpKSxcbiAgICB9KTtcblxuICAgICBjb25zdCBkeW5hbW9VcGRhdGVJdGVtID0gbmV3IGxhbWJkYS5GdW5jdGlvbih0aGlzLCAnZHluYW1vLWxhbWJkYS11cGRhdGUtZnVuY3Rpb24nLCB7XG4gICAgICBydW50aW1lOiBsYW1iZGEuUnVudGltZS5OT0RFSlNfMTRfWCxcbiAgICAgIGhhbmRsZXI6ICd1cGRhdGUuaGFuZGxlcicsXG4gICAgICB0aW1lb3V0OiBjZGsuRHVyYXRpb24ubWludXRlcygxKSxcbiAgICAgIGNvZGU6IGxhbWJkYS5Db2RlLmZyb21Bc3NldChwYXRoLmpvaW4oX19kaXJuYW1lLCAnLi4nLCAnZHluYW1vLWl0ZW1zJykpLFxuICAgIH0pO1xuXG4gICAgY29uc3QgZHluYW1vR2V0SXRlbSA9IG5ldyBsYW1iZGEuRnVuY3Rpb24odGhpcywgJ2R5bmFtby1sYW1iZGEtZ2V0LWZ1bmN0aW9uJywge1xuICAgICAgcnVudGltZTogbGFtYmRhLlJ1bnRpbWUuTk9ERUpTXzE0X1gsXG4gICAgICBoYW5kbGVyOiAnZ2V0LmhhbmRsZXInLFxuICAgICAgdGltZW91dDogY2RrLkR1cmF0aW9uLm1pbnV0ZXMoMSksXG4gICAgICBjb2RlOiBsYW1iZGEuQ29kZS5mcm9tQXNzZXQocGF0aC5qb2luKF9fZGlybmFtZSwgJy4uJywgJ2R5bmFtby1pdGVtcycpKSxcbiAgICB9KTtcblxuICAgIGNvbnN0ICBkeW5hbW9HZXRDb3VudHJ5VHlwZSA9IG5ldyBsYW1iZGEuRnVuY3Rpb24odGhpcywnZHluYW1vLWxhbWJkYS1nZXQtYnktY291bnRyeS10eXBlLWZ1bmN0aW9uJyx7XG4gICAgICAgcnVudGltZTogbGFtYmRhLlJ1bnRpbWUuTk9ERUpTXzE0X1gsXG4gICAgICAgaGFuZGxlcjonZ2V0LmhhbmRsZXJDb3VudHJ5VHlwZScsXG4gICAgICAgdGltZW91dDogY2RrLkR1cmF0aW9uLm1pbnV0ZXMoMSksXG4gICAgICAgIGNvZGU6bGFtYmRhLkNvZGUuZnJvbUFzc2V0KHBhdGguam9pbihfX2Rpcm5hbWUsJy4uJywnZHluYW1vLWl0ZW1zJykpXG5cbiAgICB9KTtcblxuICAgIGNvbnN0IGFwaSA9IG5ldyBhcGlnYXRld2F5LkxhbWJkYVJlc3RBcGkodGhpcywgJ2hlbGxvLXdvcmxkLWFwaScsIHtcbiAgICAgIGhhbmRsZXI6IGJhY2tlbmQsXG4gICAgICBwcm94eTogZmFsc2VcbiAgICB9KTtcblxuICAgIGNvbnN0IGhlbGxvID0gYXBpLnJvb3QuYWRkUmVzb3VyY2UoJ2hlbGxvJyk7XG4gICAgY29uc3QgaXRlbXNSb290UmVzb3VyY2UgPSBhcGkucm9vdC5hZGRSZXNvdXJjZSgnaXRlbXMnKVxuICAgIC8vICAgY29uc3QgZ3JlZWR5ID0gYXBpLnJvb3QuYWRkUmVzb3VyY2UoJ2dyZWVkeScpO1xuICAgIGl0ZW1zUm9vdFJlc291cmNlLmFkZE1ldGhvZCgnUE9TVCcsIG5ldyBhcGlnYXRld2F5LkxhbWJkYUludGVncmF0aW9uKGR5bmFtb0luc2VydEl0ZW0pKVxuICAgIGl0ZW1zUm9vdFJlc291cmNlLmFkZE1ldGhvZCgnUFVUJyxuZXcgYXBpZ2F0ZXdheS5MYW1iZGFJbnRlZ3JhdGlvbihkeW5hbW9VcGRhdGVJdGVtKSk7XG4gICBjb25zdCBpdGVtU3ViUmVzb3VyY2VzPSBpdGVtc1Jvb3RSZXNvdXJjZS5hZGRSZXNvdXJjZSgne2l0ZW1JZH0nKTtcbiAgIGNvbnN0IHF1ZXJ5UmVzb3VyY2UgPSBpdGVtc1Jvb3RSZXNvdXJjZS5hZGRSZXNvdXJjZSgncXVlcnknKTtcbiAgIGNvbnN0IGNvdW50cnlRdWVyeVJlc291cmNlID0gcXVlcnlSZXNvdXJjZS5hZGRSZXNvdXJjZSgne2NvdW50cnl9Jyk7XG4gICBjb25zdCBjb3VudHJ5QW5kVHlwZVJlc291cmNlID0gY291bnRyeVF1ZXJ5UmVzb3VyY2UuYWRkUmVzb3VyY2UoJ3t0eXBlfScpO1xuICAgICAgY291bnRyeUFuZFR5cGVSZXNvdXJjZS5hZGRNZXRob2QoJ0dFVCcsbmV3IGFwaWdhdGV3YXkuTGFtYmRhSW50ZWdyYXRpb24oZHluYW1vR2V0Q291bnRyeVR5cGUpKVxuICAgIGl0ZW1TdWJSZXNvdXJjZXMuYWRkTWV0aG9kKCdHRVQnLG5ldyBhcGlnYXRld2F5LkxhbWJkYUludGVncmF0aW9uKGR5bmFtb0dldEl0ZW0pKVxuXG4gICAgaGVsbG8uYWRkTWV0aG9kKCdHRVQnKTtcblxuICAgIC8qICBncmVlZHkuYWRkUHJveHkoXG5cbiAgICAgICAgICB7ICBkZWZhdWx0SW50ZWdyYXRpb246IG5ldyBhcGlnYXRld2F5LkxhbWJkYUludGVncmF0aW9uKGJhY2tlbmQpfSk7XG5cblxuICAgICAqL1xuICB9XG5cbn1cbiJdfQ==