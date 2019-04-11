const netease = require('../services/netease');
const { parseLyric } = require('../common//utils');

exports.getLyric = async (ctx) => {
  const { musicProvider } = ctx;
  const { trackId } = ctx.params;
  try {
    const lyric = await musicProvider.lyric(trackId);
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
  const { musicProvider } = ctx;
  const { trackId } = ctx.params;
  try {
    const [songUrl, lyric = {}] = await Promise.all([
      musicProvider.bootstrap_track(trackId),
      musicProvider.lyric(trackId),
    ]);
    ctx.body = {
      retcode: 0,
      data: {
        id: trackId,
        url: songUrl,
        lyric: parseLyric(lyric.lyric),
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
