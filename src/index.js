'use strict'

/**
 * @module serverless-apigateway-plugin
 *
 * @see {@link https://serverless.com/framework/docs/providers/aws/guide/plugins/}
 * */

import AWS from 'aws-sdk';

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
     * apigateway
     *   responses
     *     -  response
     *         type:
     *         headers:
     *         bodyMappingTemplate:
     *   binaryTypes:
     *     - 'image/jpg'
     *     - 'text/html'
     * */
    constructor (serverless, options) {
        /** Serverless variables */
        this.serverless = serverless;
        this.options = options;
        this.custom = this.serverless.service.custom;
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
        /** Default options */
        this.apiGatewayConfig = (this.custom.apiGatewayConfig.responses.apiGatewayConfig)? this.custom.apiGatewayConfig.responses:'';

        /** responses */
        if (this.custom.apiGatewayConfig.responses) {
            console.log(this.custom.apiGatewayConfig.responses);
        }
        /** binary support */
        if (this.custom.apiGatewayConfig.binaryTypes) {
            console.log(this.custom.apiGatewayConfig.binaryTypes);
        }
    }

    /**
     * @description Warm up the functions immediately after deployment
     *
     * @fulfil {} — Functions warmed up sucessfuly
     * @reject {Error} Functions couldn't be warmed up
     *
     * @return {Promise}
     * */
    modifyAPIGateway () {
        this.serverless.cli.log('API Gateway Configuring Starts:');
    }
}

/** Export APIGatewayCustomiser class */
module.exports = APIGatewayCustomiser
