'use strict'

/**
 * @module serverless-apigateway-plugin
 *
 * @see {@link https://serverless.com/framework/docs/providers/aws/guide/plugins/}
 * */

import AWS from 'aws-sdk';
import BbPromise from 'bluebird';

/**
 * @classdesc Allow you to configure the API gateway
 * @class APIGatewayCustomiser
 * */
class APIGatewayCustomiser {
    /**
     * @description Serverless API Gateway Customiser
     * @constructor
     *
     * @param {!Object} serverless - Serverless object
     * @param {!Object} options - Serverless options
     *
     * */
    constructor (serverless, options) {
        this.serverless.cli.log(serverless);
        this.serverless.cli.log(options);
        /** Serverless variables */
        this.serverless = serverless;
        this.options = options;
        this.provider = this.serverless.getProvider('aws');
        this.apiGatewayConfig = {
            responses: [],
            binaryTypes: ''
        }

        this.hooks = {
            'after:deploy:deploy': this.afterDeployFunctions.bind(this)
        }
    }

    /**
     * @description After deploy functions hooks
     *
     * @fulfil {} — Functions warmed up sucessfuly
     * @reject {Error} Functions couldn't be warmed up
     *
     * @return {Promise}
     * */
    afterDeployFunctions () {
        this.configPlugin();
        return this.modifyAPIGateway();
    }

    /**
     * @description Configure the plugin based on the context of serverless.yml
     *
     * @return {}
     * */
    configPlugin () {
        this.serverless.cli.log('API Gateway Configuring init:');
    }

    /**
     * @description Warm up the functions immediately after deployment
     *
     * @fulfil {} — Functions warmed up sucessfuly
     * @reject {Error} Functions couldn't be warmed up
     *
     *
     * apigateway
     *   responses
     *     -  response
     *         type:
     *         headers:
     *         bodyMappingTemplate:
     *   binaryTypes:
     *     - 'image/jpg'
     *     - 'text/html'
     *
     * @return {Promise}
     * */
    modifyAPIGateway () {
        this.serverless.cli.log('API Gateway Configuring Starts:');

        /** Filter functions for those need API Gateway Config */
        return BbPromise.filter(this.serverless.service.getAllFunctions(), (functionObject) => {
            this.serverless.cli.log('functionObject.apigateway');
            this.serverless.cli.log(functionObject.apigateway);
            if (functionObject.apigateway) {
                if(functionObject.apigateway.responses) {
                    this.serverless.cli.log('functionObject.apigateway.responses');
                    this.serverless.cli.log(functionObject.apigateway.responses);
                }
                if(functionObject.apigateway.binaryTypes) {
                    this.serverless.cli.log('functionObject.apigateway.binaryTypes');
                    this.serverless.cli.log(functionObject.apigateway.binaryTypes);
                }

            }
            return true;
        })
    }
}

/** Export APIGatewayCustomiser class */
module.exports = APIGatewayCustomiser;
