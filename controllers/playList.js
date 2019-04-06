const netease = require('../services/netease');

exports.getAllPlayLists = async (ctx) => {
  const { offset = 0 } = { ...ctx.query, ...ctx.request.body };
  try {
    const playLists = await netease.show_playlist(offset);
    ctx.body = {
      retcode: 0,
      data: {
        playLists,
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

exports.getPlayListDetail = async (ctx) => {
  const { playListId } = ctx.params;

  try {
    const playList = await netease.get_playlist(playListId);
    ctx.body = {
      retcode: 0,
      data: {
        playList,
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

exports.getAlbum = async (ctx) => {
  const { albumId } = ctx.params;

  try {
    const album = await netease.get_album(albumId);
    ctx.body = {
      retcode: 0,
      data: {
        playList: album,
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

exports.getArtist = async (ctx) => {
  const { artistId } = ctx.params;

  try {
    const artist = await netease.get_artist(artistId);
    ctx.body = {
      retcode: 0,
      data: {
        playList: artist,
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
