"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = ajaxRequestWrapper;

var _ExternalPromiseCached;

function _ExternalPromise() { if (_ExternalPromiseCached) return _ExternalPromiseCached; if (typeof window !== 'undefined' && window.Promise && typeof window.Promise.resolve === 'function') { _ExternalPromiseCached = window.Promise; } else { _ExternalPromiseCached = require("babel-runtime/core-js/promise").default || require("babel-runtime/core-js/promise"); } return _ExternalPromiseCached; }

function ajaxRequestWrapper(fullUrl, customOptions) {
  return new (_ExternalPromise())(function (resolve, reject) {
    my.httpRequest({
      url: fullUrl, // 目标服务器url
      success: function success(res) {
        resolve(res);
      },
      fail: reject
      // ...customOptions
    });
  });
}