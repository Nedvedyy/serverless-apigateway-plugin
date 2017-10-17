# serverless-APIGateway-plugin

[Serverless framework](https://www.serverless.com) plugin to configure the AWS api gateway

  - Binary support
  - Headers
  - Body template mappings

Currently it is used in GFG(Global Fashion Group) internal projects.

## Installation

Install the plugin from npm

```bash
$ npm install --save serverless-apigateway-plugin
```

## Usage

Add the plugin to your `serverless.yml`

```yaml
# serverless.yml

plugins:
  - serverless-apigateway-plugin
```

Add the config to your custom tag of serverless.yml,

For headers: pls follow the spec at  [AWS JS SDK putGatewayResponse](http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/APIGateway.html#putGatewayResponse-property)
For body mapping templates: pls follow the spec at  [AWS JS SDK updateGatewayResponse](http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/APIGateway.html#updateGatewayResponse-property)


```yaml
# serverless.yml

custom:
  apigateway:
    responses:
    -  response:
         type: ACCESS_DENIED
         headers: {"gatewayresponse.header.Access-Control-Allow-Origin":"'*'"}
         bodyMappingTemplate: { "contentType": "application/json" , "content": '{"status": 403,"code": "INVALID_TOKEN","detail":$context.error.messageString}'}
         statusCode: 403
    binaryTypes:
      - 'image/jpg'
      - 'text/html'
```

## Contributing

We welcome pull requests! Please fork the repo and submit your PR.
