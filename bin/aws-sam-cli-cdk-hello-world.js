#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("source-map-support/register");
const cdk = require("@aws-cdk/core");
const aws_sam_cli_cdk_hello_world_stack_1 = require("../lib/aws-sam-cli-cdk-hello-world-stack");
const app = new cdk.App();
new aws_sam_cli_cdk_hello_world_stack_1.AwsSamCliCdkHelloWorldStack(app, 'sam-cdk-db');
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXdzLXNhbS1jbGktY2RrLWhlbGxvLXdvcmxkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiYXdzLXNhbS1jbGktY2RrLWhlbGxvLXdvcmxkLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUNBLHVDQUFxQztBQUNyQyxxQ0FBcUM7QUFDckMsZ0dBQXVGO0FBRXZGLE1BQU0sR0FBRyxHQUFHLElBQUksR0FBRyxDQUFDLEdBQUcsRUFBRSxDQUFDO0FBQzFCLElBQUksK0RBQTJCLENBQUMsR0FBRyxFQUFFLFlBQVksQ0FBQyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiIyEvdXNyL2Jpbi9lbnYgbm9kZVxuaW1wb3J0ICdzb3VyY2UtbWFwLXN1cHBvcnQvcmVnaXN0ZXInO1xuaW1wb3J0ICogYXMgY2RrIGZyb20gJ0Bhd3MtY2RrL2NvcmUnO1xuaW1wb3J0IHsgQXdzU2FtQ2xpQ2RrSGVsbG9Xb3JsZFN0YWNrIH0gZnJvbSAnLi4vbGliL2F3cy1zYW0tY2xpLWNkay1oZWxsby13b3JsZC1zdGFjayc7XG5cbmNvbnN0IGFwcCA9IG5ldyBjZGsuQXBwKCk7XG5uZXcgQXdzU2FtQ2xpQ2RrSGVsbG9Xb3JsZFN0YWNrKGFwcCwgJ3NhbS1jZGstZGInKTtcbiJdfQ==