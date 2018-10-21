'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.CALL_RPC = exports.CALL_AJAX = undefined;

exports.default = function (option) {
  option.normalize = _normalizr.normalize;
  return (0, _index2.default)(option);
};

var _index = require('./index');

var _index2 = _interopRequireDefault(_index);

var _normalizr = require('normalizr');

var _symbols = require('./symbols');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.CALL_AJAX = _symbols.CALL_AJAX;
exports.CALL_RPC = _symbols.CALL_RPC;