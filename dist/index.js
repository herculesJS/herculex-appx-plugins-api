'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.servicesCreactor = exports.CALL_RPC = exports.CALL_AJAX = undefined;

var _assign = require('babel-runtime/core-js/object/assign');

var _assign2 = _interopRequireDefault(_assign);

var _extends = _assign2.default || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

exports.default = plugin;

var _ajaxWrapper = require('./ajaxWrapper');

var _ajaxWrapper2 = _interopRequireDefault(_ajaxWrapper);

var _symbols = require('./symbols');

var _serviceCreator = require('./serviceCreator');

var _serviceCreator2 = _interopRequireDefault(_serviceCreator);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var _ExternalPromiseCached;

function _ExternalPromise() { if (_ExternalPromiseCached) return _ExternalPromiseCached; if (typeof window !== 'undefined' && window.Promise && typeof window.Promise.resolve === 'function') { _ExternalPromiseCached = window.Promise; } else { _ExternalPromiseCached = require('babel-runtime/core-js/promise').default || require('babel-runtime/core-js/promise'); } return _ExternalPromiseCached; }

exports.CALL_AJAX = _symbols.CALL_AJAX;
exports.CALL_RPC = _symbols.CALL_RPC;
exports.servicesCreactor = _serviceCreator2.default;


function callApiAjax(payload, option) {
  var endpoint = payload.endpoint,
      schema = payload.schema,
      options = payload.options,
      mapResult = payload.mapResult,
      isJSON = payload.isJSON,
      apiRoot = payload.apiRoot,
      isFake = payload.isFake,
      skipErrorhandle = payload.skipErrorhandle,
      mockData = payload.mockData;

  var API_ROOT = apiRoot || option.API_ROOT;
  var fullUrl = endpoint.startsWith('http') ? API_ROOT + endpoint : endpoint;
  var customOptions = (0, _assign2.default)({}, options, {
    method: isFake ? 'get' : options && options.method
  });
  if (isJSON) {
    customOptions.headers.Accept = 'application/json';
    customOptions.headers['Content-Type'] = 'application/json';
  }
  var logger = option.logger ? option.logger === true ? innerLogger : option.logger : false;
  if (logger && logger.request) {
    logger.request(fullUrl, customOptions);
  }
  var currentViewId = getCurrentPages().pop().$viewId;
  var wrapper = _ajaxWrapper2.default;
  if (mockData) {
    wrapper = function wrapper() {
      return _ExternalPromise().resolve({
        data: mockData
      });
    };
  }
  return wrapper(fullUrl, customOptions).then(function (response) {
    console.log('here', response);
    var nextViewId = getCurrentPages().pop().$viewId;
    if (currentViewId !== nextViewId) {
      return _ExternalPromise().reject({
        abort: true
      });
    }
    if (logger && logger.response) {
      logger.response(fullUrl, response, customOptions);
    }
    return { json: response.data, response: response };
  }).then(function (_ref) {
    var json = _ref.json,
        response = _ref.response;

    if (!json.success) {
      return _ExternalPromise().reject(json);
    }
    if (mapResult) {
      json = mapResult(json);
    }
    if (option.normalize && schema && typeof schema === 'function') {
      return option.normalize(json, schema(json));
    } else if (schema) {
      return option.normalize(json, schema);
    }
    return json;
  }).catch(function (e) {
    logger && logger.response(fullUrl, e, customOptions);
    if (!skipErrorhandle && option.errorHandler) {
      e.customErr = option.errorHandler(e, payload, customOptions);
      if (e.customErr === 'filter') {
        return _ExternalPromise().resolve(e);
      }
    }
    return _ExternalPromise().reject(e);
  });
}

var callApiAdaptor = _defineProperty({}, _symbols.CALL_AJAX, callApiAjax);

var innerLogger = {
  request: function request(url) {
    var _console;

    for (var _len = arguments.length, args = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
      args[_key - 1] = arguments[_key];
    }

    return (_console = console).info.apply(_console, ['%c REQUEST TO ' + url, 'color: #FFa940; font-weight: bold'].concat(args));
  },
  response: function response(url) {
    var _console2;

    for (var _len2 = arguments.length, args = Array(_len2 > 1 ? _len2 - 1 : 0), _key2 = 1; _key2 < _len2; _key2++) {
      args[_key2 - 1] = arguments[_key2];
    }

    return (_console2 = console).info.apply(_console2, ['%c RESPONSE FROM ' + url, 'color: #FFa940; font-weight: bold'].concat(args));
  }
};
/**
 * @param  {} option
 * @param  {} option.API_ROOT ajax 的跟root
 * @param  {} option.logger 是否开启 logger，也可以传自定义 logger
 * @param  {} option.errorHandler 是否开启统一错误处理
 */
function plugin() {
  var option = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

  return [function (store) {
    store.subscribeAction(function (action, next) {
      if (![_symbols.CALL_AJAX, _symbols.CALL_RPC].includes(action.type)) {
        return next();
      }
      if (action.type !== _symbols.CALL_AJAX) return next();
      var payload = action.payload;
      var endpoint = payload.endpoint,
          types = payload.types;
      var type = payload.type,
          getFromCache = payload.getFromCache;


      if (typeof endpoint === 'function') {
        endpoint = endpoint(store.state);
      }

      if (typeof endpoint !== 'string') {
        throw new Error('Specify a string endpoint URL.');
      }
      if (type) {
        var largerType = type.toUpperCase();
        types = [largerType + '_REQUEST', largerType + '_SUCCESS', largerType + '_FAILURE'];
      }
      if (!Array.isArray(types) || types.length !== 3) {
        throw new Error('Expected an array of three action types.');
      }
      var _types = types,
          requestType = _types[0],
          successType = _types[1],
          failureType = _types[2];

      store.commit(requestType, {
        path: ['$loading', type || types.split('_').slice(0, -1).join('_')],
        value: _extends({ isLoading: true }, payload)
      }, '$setIn');
      var callFunc = callApiAdaptor[action.type];
      if (getFromCache) {
        callFunc = getFromCache(payload, store.state, callFunc);
      }
      if (callFunc) {
        return callFunc(payload, option).then(function (response) {
          store.commit(successType, {
            path: ['$loading', type || types.split('_').slice(0, -1).join('_')],
            value: _extends({ isLoading: false }, payload, { type: 'SUCCESS' })
          }, '$setIn');
          if (response && response.entities) {
            store.commit('setEntities', response);
          }
          store.commit('SET_' + type.toUpperCase() + '_RESULT', {
            path: ['$result', type || types.split('_').slice(0, -1).join('_')],
            value: response
          }, '$setIn');
          return next(response);
        }).catch(function (e) {
          store.commit(failureType, {
            path: ['$loading', type || types.split('_').slice(0, -1).join('_')],
            value: _extends({ isLoading: false }, payload, { type: 'FAILURE' })
          }, '$setIn');
          return _ExternalPromise().reject(e);
        });
      }
      return next();
    });
  }, function (config) {
    if (option.normalize) {
      config.state.$entities = {};
    }
    (0, _assign2.default)(config.state, {
      $loading: {},
      $result: {}
    });
    (0, _assign2.default)(config.mutations, {
      $setEntities: function $setEntities(state, payload) {
        (0, _assign2.default)(state.$entity, payload.entities);
      }
    });
  }];
}