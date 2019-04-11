const { prefixs = {} } = require('../common/const');

const providers = {};

const prefixsArr = Object.values(prefixs);

prefixsArr.forEach((prefix = '') => {
  // eslint-disable-next-line
  providers[prefix] = require(`../services/${prefix.replace('_', '')}`);
});

module.exports = async (ctx, next) => {
  prefixsArr.forEach((prefix = '') => {
    if (ctx.url.indexOf(prefix) > 0) {
      ctx.musicProvider = providers[prefix];
      return false;
    }
  });
  await next();
};
