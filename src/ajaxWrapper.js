export default function ajaxRequestWrapper(fullUrl, customOptions) {
  return new Promise((resolve, reject) => {
    my.httpRequest({
      url: fullUrl, // 目标服务器url
      success: (res) => {
        resolve(res);
      },
      fail: reject
      // ...customOptions
    });
  });
}
