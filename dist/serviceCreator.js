'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = servicesCreactor;

var _symbols = require('./symbols');

var modeMap = {
  ajax: _symbols.CALL_AJAX,
  rpc: _symbols.CALL_RPC
};

function servicesCreactor(obj) {
  var mode = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 'ajax';

  return Object.keys(obj).reduce(function (p, v) {
    var func = obj[v];
    p[v] = function (_ref, payload) {
      var dispatch = _ref.dispatch;

      var value = func(payload);
      if (value._mock) {
        value.mockData = value;
      }
      value.type = value.type || v;
      dispatch(modeMap[mode], value);
    };
    return p;
  }, {});
}