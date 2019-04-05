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
  return config;
});

module.exports = axios;
