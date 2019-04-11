const axios = require('axios');


// 生成随机ip地址
function r(min, max) {
  return Math.floor(min + Math.random() * (max - min));
}
function getRandomIp() {
  return `${r(1, 255)}.${r(1, 255)}.${r(1, 255)}.${r(1, 255)}`;
}

axios.interceptors.request.use((config) => {
  config.headers.common['X-Forwarded-For'] = getRandomIp();
  // config.headers.common['User-Agent'] = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/73.0.3683.86 Safari/537.36';
  return config;
});

module.exports = axios;
