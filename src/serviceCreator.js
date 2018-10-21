import { CALL_AJAX, CALL_RPC } from './symbols';

const modeMap = {
  ajax: CALL_AJAX,
  rpc: CALL_RPC
};

export default function servicesCreactor(obj, mode = 'ajax') {
  return Object.keys(obj)
  .reduce((p, v) => {
    const func = obj[v];
    p[v] = function({ dispatch }, payload) {
      const value = func(payload);
      if (value._mock) {
        value.mockData = value;
      }
      value.type = value.type || v;
      dispatch(modeMap[mode], value);
    };
    return p;
  }, {});
}
