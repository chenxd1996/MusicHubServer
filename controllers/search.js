const netease = require('../services/netease');

exports.search = async (ctx) => {
  const { musicProvider } = ctx;
  const { keyword, page } = { ...ctx.query, ...ctx.request.body };
  try {
    const result = await musicProvider.search(keyword, page);
    ctx.body = {
      retcode: 0,
      data: {
        search_result: result,
      }
    };
  } catch (e) {
    console.error(e);
    ctx.body = {
      retcode: -1024,
      msg: e.toString(),
    };
  }
};
