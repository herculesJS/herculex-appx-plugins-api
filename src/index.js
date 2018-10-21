import ajaxRequestWrapper from './ajaxWrapper';
import { CALL_AJAX, CALL_RPC } from './symbols';
import servicesCreactor from './serviceCreator';

export {
  CALL_AJAX,
  CALL_RPC,
  servicesCreactor
};

function callApiAjax(payload, option) {
  const { endpoint, schema, options, mapResult, isJSON, apiRoot, isFake, skipErrorhandle, mockData } = payload;
  const API_ROOT = apiRoot || option.API_ROOT;
  const fullUrl = endpoint.startsWith('http')
    ? API_ROOT + endpoint
    : endpoint;
  const customOptions = Object.assign({}, options, {
    method: isFake ? 'get' : options && options.method
  });
  if (isJSON) {
    customOptions.headers.Accept = 'application/json';
    customOptions.headers['Content-Type'] = 'application/json';
  }
  const logger = option.logger ? (option.logger === true ? innerLogger : option.logger) : false;
  if (logger && logger.request) {
    logger.request(fullUrl, customOptions);
  }
  const currentViewId = getCurrentPages().pop().$viewId;
  let wrapper = ajaxRequestWrapper;
  if (mockData) {
    wrapper = () => Promise.resolve({
      data: mockData
    });
  }
  return wrapper(fullUrl, customOptions)
    .then(response => {
      console.log('here', response);
      const nextViewId = getCurrentPages().pop().$viewId;
      if (currentViewId !== nextViewId) {
        return Promise.reject({
          abort: true
        });
      }
      if (logger && logger.response) {
        logger.response(fullUrl, response, customOptions);
      }
      return ({ json: response.data, response });
    }
    ).then(({ json, response }) => {
      if (!json.success) {
        return Promise.reject(json);
      }
      if (mapResult) {
        json = mapResult(json);
      }
      if (option.normalize && schema && typeof (schema) === 'function') {
        return option.normalize(json, schema(json));
      } else if (schema) {
        return option.normalize(json, schema);
      }
      return json;
    })
    .catch(e => {
      logger && logger.response(fullUrl, e, customOptions);
      if (!skipErrorhandle && option.errorHandler) {
        e.customErr = option.errorHandler(e, payload, customOptions);
        if (e.customErr === 'filter') {
          return Promise.resolve(e);
        }
      }
      return Promise.reject(e);
    }
    );
}

const callApiAdaptor = {
  [CALL_AJAX]: callApiAjax
};

const innerLogger = {
  request: (url, ...args) => console.info(`%c REQUEST TO ${url}`, 'color: #FFa940; font-weight: bold', ...args),
  response: (url, ...args) => console.info(`%c RESPONSE FROM ${url}`, 'color: #FFa940; font-weight: bold', ...args)
};
/**
 * @param  {} option
 * @param  {} option.API_ROOT ajax 的跟root
 * @param  {} option.logger 是否开启 logger，也可以传自定义 logger
 * @param  {} option.errorHandler 是否开启统一错误处理
 */
export default function plugin(option = {}) {
  return [function(store) {
    store.subscribeAction((action, next) => {
      if (![CALL_AJAX, CALL_RPC].includes(action.type)) {
        return next();
      }
      if (action.type !== CALL_AJAX) return next();
      const { payload } = action;
      let { endpoint, types } = payload;
      const {
        type,
        getFromCache
      } = payload;

      if (typeof endpoint === 'function') {
        endpoint = endpoint(store.state);
      }

      if (typeof endpoint !== 'string') {
        throw new Error('Specify a string endpoint URL.');
      }
      if (type) {
        const largerType = type.toUpperCase();
        types = [
          `${largerType}_REQUEST`,
          `${largerType}_SUCCESS`,
          `${largerType}_FAILURE`
        ];
      }
      if (!Array.isArray(types) || types.length !== 3) {
        throw new Error('Expected an array of three action types.');
      }
      const [requestType, successType, failureType] = types;
      store.commit(requestType, {
        path: ['$loading', type || types.split('_').slice(0, -1).join('_')],
        value: { isLoading: true, ...payload }
      }, '$setIn');
      let callFunc = callApiAdaptor[action.type];
      if (getFromCache) {
        callFunc = getFromCache(payload, store.state, callFunc);
      }
      if (callFunc) {
        return callFunc(payload, option)
        .then((response) => {
          store.commit(successType, {
            path: ['$loading', type || types.split('_').slice(0, -1).join('_')],
            value: { isLoading: false, ...payload, type: 'SUCCESS' }
          }, '$setIn');
          if (response && response.entities) {
            store.commit('setEntities', response);
          }
          store.commit(`SET_${type.toUpperCase()}_RESULT`, {
            path: ['$result', type || types.split('_').slice(0, -1).join('_')],
            value: response
          }, '$setIn');
          return next(response);
        })
        .catch(e => {
          store.commit(failureType, {
            path: ['$loading', type || types.split('_').slice(0, -1).join('_')],
            value: { isLoading: false, ...payload, type: 'FAILURE' }
          }, '$setIn');
          return Promise.reject(e);
        });
      }
      return next();
    });
  }, config => {
    if (option.normalize) {
      config.state.$entities = {};
    }
    Object.assign(config.state, {
      $loading: {},
      $result: {}
    });
    Object.assign(config.mutations, {
      $setEntities(state, payload) {
        Object.assign(state.$entity, payload.entities);
      }
    });
  }];
}
