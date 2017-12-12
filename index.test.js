'use strict';

import Promise from 'bluebird';
import sinon from 'sinon';
import APIGatewayCustomiser from './index';

const expect = require('chai').expect;

const AWS = require('aws-sdk');

const serverless = {
  service: {
    custom: {
      apigateway: {
        binaryTypes: ['a', 'a/b', 'a/b/c'],
        responses: [
          { response: { headers: 'fakeHeaders' } },
          { response: { bodyMappingTemplate: 'fakeBodyMappingTemplate' } }
        ]
      }
    },
    provider: {
      stage: 'test-serverless-service-provider-stage',
      region: 'test-serverless-service-provider-region',
      name: 'test-serverless-service-provider-name'
    }
  },
  cli: {
    log: (message) => { }
  },
  stage: null,
  getProvider: () =>
  ({
    naming: {
      getApiGatewayName: () => 'test-serverless-getProvider-naming-getApiGatewayName'
    }
  })
};
const options = {
  createDeploymentRetryDelay: 100
};

describe('APIGatewayCustomiser', () => {
  let sandbox;

  before(() => {
    // sandbox = sinon.sandbox.create();
  });

  beforeEach(() => {
    sandbox = sinon.sandbox.create();
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe('constructor', () => {
    it('should init the APIGatewayCustomiser parameters', () => {
      const apiGatewayCustomiser = new APIGatewayCustomiser(serverless, {});
      expect(apiGatewayCustomiser.createDeploymentRetryDelay).to.equal(5 * 1000);
      expect(apiGatewayCustomiser.serverless).to.deep.equal(serverless);
      // expect(apiGatewayCustomiser.options).to.deep.equal(options);
      expect(apiGatewayCustomiser.custom).to.deep.equal(serverless.service.custom);
      expect(apiGatewayCustomiser.hooks).to.be.not.undefined;
    });

    it('should init the APIGatewayCustomiser parameters with createDeploymentRetryDelay options', () => {
      const apiGatewayCustomiser = new APIGatewayCustomiser(serverless, options);
      expect(apiGatewayCustomiser.createDeploymentRetryDelay).to.equal(100);
    });
  });

  describe('afterDeployFunctions', () => {
    it('should add APIGatewayCustomiser attributes with pre-populated values', () => {
      const apiGatewayCustomiser = new APIGatewayCustomiser(serverless, options);

      // stub the return response calling a function
      sandbox.stub(apiGatewayCustomiser, 'modifyAPIGateway').returns(true);
      sandbox.stub(AWS, 'APIGateway').callsFake(() => {
        apiGatewayCustomiser.apiGatewaySDK = 'fakeModifyAPIGatewayFromStub';
      });

      apiGatewayCustomiser.afterDeployFunctions();
      expect(apiGatewayCustomiser.stage).to.deep.equal('test-serverless-service-provider-stage');
      expect(apiGatewayCustomiser.region).to.deep.equal('test-serverless-service-provider-region');
      expect(apiGatewayCustomiser.providerName).to.deep.equal('test-serverless-service-provider-name');
      expect(apiGatewayCustomiser.apiName).to.deep.equal('test-serverless-getProvider-naming-getApiGatewayName');
      expect(apiGatewayCustomiser.modifyAPIGateway.called).to.equal(true);
    });

    it('should add APIGatewayCustomiser attributes with defaults', () => {
      const serverlessWithoutProvider = Object.assign({}, serverless, {
        service: {
          custom: serverless.service.custom,
          provider: {
            name: 'test-serverless-service-provider-name'
          }
        }
      });
      const apiGatewayCustomiser = new APIGatewayCustomiser(serverlessWithoutProvider, options);

      sandbox.stub(apiGatewayCustomiser, 'modifyAPIGateway').returns(true);
      sandbox.stub(AWS, 'APIGateway').callsFake(() => {
        apiGatewayCustomiser.apiGatewaySDK = 'fakeModifyAPIGatewayFromStub';
      });

      apiGatewayCustomiser.afterDeployFunctions();

      expect(apiGatewayCustomiser.stage).to.deep.equal('dev');
      expect(apiGatewayCustomiser.region).to.deep.equal('ap-southeast-1');
    });
  });

  describe('modifyAPIGateway', (done) => {
    it('should fail if api is undefined', () => {
      const serverlessMock = Object.assign({}, serverless, {
        service: {
          custom: {
            apigateway: {
              responses: [
                {
                  response: {
                    bodyMappingTemplate: 'fakeBodyMappingTemplate',
                    contentType: '',
                    content: ''
                  }
                },
              ]
            }
          },
          provider: serverless.service.provider
        }
      });
      const apiGatewayCustomiser = new APIGatewayCustomiser(serverlessMock, options);

      // Fake initialisation, dont use the afterDeployment to remove dependency on calls
      apiGatewayCustomiser.apiGatewaySDK = {
        getRestApis: (params, cb) => {
          const data = {
            items: []
          };
          cb(null, data);
        },
      };

      apiGatewayCustomiser.modifyAPIGateway()
      .then((result) => {
        done('it should not have succeeded');
      }, (err) => {
        // Should fail here
        expect(err).to.equal('It failed');
        done();
      })
      .catch((expectErr) => {
        done(expectErr);
      });
    });

    it('should reject getRestApis if there\'s any error', (done) => {
      const apiGatewayCustomiser = new APIGatewayCustomiser(serverless, options);

      apiGatewayCustomiser.apiGatewaySDK = {
        getRestApis: (params, cb) => {
          cb('It failed');
        }
      };

      apiGatewayCustomiser.modifyAPIGateway()
      .then((result) => {
        done('it should not have succeeded');
      }, (err) => {
        // Should fail here
        expect(err).to.equal('It failed');
        done();
      })
      .catch((expectErr) => {
        done(expectErr);
      });
    });

    it('should run in success with response.headers', (done) => {
      const serverlessMock = Object.assign({}, serverless, {
        service: {
          custom: {
            apigateway: {
              responses: [
                {
                  response: {
                    headers: 'fakeHeaders',
                    type: '',
                    statusCode: ''
                  }
                },
              ]
            }
          },
          provider: serverless.service.provider
        }
      });
      const apiGatewayCustomiser = new APIGatewayCustomiser(serverlessMock, options);

      // Fake initialisation, dont use the afterDeployment to remove dependency on calls
      apiGatewayCustomiser.apiGatewaySDK = {
        getRestApis: (params, cb) => {
          const data = {
            items: [{ entry: 'fakeItemEntry1', id: 'fakeItemId1' }, { entry: 'fakeItemEntry2', id: 'fakeItemId2' }]
          };
          cb(null, data);
        },
      };
      apiGatewayCustomiser.configHeaders = () => Promise.resolve();
      apiGatewayCustomiser.createDeployment = (result) => {
        // Make sure the configHeaders has been called according to our input - responses.header
        expect(apiGatewayCustomiser.configHeaders.callCount).to.equal(1);
        // Done here means that we've reached the last step of modifyAPIGateway()
        done();
      };

      sandbox.spy(apiGatewayCustomiser, 'configHeaders');

      apiGatewayCustomiser.modifyAPIGateway();
    });

    it('should run in success with response.bodyMappingTemplate', (done) => {
      const serverlessMock = Object.assign({}, serverless, {
        service: {
          custom: {
            apigateway: {
              responses: [
                {
                  response: {
                    bodyMappingTemplate: 'fakeBodyMappingTemplate',
                    contentType: '',
                    content: ''
                  }
                },
              ]
            }
          },
          provider: serverless.service.provider
        }
      });
      const apiGatewayCustomiser = new APIGatewayCustomiser(serverlessMock, options);

      // Fake initialisation, dont use the afterDeployment to remove dependency on calls
      apiGatewayCustomiser.apiGatewaySDK = {
        getRestApis: (params, cb) => {
          const data = {
            items: [{ entry: 'fakeItemEntry1', id: 'fakeItemId1' }, { entry: 'fakeItemEntry2', id: 'fakeItemId2' }]
          };
          cb(null, data);
        },
      };
      apiGatewayCustomiser.configBodyMapping = () => Promise.resolve();
      apiGatewayCustomiser.createDeployment = (result) => {
        // Make sure the configBodyMapping has been called according to our input - responses.header
        expect(apiGatewayCustomiser.configBodyMapping.callCount).to.equal(1);
        // Done here means that we've reached the last step of modifyAPIGateway()
        done();
      };

      sandbox.spy(apiGatewayCustomiser, 'configBodyMapping');

      apiGatewayCustomiser.modifyAPIGateway();
    });

    it('should run in success with custom.apigateway.binaryTypes', (done) => {
      const serverlessMock = Object.assign({}, serverless, {
        service: {
          custom: {
            apigateway: {
              binaryTypes: ['a', 'a/b', 'a/b/c']
            }
          },
          provider: serverless.service.provider
        }
      });
      const apiGatewayCustomiser = new APIGatewayCustomiser(serverlessMock, options);

      // Fake initialisation, dont use the afterDeployment to remove dependency on calls
      apiGatewayCustomiser.apiGatewaySDK = {
        getRestApis: (params, cb) => {
          const data = {
            items: [{ entry: 'fakeItemEntry1', id: 'fakeItemId1' }, { entry: 'fakeItemEntry2', id: 'fakeItemId2' }]
          };
          cb(null, data);
        },
      };
      apiGatewayCustomiser.configBinary = () => Promise.resolve();
      apiGatewayCustomiser.createDeployment = (result) => {
        // Make sure the configBodyBinary has been called according to our input - responses.header
        expect(apiGatewayCustomiser.configBinary.callCount).to.equal(1);
        // Done here means that we've reached the last step of modifyAPIGateway()
        done();
      };

      sandbox.spy(apiGatewayCustomiser, 'configBinary');

      apiGatewayCustomiser.modifyAPIGateway();
    });
  });

  describe('createDeployment', () => {
    it('should return a promise', () => {
      const apiGatewayCustomiser = new APIGatewayCustomiser(serverless, options);

      // Fake initialisation, dont use the afterDeployment to remove dependency on calls
      apiGatewayCustomiser.apiGatewaySDK = {
        createDeployment: (params, cb) => {
          cb(null, 'Okay');
        }
      };

      const promise = apiGatewayCustomiser.createDeployment('fakeId');
      expect(promise).to.be.an.instanceof(Promise);
    });

    it('should have its Promise successfully resolved', (done) => {
      const apiGatewayCustomiser = new APIGatewayCustomiser(serverless, options);

      // Fake initialisation, dont use the afterDeployment to remove dependency on calls
      apiGatewayCustomiser.apiGatewaySDK = {
        createDeployment: (params, cb) => {
          cb(null, 'Okay');
        }
      };

      apiGatewayCustomiser.createDeployment('fakeId')
        .then((result) => {
          // Should succeed here
          expect(result).to.equal('Success');
          done();
        }, (err) => {
          done('It should not have failed');
        })
        .catch((expectErr) => {
          done(expectErr);
        });
    });

    it('should reject Promise if there\'s any unknown error', (done) => {
      const apiGatewayCustomiser = new APIGatewayCustomiser(serverless, options);

      // Fake initialisation, dont use the afterDeployment to remove dependency on calls
      apiGatewayCustomiser.apiGatewaySDK = {
        createDeployment: (params, cb) => {
          cb('It failed');
        }
      };

      apiGatewayCustomiser.createDeployment('fakeId')
        .then((result) => {
          done('it should not have succeeded');
        }, (err) => {
          // Should fail here
          expect(err).to.equal('It failed');
          done();
        })
        .catch((expectErr) => {
          done(expectErr);
        });
    });

    it('should retry if an error code of \'TooManyRequests\'', (done) => {
      const apiGatewayCustomiser = new APIGatewayCustomiser(serverless, options);
      sandbox.spy(APIGatewayCustomiser.prototype, 'createDeployment');

      let count = 1;
      apiGatewayCustomiser.apiGatewaySDK = {
        createDeployment: (params, cb) => {
          if (count === 1) {
            count = 2;
            cb({ code: 'TooManyRequestsException' });
          } else {
            // Should have been called twice for retry;
            expect(apiGatewayCustomiser.createDeployment.callCount).equal(2);
            cb(null, 'Okay');
            done();
          }
        }
      };

      apiGatewayCustomiser.createDeployment('fakeId');
    });
  });

  describe('configHeaders', () => {
    it('should return a promise', () => {
      const apiGatewayCustomiser = new APIGatewayCustomiser(serverless, options);

      // Fake initialisation, dont use the afterDeployment to remove dependency on calls
      apiGatewayCustomiser.apiGatewaySDK = {
        putGatewayResponse(params, cb) {
          cb(null, 'Okay');
        }
      };

      const fakeResponse = {
        type: 'fakeType',
        headers: 'fakeHeaders',
        statusCode: 'fakeStatusCode'
      };

      const promise = apiGatewayCustomiser.configHeaders('fakeApiId', fakeResponse);
      expect(promise).to.be.an.instanceof(Promise);
    });

    it('should return a promise even if response.headers was omitted', () => {
      const apiGatewayCustomiser = new APIGatewayCustomiser(serverless, options);

      // Fake initialisation, dont use the afterDeployment to remove dependency on calls
      apiGatewayCustomiser.apiGatewaySDK = {
        putGatewayResponse(params, cb) {
          cb(null, 'Okay');
        }
      };

      const fakeResponse = {
        type: 'fakeType',
        statusCode: 'fakeStatusCode'
      };

      const promise = apiGatewayCustomiser.configHeaders('fakeApiId', fakeResponse);
      expect(promise).to.be.an.instanceof(Promise);
    });

    it('should have its Promise successfully resolved', (done) => {
      const apiGatewayCustomiser = new APIGatewayCustomiser(serverless, options);

      // Fake initialisation, dont use the afterDeployment to remove dependency on calls
      apiGatewayCustomiser.apiGatewaySDK = {
        putGatewayResponse(params, cb) {
          cb(null, 'Okay');
        }
      };

      const fakeResponse = {
        type: 'fakeType',
        headers: 'fakeHeaders',
        statusCode: 'fakeStatusCode'
      };

      apiGatewayCustomiser.configHeaders('fakeApiId', fakeResponse)
        .then((result) => {
          // Should succeed here
          expect(result).to.equal(`Header set successfully: ${fakeResponse.type.toString()}`);
          done();
        }, (err) => {
          done('It should not have failed');
        })
        .catch((expectErr) => {
          done(expectErr);
        });
    });
    it('should reject Promise if there\'s any unknown error', (done) => {
      const apiGatewayCustomiser = new APIGatewayCustomiser(serverless, options);

      // Fake initialisation, dont use the afterDeployment to remove dependency on calls
      apiGatewayCustomiser.apiGatewaySDK = {
        putGatewayResponse(params, cb) {
          cb('It failed');
        }
      };

      const fakeResponse = {
        type: 'fakeType',
        headers: 'fakeHeaders',
        statusCode: 'fakeStatusCode'
      };

      apiGatewayCustomiser.configHeaders('fakeApiId', fakeResponse)
        .then((result) => {
          done('it should not have succeeded');
        }, (err) => {
          // Should fail here
          expect(err).to.equal('It failed');
          done();
        })
        .catch((expectErr) => {
          done(expectErr);
        });
    });
  });

  describe('configBodyMapping', () => {
    it('should return a promise', () => {
      const apiGatewayCustomiser = new APIGatewayCustomiser(serverless, options);

      // Fake initialisation, dont use the afterDeployment to remove dependency on calls
      apiGatewayCustomiser.apiGatewaySDK = {
        updateGatewayResponse(params, cb) {
          cb(null, 'Okay');
        }
      };

      const fakeResponse = {
        type: 'fakeType',
        bodyMappingTemplate: {
          contentType: 'fakeContentType',
          content: 'fakeContentType'
        }
      };

      const promise = apiGatewayCustomiser.configBodyMapping('fakeApiId', fakeResponse);
      expect(promise).to.be.an.instanceof(Promise);
    });

    it('should have its Promise successfully resolved', (done) => {
      const apiGatewayCustomiser = new APIGatewayCustomiser(serverless, options);

      // Fake initialisation, dont use the afterDeployment to remove dependency on calls
      apiGatewayCustomiser.apiGatewaySDK = {
        updateGatewayResponse(params, cb) {
          cb(null, 'Okay');
        }
      };

      const fakeResponse = {
        type: 'fakeType',
        bodyMappingTemplate: {
          contentType: 'fakeContentType',
          content: 'fakeContentType'
        }
      };

      apiGatewayCustomiser.configBodyMapping('fakeApiId', fakeResponse)
        .then((result) => {
          // Should succeed here
          expect(result).to.equal(`Body Mapping Templates set successfully: ${fakeResponse.type.toString()}`);
          done();
        }, (err) => {
          done('It should not have failed');
        })
        .catch((expectErr) => {
          done(expectErr);
        });
    });
    it('should reject Promise if there\'s any unknown error', (done) => {
      const apiGatewayCustomiser = new APIGatewayCustomiser(serverless, options);

      // Fake initialisation, dont use the afterDeployment to remove dependency on calls
      apiGatewayCustomiser.apiGatewaySDK = {
        updateGatewayResponse(params, cb) {
          cb('It failed');
        }
      };

      const fakeResponse = {
        type: 'fakeType',
        bodyMappingTemplate: {
          contentType: 'fake/Content/Type',
          content: 'fakeContentType'
        }
      };

      apiGatewayCustomiser.configBodyMapping('fakeApiId', fakeResponse)
        .then((result) => {
          done('it should not have succeeded');
        }, (err) => {
          // Should fail here
          expect(err).to.equal('It failed');
          done();
        })
        .catch((expectErr) => {
          done(expectErr);
        });
    });
  });

  describe('configBinary', () => {
    it('should return a promise', () => {
      const apiGatewayCustomiser = new APIGatewayCustomiser(serverless, options);

      // Fake initialisation, dont use the afterDeployment to remove dependency on calls
      apiGatewayCustomiser.apiGatewaySDK = {
        updateRestApi(params, cb) {
          cb(null, 'Okay');
        }
      };

      const promise = apiGatewayCustomiser.configBinary('fakeApiId');
      expect(promise).to.be.an.instanceof(Promise);
    });

    it('should have its Promise successfully resolved', (done) => {
      const apiGatewayCustomiser = new APIGatewayCustomiser(serverless, options);

      // Fake initialisation, dont use the afterDeployment to remove dependency on calls
      apiGatewayCustomiser.apiGatewaySDK = {
        updateRestApi(params, cb) {
          cb(null, 'Okay');
        }
      };

      apiGatewayCustomiser.configBinary('fakeApiId')
        .then((result) => {
          // Should succeed here
          expect(result).to.equal('binary set successfully');
          done();
        }, (err) => {
          done('It should not have failed');
        })
        .catch((expectErr) => {
          done(expectErr);
        });
    });

    it('should have its transform binaryType List correctly', (done) => {
      const apiGatewayCustomiser = new APIGatewayCustomiser(serverless, options);

      // Fake initialisation, dont use the afterDeployment to remove dependency on calls
      apiGatewayCustomiser.apiGatewaySDK = {
        updateRestApi(params, cb) {
          expect(params.patchOperations[0].path).to.equal('/binaryMediaTypes/a');
          expect(params.patchOperations[1].path).to.equal('/binaryMediaTypes/a~1b');
          expect(params.patchOperations[2].path).to.equal('/binaryMediaTypes/a~1b/c');
          cb(null, 'Okay');
        }
      };

      apiGatewayCustomiser.configBinary('fakeApiId')
        .then((result) => {
          done();
        })
        .catch((expectErr) => {
          done(expectErr);
        });
    });

    it('should reject Promise if there\'s any unknown error', (done) => {
      const apiGatewayCustomiser = new APIGatewayCustomiser(serverless, options);

      // Fake initialisation, dont use the afterDeployment to remove dependency on calls
      apiGatewayCustomiser.apiGatewaySDK = {
        updateRestApi(params, cb) {
          cb('It failed');
        }
      };

      apiGatewayCustomiser.configBinary('fakeApiId')
        .then((result) => {
          done('it should not have succeeded');
        }, (err) => {
          // Should fail here
          expect(err).to.equal('It failed');
          done();
        })
        .catch((expectErr) => {
          done(expectErr);
        });
    });
  });
});
