const netease = require('../services/netease');

exports.getLyric = async (ctx) => {
  const { trackId } = ctx.params;
  try {
    const lyric = await netease.lyric(trackId);
    ctx.body = {
      retcode: 0,
      data: {
        lyric,
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

exports.getSong = async (ctx) => {
  const { trackId } = ctx.params;
  try {
    const [songUrl, lyric] = await Promise.all([
      netease.bootstrap_track(trackId),
      netease.lyric(trackId),
    ]);
    ctx.body = {
      retcode: 0,
      data: {
        url: songUrl,
        lyric,
      },
    };
  } catch (e) {
    console.error(e);
    ctx.body = {
      retcode: -1024,
      msg: e.toString(),
    };
  }
};
