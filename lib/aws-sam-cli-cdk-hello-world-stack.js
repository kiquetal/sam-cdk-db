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
        const api = new apigateway.LambdaRestApi(this, 'hello-world-api', {
            handler: backend,
            proxy: false
        });
        const hello = api.root.addResource('hello');
        const itemsRoot = api.root.addResource('items');
        //   const greedy = api.root.addResource('greedy');
        itemsRoot.addMethod('POST', new apigateway.LambdaIntegration(dynamoInsertItem));
        itemsRoot.addResource('{itemId}').addMethod('PUT', new apigateway.LambdaIntegration(dynamoUpdateItem));
        hello.addMethod('GET');
        /*  greedy.addProxy(
    
              {  defaultIntegration: new apigateway.LambdaIntegration(backend)});
    
    
         */
    }
}
exports.AwsSamCliCdkHelloWorldStack = AwsSamCliCdkHelloWorldStack;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXdzLXNhbS1jbGktY2RrLWhlbGxvLXdvcmxkLXN0YWNrLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiYXdzLXNhbS1jbGktY2RrLWhlbGxvLXdvcmxkLXN0YWNrLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUFBLHFDQUFxQztBQUNyQyw4Q0FBOEM7QUFDOUMsc0RBQXNEO0FBQ3RELDZCQUE2QjtBQUU3QixNQUFhLDJCQUE0QixTQUFRLEdBQUcsQ0FBQyxLQUFLO0lBQ3hELFlBQVksS0FBb0IsRUFBRSxFQUFVLEVBQUUsS0FBc0I7UUFDbEUsS0FBSyxDQUFDLEtBQUssRUFBRSxFQUFFLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFFeEIsNkNBQTZDO1FBQzdDLE1BQU0sT0FBTyxHQUFHLElBQUksTUFBTSxDQUFDLFFBQVEsQ0FBQyxJQUFJLEVBQUUsNkJBQTZCLEVBQUU7WUFDdkUsT0FBTyxFQUFFLE1BQU0sQ0FBQyxPQUFPLENBQUMsV0FBVztZQUNuQyxPQUFPLEVBQUUsbUJBQW1CO1lBQzVCLE9BQU8sRUFBRSxHQUFHLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUM7WUFDaEMsSUFBSSxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsU0FBUyxFQUFFLElBQUksRUFBRSxhQUFhLENBQUMsQ0FBQztTQUN2RSxDQUFDLENBQUM7UUFFSCxNQUFNLGdCQUFnQixHQUFHLElBQUksTUFBTSxDQUFDLFFBQVEsQ0FBQyxJQUFJLEVBQUUsK0JBQStCLEVBQUU7WUFDbEYsT0FBTyxFQUFFLE1BQU0sQ0FBQyxPQUFPLENBQUMsV0FBVztZQUNuQyxPQUFPLEVBQUUsZ0JBQWdCO1lBQ3pCLE9BQU8sRUFBRSxHQUFHLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUM7WUFDaEMsSUFBSSxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsU0FBUyxFQUFFLElBQUksRUFBRSxjQUFjLENBQUMsQ0FBQztTQUN4RSxDQUFDLENBQUM7UUFFRixNQUFNLGdCQUFnQixHQUFHLElBQUksTUFBTSxDQUFDLFFBQVEsQ0FBQyxJQUFJLEVBQUUsK0JBQStCLEVBQUU7WUFDbkYsT0FBTyxFQUFFLE1BQU0sQ0FBQyxPQUFPLENBQUMsV0FBVztZQUNuQyxPQUFPLEVBQUUsZ0JBQWdCO1lBQ3pCLE9BQU8sRUFBRSxHQUFHLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUM7WUFDaEMsSUFBSSxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsU0FBUyxFQUFFLElBQUksRUFBRSxjQUFjLENBQUMsQ0FBQztTQUN4RSxDQUFDLENBQUM7UUFFSCxNQUFNLEdBQUcsR0FBRyxJQUFJLFVBQVUsQ0FBQyxhQUFhLENBQUMsSUFBSSxFQUFFLGlCQUFpQixFQUFFO1lBQ2hFLE9BQU8sRUFBRSxPQUFPO1lBQ2hCLEtBQUssRUFBRSxLQUFLO1NBQ2IsQ0FBQyxDQUFDO1FBRUgsTUFBTSxLQUFLLEdBQUcsR0FBRyxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsT0FBTyxDQUFDLENBQUM7UUFDNUMsTUFBTSxTQUFTLEdBQUcsR0FBRyxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsT0FBTyxDQUFDLENBQUE7UUFDL0MsbURBQW1EO1FBQ25ELFNBQVMsQ0FBQyxTQUFTLENBQUMsTUFBTSxFQUFFLElBQUksVUFBVSxDQUFDLGlCQUFpQixDQUFDLGdCQUFnQixDQUFDLENBQUMsQ0FBQTtRQUMvRSxTQUFTLENBQUMsV0FBVyxDQUFDLFVBQVUsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxLQUFLLEVBQUMsSUFBSSxVQUFVLENBQUMsaUJBQWlCLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxDQUFBO1FBQ3JHLEtBQUssQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDLENBQUM7UUFFdkI7Ozs7O1dBS0c7SUFDTCxDQUFDO0NBRUY7QUE5Q0Qsa0VBOENDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgY2RrIGZyb20gJ0Bhd3MtY2RrL2NvcmUnO1xuaW1wb3J0ICogYXMgbGFtYmRhIGZyb20gJ0Bhd3MtY2RrL2F3cy1sYW1iZGEnO1xuaW1wb3J0ICogYXMgYXBpZ2F0ZXdheSBmcm9tICdAYXdzLWNkay9hd3MtYXBpZ2F0ZXdheSc7XG5pbXBvcnQgKiBhcyBwYXRoIGZyb20gJ3BhdGgnO1xuXG5leHBvcnQgY2xhc3MgQXdzU2FtQ2xpQ2RrSGVsbG9Xb3JsZFN0YWNrIGV4dGVuZHMgY2RrLlN0YWNrIHtcbiAgY29uc3RydWN0b3Ioc2NvcGU6IGNkay5Db25zdHJ1Y3QsIGlkOiBzdHJpbmcsIHByb3BzPzogY2RrLlN0YWNrUHJvcHMpIHtcbiAgICBzdXBlcihzY29wZSwgaWQsIHByb3BzKTtcblxuICAgIC8vIFRoZSBjb2RlIHRoYXQgZGVmaW5lcyB5b3VyIHN0YWNrIGdvZXMgaGVyZVxuICAgIGNvbnN0IGJhY2tlbmQgPSBuZXcgbGFtYmRhLkZ1bmN0aW9uKHRoaXMsICdoZWxsby13b3JsZC1sYW1iZGEtZnVuY3Rpb24nLCB7XG4gICAgICBydW50aW1lOiBsYW1iZGEuUnVudGltZS5OT0RFSlNfMTRfWCxcbiAgICAgIGhhbmRsZXI6ICdhcHAubGFtYmRhSGFuZGxlcicsXG4gICAgICB0aW1lb3V0OiBjZGsuRHVyYXRpb24ubWludXRlcygxKSxcbiAgICAgIGNvZGU6IGxhbWJkYS5Db2RlLmZyb21Bc3NldChwYXRoLmpvaW4oX19kaXJuYW1lLCAnLi4nLCAnaGVsbG8td29ybGQnKSksXG4gICAgfSk7XG5cbiAgICBjb25zdCBkeW5hbW9JbnNlcnRJdGVtID0gbmV3IGxhbWJkYS5GdW5jdGlvbih0aGlzLCAnZHluYW1vLWxhbWJkYS1pbnNlcnQtZnVuY3Rpb24nLCB7XG4gICAgICBydW50aW1lOiBsYW1iZGEuUnVudGltZS5OT0RFSlNfMTRfWCxcbiAgICAgIGhhbmRsZXI6ICdpbnNlcnQuaGFuZGxlcicsXG4gICAgICB0aW1lb3V0OiBjZGsuRHVyYXRpb24ubWludXRlcygxKSxcbiAgICAgIGNvZGU6IGxhbWJkYS5Db2RlLmZyb21Bc3NldChwYXRoLmpvaW4oX19kaXJuYW1lLCAnLi4nLCAnZHluYW1vLWl0ZW1zJykpLFxuICAgIH0pO1xuXG4gICAgIGNvbnN0IGR5bmFtb1VwZGF0ZUl0ZW0gPSBuZXcgbGFtYmRhLkZ1bmN0aW9uKHRoaXMsICdkeW5hbW8tbGFtYmRhLXVwZGF0ZS1mdW5jdGlvbicsIHtcbiAgICAgIHJ1bnRpbWU6IGxhbWJkYS5SdW50aW1lLk5PREVKU18xNF9YLFxuICAgICAgaGFuZGxlcjogJ3VwZGF0ZS5oYW5kbGVyJyxcbiAgICAgIHRpbWVvdXQ6IGNkay5EdXJhdGlvbi5taW51dGVzKDEpLFxuICAgICAgY29kZTogbGFtYmRhLkNvZGUuZnJvbUFzc2V0KHBhdGguam9pbihfX2Rpcm5hbWUsICcuLicsICdkeW5hbW8taXRlbXMnKSksXG4gICAgfSk7XG5cbiAgICBjb25zdCBhcGkgPSBuZXcgYXBpZ2F0ZXdheS5MYW1iZGFSZXN0QXBpKHRoaXMsICdoZWxsby13b3JsZC1hcGknLCB7XG4gICAgICBoYW5kbGVyOiBiYWNrZW5kLFxuICAgICAgcHJveHk6IGZhbHNlXG4gICAgfSk7XG5cbiAgICBjb25zdCBoZWxsbyA9IGFwaS5yb290LmFkZFJlc291cmNlKCdoZWxsbycpO1xuICAgIGNvbnN0IGl0ZW1zUm9vdCA9IGFwaS5yb290LmFkZFJlc291cmNlKCdpdGVtcycpXG4gICAgLy8gICBjb25zdCBncmVlZHkgPSBhcGkucm9vdC5hZGRSZXNvdXJjZSgnZ3JlZWR5Jyk7XG4gICAgaXRlbXNSb290LmFkZE1ldGhvZCgnUE9TVCcsIG5ldyBhcGlnYXRld2F5LkxhbWJkYUludGVncmF0aW9uKGR5bmFtb0luc2VydEl0ZW0pKVxuICAgIGl0ZW1zUm9vdC5hZGRSZXNvdXJjZSgne2l0ZW1JZH0nKS5hZGRNZXRob2QoJ1BVVCcsbmV3IGFwaWdhdGV3YXkuTGFtYmRhSW50ZWdyYXRpb24oZHluYW1vVXBkYXRlSXRlbSkpXG4gICAgaGVsbG8uYWRkTWV0aG9kKCdHRVQnKTtcblxuICAgIC8qICBncmVlZHkuYWRkUHJveHkoXG5cbiAgICAgICAgICB7ICBkZWZhdWx0SW50ZWdyYXRpb246IG5ldyBhcGlnYXRld2F5LkxhbWJkYUludGVncmF0aW9uKGJhY2tlbmQpfSk7XG5cblxuICAgICAqL1xuICB9XG5cbn1cbiJdfQ==