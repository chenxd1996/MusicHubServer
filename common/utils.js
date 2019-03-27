exports.json2FormUrlEncoded = function (json) {
  return Object.keys(json).map((key) => {
    let value = json[key];
    if (typeof value === 'object') {
      value = JSON.stringify(value);
    }
    return `${encodeURIComponent(key)}=${encodeURIComponent(value)}`;
  }).join('&');
};
