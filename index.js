'use strict';

const Promise = require('bluebird');
const AWS = require('aws-sdk');

class APIGatewayCustomiser {
    constructor(serverless, options) {
        this.serverless = serverless;
        this.options = options;
        this.custom = this.serverless.service.custom;
        this.hooks = {
            'after:deploy:deploy': this.afterDeployFunctions.bind(this)
        };
    }

    /**
     * @description hook to after deployment
     *
     * @return {Promise}
     */
    afterDeployFunctions() {
        this.apiName = this.serverless.getProvider(this.serverless.service.provider.name).naming.getApiGatewayName();
        this.apiGatewaySDK = new AWS.APIGateway({
            region: this.options.region
        });
        return this.modifyAPIGateway();
    }

    /**
     * @description modify the gateway
     */
    modifyAPIGateway() {
        this.serverless.cli.log('API Gateway Configuring: Start');
        /** Filter functions for those need API Gateway Config */
        if (this.custom.apigateway) {
            new Promise((resolve, reject) => {
                this.apiGatewaySDK.getRestApis(null, (err, data) => {
                    if (err)
                        reject(err);
                    const api = data.items.filter(entry => entry.name == this.apiName)[0];
                    if (api != undefined) {
                        resolve(api.id);
                    }
                })
            }).then((apiId) => {
                    let promises = [];
                    if (this.custom.apigateway.responses) {
                        this.custom.apigateway.responses.forEach((response) => {
                            if(response.response.headers){
                                promises.push(this.configHeaders(apiId, response.response));
                            }
                            if(response.response.bodyMappingTemplate){
                                promises.push(this.configBodyMapping(apiId, response.response));
                            }
                        });
                    }
                    if (this.custom.apigateway.binaryTypes) {
                        promises.push(this.configBinary(apiId));
                    }
                    Promise.all(promises).then(values => {
                        this.serverless.cli.log('API Gateway Configuring: End');
                    }, reason => {
                        this.serverless.cli.log('API Gateway Configuring: Err',reason);
                    });
                }
            );
        }
    }

    /**
     * @description this is to configure the headers
     *
     * @param apiId - the API id
     * @param response
     */
    configHeaders(apiId, response) {
        return new Promise((resolve, reject) => {
            const params = {
                responseType: response.type.toString(), /* required */
                restApiId: apiId, /* required */
                responseParameters: response.headers? response.headers:{},
                statusCode: response.statusCode.toString(),
            };
            this.apiGatewaySDK.putGatewayResponse(params, (err, data) => {
                if (err) {
                    reject(err);
                }
                else {
                    this.serverless.cli.log('API Gateway Configuring: Headers are set correctly');
                    resolve('Header set successfully:', response.type);
                }
            });
        });
    }

    /**
     * @description configure the body mapping templates
     *
     * @param apiId
     * @param response
     */
    configBodyMapping(apiId, response) {
        return new Promise((resolve, reject) => {
            const params = {
                responseType: response.type.toString(), /* required */
                restApiId: apiId, /* required */
                patchOperations:[{
                    op: 'add',
                    path: '/responseTemplates/'+ response.bodyMappingTemplate.contentType.replace("/", "~1"),
                    value: response.bodyMappingTemplate.content
                  }
                ]
            };
            this.apiGatewaySDK.updateGatewayResponse(params, (err, data) => {
                if (err) {
                    reject(err);
                }
                else {
                    this.serverless.cli.log('API Gateway Configuring: Body mapping templates are set correctly');
                    resolve('Body Mapping Templates set successfully:', response.type);
                }
            });
        });
    }

    /**
     * @description binary support configuration
     * @param apiId
     */
    configBinary(apiId) {
        let patchOperationsArray = [];
        this.custom.apigateway.binaryTypes.forEach( e => {
            patchOperationsArray.push(
                {
                    op: 'add',
                    path: '/binaryMediaTypes/'+ e.replace("/", "~1")
                }
            );
        });
        return new Promise((resolve, reject) => {
            const params = {
                restApiId: apiId, /* required */
                patchOperations:patchOperationsArray
            };
            this.apiGatewaySDK.updateRestApi(params, (err, data) => {
                if (err) {
                    reject(err);
                }
                else {
                    this.serverless.cli.log('API Gateway Configuring: Binary support are set correctly');
                    resolve('binary set successfully');
                }
            });
        });
    }
}

module.exports = APIGatewayCustomiser;
