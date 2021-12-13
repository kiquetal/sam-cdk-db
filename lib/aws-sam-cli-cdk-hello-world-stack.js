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
        const api = new apigateway.LambdaRestApi(this, 'hello-world-api', {
            handler: backend,
            proxy: false
        });
        const hello = api.root.addResource('hello');
        const itemsRoot = api.root.addResource('items');
        //   const greedy = api.root.addResource('greedy');
        itemsRoot.addMethod('POST', new apigateway.LambdaIntegration(dynamoInsertItem));
        const itemsRresource = itemsRoot.addResource('{itemId}');
        itemsRresource.addMethod('PUT', new apigateway.LambdaIntegration(dynamoUpdateItem));
        itemsRresource.addMethod('GET', new apigateway.LambdaIntegration(dynamoGetItem));
        hello.addMethod('GET');
        /*  greedy.addProxy(
    
              {  defaultIntegration: new apigateway.LambdaIntegration(backend)});
    
    
         */
    }
}
exports.AwsSamCliCdkHelloWorldStack = AwsSamCliCdkHelloWorldStack;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXdzLXNhbS1jbGktY2RrLWhlbGxvLXdvcmxkLXN0YWNrLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiYXdzLXNhbS1jbGktY2RrLWhlbGxvLXdvcmxkLXN0YWNrLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUFBLHFDQUFxQztBQUNyQyw4Q0FBOEM7QUFDOUMsc0RBQXNEO0FBQ3RELDZCQUE2QjtBQUU3QixNQUFhLDJCQUE0QixTQUFRLEdBQUcsQ0FBQyxLQUFLO0lBQ3hELFlBQVksS0FBb0IsRUFBRSxFQUFVLEVBQUUsS0FBc0I7UUFDbEUsS0FBSyxDQUFDLEtBQUssRUFBRSxFQUFFLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFFeEIsNkNBQTZDO1FBQzdDLE1BQU0sT0FBTyxHQUFHLElBQUksTUFBTSxDQUFDLFFBQVEsQ0FBQyxJQUFJLEVBQUUsNkJBQTZCLEVBQUU7WUFDdkUsT0FBTyxFQUFFLE1BQU0sQ0FBQyxPQUFPLENBQUMsV0FBVztZQUNuQyxPQUFPLEVBQUUsbUJBQW1CO1lBQzVCLE9BQU8sRUFBRSxHQUFHLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUM7WUFDaEMsSUFBSSxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsU0FBUyxFQUFFLElBQUksRUFBRSxhQUFhLENBQUMsQ0FBQztTQUN2RSxDQUFDLENBQUM7UUFFSCxNQUFNLGdCQUFnQixHQUFHLElBQUksTUFBTSxDQUFDLFFBQVEsQ0FBQyxJQUFJLEVBQUUsK0JBQStCLEVBQUU7WUFDbEYsT0FBTyxFQUFFLE1BQU0sQ0FBQyxPQUFPLENBQUMsV0FBVztZQUNuQyxPQUFPLEVBQUUsZ0JBQWdCO1lBQ3pCLE9BQU8sRUFBRSxHQUFHLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUM7WUFDaEMsSUFBSSxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsU0FBUyxFQUFFLElBQUksRUFBRSxjQUFjLENBQUMsQ0FBQztTQUN4RSxDQUFDLENBQUM7UUFFRixNQUFNLGdCQUFnQixHQUFHLElBQUksTUFBTSxDQUFDLFFBQVEsQ0FBQyxJQUFJLEVBQUUsK0JBQStCLEVBQUU7WUFDbkYsT0FBTyxFQUFFLE1BQU0sQ0FBQyxPQUFPLENBQUMsV0FBVztZQUNuQyxPQUFPLEVBQUUsZ0JBQWdCO1lBQ3pCLE9BQU8sRUFBRSxHQUFHLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUM7WUFDaEMsSUFBSSxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsU0FBUyxFQUFFLElBQUksRUFBRSxjQUFjLENBQUMsQ0FBQztTQUN4RSxDQUFDLENBQUM7UUFFSCxNQUFNLGFBQWEsR0FBRyxJQUFJLE1BQU0sQ0FBQyxRQUFRLENBQUMsSUFBSSxFQUFFLDRCQUE0QixFQUFFO1lBQzVFLE9BQU8sRUFBRSxNQUFNLENBQUMsT0FBTyxDQUFDLFdBQVc7WUFDbkMsT0FBTyxFQUFFLGFBQWE7WUFDdEIsT0FBTyxFQUFFLEdBQUcsQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQztZQUNoQyxJQUFJLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxTQUFTLEVBQUUsSUFBSSxFQUFFLGNBQWMsQ0FBQyxDQUFDO1NBQ3hFLENBQUMsQ0FBQztRQUVILE1BQU0sR0FBRyxHQUFHLElBQUksVUFBVSxDQUFDLGFBQWEsQ0FBQyxJQUFJLEVBQUUsaUJBQWlCLEVBQUU7WUFDaEUsT0FBTyxFQUFFLE9BQU87WUFDaEIsS0FBSyxFQUFFLEtBQUs7U0FDYixDQUFDLENBQUM7UUFFSCxNQUFNLEtBQUssR0FBRyxHQUFHLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxPQUFPLENBQUMsQ0FBQztRQUM1QyxNQUFNLFNBQVMsR0FBRyxHQUFHLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxPQUFPLENBQUMsQ0FBQTtRQUMvQyxtREFBbUQ7UUFDbkQsU0FBUyxDQUFDLFNBQVMsQ0FBQyxNQUFNLEVBQUUsSUFBSSxVQUFVLENBQUMsaUJBQWlCLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxDQUFBO1FBQ2hGLE1BQU0sY0FBYyxHQUFFLFNBQVMsQ0FBQyxXQUFXLENBQUMsVUFBVSxDQUFDLENBQUM7UUFDdkQsY0FBYyxDQUFDLFNBQVMsQ0FBQyxLQUFLLEVBQUMsSUFBSSxVQUFVLENBQUMsaUJBQWlCLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxDQUFBO1FBQ2xGLGNBQWMsQ0FBQyxTQUFTLENBQUMsS0FBSyxFQUFDLElBQUksVUFBVSxDQUFDLGlCQUFpQixDQUFDLGFBQWEsQ0FBQyxDQUFDLENBQUE7UUFFL0UsS0FBSyxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUV2Qjs7Ozs7V0FLRztJQUNMLENBQUM7Q0FFRjtBQXhERCxrRUF3REMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBjZGsgZnJvbSAnQGF3cy1jZGsvY29yZSc7XG5pbXBvcnQgKiBhcyBsYW1iZGEgZnJvbSAnQGF3cy1jZGsvYXdzLWxhbWJkYSc7XG5pbXBvcnQgKiBhcyBhcGlnYXRld2F5IGZyb20gJ0Bhd3MtY2RrL2F3cy1hcGlnYXRld2F5JztcbmltcG9ydCAqIGFzIHBhdGggZnJvbSAncGF0aCc7XG5cbmV4cG9ydCBjbGFzcyBBd3NTYW1DbGlDZGtIZWxsb1dvcmxkU3RhY2sgZXh0ZW5kcyBjZGsuU3RhY2sge1xuICBjb25zdHJ1Y3RvcihzY29wZTogY2RrLkNvbnN0cnVjdCwgaWQ6IHN0cmluZywgcHJvcHM/OiBjZGsuU3RhY2tQcm9wcykge1xuICAgIHN1cGVyKHNjb3BlLCBpZCwgcHJvcHMpO1xuXG4gICAgLy8gVGhlIGNvZGUgdGhhdCBkZWZpbmVzIHlvdXIgc3RhY2sgZ29lcyBoZXJlXG4gICAgY29uc3QgYmFja2VuZCA9IG5ldyBsYW1iZGEuRnVuY3Rpb24odGhpcywgJ2hlbGxvLXdvcmxkLWxhbWJkYS1mdW5jdGlvbicsIHtcbiAgICAgIHJ1bnRpbWU6IGxhbWJkYS5SdW50aW1lLk5PREVKU18xNF9YLFxuICAgICAgaGFuZGxlcjogJ2FwcC5sYW1iZGFIYW5kbGVyJyxcbiAgICAgIHRpbWVvdXQ6IGNkay5EdXJhdGlvbi5taW51dGVzKDEpLFxuICAgICAgY29kZTogbGFtYmRhLkNvZGUuZnJvbUFzc2V0KHBhdGguam9pbihfX2Rpcm5hbWUsICcuLicsICdoZWxsby13b3JsZCcpKSxcbiAgICB9KTtcblxuICAgIGNvbnN0IGR5bmFtb0luc2VydEl0ZW0gPSBuZXcgbGFtYmRhLkZ1bmN0aW9uKHRoaXMsICdkeW5hbW8tbGFtYmRhLWluc2VydC1mdW5jdGlvbicsIHtcbiAgICAgIHJ1bnRpbWU6IGxhbWJkYS5SdW50aW1lLk5PREVKU18xNF9YLFxuICAgICAgaGFuZGxlcjogJ2luc2VydC5oYW5kbGVyJyxcbiAgICAgIHRpbWVvdXQ6IGNkay5EdXJhdGlvbi5taW51dGVzKDEpLFxuICAgICAgY29kZTogbGFtYmRhLkNvZGUuZnJvbUFzc2V0KHBhdGguam9pbihfX2Rpcm5hbWUsICcuLicsICdkeW5hbW8taXRlbXMnKSksXG4gICAgfSk7XG5cbiAgICAgY29uc3QgZHluYW1vVXBkYXRlSXRlbSA9IG5ldyBsYW1iZGEuRnVuY3Rpb24odGhpcywgJ2R5bmFtby1sYW1iZGEtdXBkYXRlLWZ1bmN0aW9uJywge1xuICAgICAgcnVudGltZTogbGFtYmRhLlJ1bnRpbWUuTk9ERUpTXzE0X1gsXG4gICAgICBoYW5kbGVyOiAndXBkYXRlLmhhbmRsZXInLFxuICAgICAgdGltZW91dDogY2RrLkR1cmF0aW9uLm1pbnV0ZXMoMSksXG4gICAgICBjb2RlOiBsYW1iZGEuQ29kZS5mcm9tQXNzZXQocGF0aC5qb2luKF9fZGlybmFtZSwgJy4uJywgJ2R5bmFtby1pdGVtcycpKSxcbiAgICB9KTtcblxuICAgIGNvbnN0IGR5bmFtb0dldEl0ZW0gPSBuZXcgbGFtYmRhLkZ1bmN0aW9uKHRoaXMsICdkeW5hbW8tbGFtYmRhLWdldC1mdW5jdGlvbicsIHtcbiAgICAgIHJ1bnRpbWU6IGxhbWJkYS5SdW50aW1lLk5PREVKU18xNF9YLFxuICAgICAgaGFuZGxlcjogJ2dldC5oYW5kbGVyJyxcbiAgICAgIHRpbWVvdXQ6IGNkay5EdXJhdGlvbi5taW51dGVzKDEpLFxuICAgICAgY29kZTogbGFtYmRhLkNvZGUuZnJvbUFzc2V0KHBhdGguam9pbihfX2Rpcm5hbWUsICcuLicsICdkeW5hbW8taXRlbXMnKSksXG4gICAgfSk7XG5cbiAgICBjb25zdCBhcGkgPSBuZXcgYXBpZ2F0ZXdheS5MYW1iZGFSZXN0QXBpKHRoaXMsICdoZWxsby13b3JsZC1hcGknLCB7XG4gICAgICBoYW5kbGVyOiBiYWNrZW5kLFxuICAgICAgcHJveHk6IGZhbHNlXG4gICAgfSk7XG5cbiAgICBjb25zdCBoZWxsbyA9IGFwaS5yb290LmFkZFJlc291cmNlKCdoZWxsbycpO1xuICAgIGNvbnN0IGl0ZW1zUm9vdCA9IGFwaS5yb290LmFkZFJlc291cmNlKCdpdGVtcycpXG4gICAgLy8gICBjb25zdCBncmVlZHkgPSBhcGkucm9vdC5hZGRSZXNvdXJjZSgnZ3JlZWR5Jyk7XG4gICAgaXRlbXNSb290LmFkZE1ldGhvZCgnUE9TVCcsIG5ldyBhcGlnYXRld2F5LkxhbWJkYUludGVncmF0aW9uKGR5bmFtb0luc2VydEl0ZW0pKVxuICAgY29uc3QgaXRlbXNScmVzb3VyY2U9IGl0ZW1zUm9vdC5hZGRSZXNvdXJjZSgne2l0ZW1JZH0nKTtcbiAgICBpdGVtc1JyZXNvdXJjZS5hZGRNZXRob2QoJ1BVVCcsbmV3IGFwaWdhdGV3YXkuTGFtYmRhSW50ZWdyYXRpb24oZHluYW1vVXBkYXRlSXRlbSkpXG4gICAgaXRlbXNScmVzb3VyY2UuYWRkTWV0aG9kKCdHRVQnLG5ldyBhcGlnYXRld2F5LkxhbWJkYUludGVncmF0aW9uKGR5bmFtb0dldEl0ZW0pKVxuXG4gICAgaGVsbG8uYWRkTWV0aG9kKCdHRVQnKTtcblxuICAgIC8qICBncmVlZHkuYWRkUHJveHkoXG5cbiAgICAgICAgICB7ICBkZWZhdWx0SW50ZWdyYXRpb246IG5ldyBhcGlnYXRld2F5LkxhbWJkYUludGVncmF0aW9uKGJhY2tlbmQpfSk7XG5cblxuICAgICAqL1xuICB9XG5cbn1cbiJdfQ==