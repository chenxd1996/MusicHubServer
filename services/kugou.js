const aesjs = require('aes-js');
const { JSDOM } = require('jsdom');
const btoa = require('btoa');
const atob = require('atob');
const encoding = require('text-encoding');
const axios = require('../common/axios');
const { prefixs } = require('../common/const');
const { json2FormUrlEncoded } = require('../common/utils');

const prefix = prefixs.KUGOU;

const commonHeaders = {
  'X-Forwarded-For': null,
};

/* global async getParameterByName */
function build_kugou() {
  function kg_convert_song(song) {
    const track = {
      id: `${prefix}${song.FileHash}`,
      title: song.SongName,
      artist: '',
      artist_id: '',
      album: song.AlbumName,
      album_id: `${prefix}${song.AlbumID}`,
      source: 'kugou',
      source_url: `http://www.kugou.com/song/#hash=${song.FileHash}&album_id=${song.AlbumID}`,
      img_url: '',
      url: `kgtrack_${song.FileHash}`,
      lyric_url: song.FileHash,
    };
    let singer_id = song.SingerId;
    let singer_name = song.SingerName;
    if (song.SingerId instanceof Array) {
      [singer_id] = singer_id;
      [singer_name] = singer_name.split('、');
    }
    track.artist = singer_name;
    track.artist_id = `${prefix}${singer_id}`;
    return track;
  }

  function async_process_list(data_list, handler, handler_extra_param_list, callback) {
    const fnDict = {};
    data_list.forEach((item, index) => {
      fnDict[index] = cb => handler(index, item, handler_extra_param_list, cb);
    });
    async.parallel(fnDict,
      (err, results) => callback(null, data_list.map((item, index) => results[index])));
  }

  function kg_render_search_result_item(item) {
    const track = kg_convert_song(item);
    // Add singer img
    const url = `${'http://www.kugou.com/yy/index.php?'
            + 'r=play/getdata&hash='}${track.lyric_url}`;
    return axios({
      url,
      method: 'GET',
      headers: {
        ...commonHeaders,
      }
    }).then((response) => {
      const { data } = response;
      track.img_url = data.data.img;
      return track;
    });
  }

  function kg_search(keyword, curpage) { // eslint-disable-line no-unused-vars
    const target_url = `${'http://songsearch.kugou.com/'
    + 'song_search_v2?keyword='}${encodeURIComponent(keyword)}&page=${curpage}`;
    return axios({
      url: target_url,
      method: 'GET',
      headers: {
        ...commonHeaders,
      }
    })
      .then(async (response) => {
        const { data } = response;
        const list = data.data.lists;
        const tracks = await Promise.all(
          list.map((item) => {
            return kg_render_search_result_item(item);
          })
        );
        return {
          result: tracks,
          total: data.data.total,
        };
      });
  }

  function kg_render_playlist_result_item(item) {
    let target_url = `${'http://m.kugou.com/app/i/getSongInfo.php?'
        + 'cmd=playInfo&hash='}${item.hash}`;

    const track = {
      id: `${prefix}${item.hash}`,
      title: '',
      artist: '',
      artist_id: '',
      album: '',
      album_id: `${prefix}${item.album_id}`,
      source: 'kugou',
      source_url: `http://www.kugou.com/song/#hash=${
        item.hash}&album_id=${item.album_id}`,
      img_url: '',
      url: `${prefix}${item.hash}`,
      lyric_url: item.hash,
    };
    // Fix song info
    return axios.get(target_url, {
      headers: {
        ...commonHeaders,
      }
    }).then(async (response) => {
      const { data } = response;
      track.title = data.songName;
      track.artist = data.singerId === 0
        ? '未知' : data.singerName;
      track.artist_id = `${prefix}${data.singerId}`;
      if (data.imgUrl !== undefined) {
        track.img_url = data.imgUrl.replace('{size}', '400');
      }
      // Fix album
      target_url = `http://mobilecdnbj.kugou.com/api/v3/album/info?albumid=${
        item.album_id}`;
      await axios.get(target_url, {
        headers: {
          ...commonHeaders,
        },
      }).then((res) => {
        const { data: res_data } = res;
        if (res_data.status && res_data.data !== undefined) {
          track.album = res_data.data.albumname;
        } else {
          track.album = '';
        }
      });
      return track;
    });
  }

  function kg_get_playlist(playListId = '') { // eslint-disable-line no-unused-vars
    playListId = playListId.replace(prefix, '');
    const target_url = `http://m.kugou.com/plist/list/${playListId}?json=true`;

    return axios.get(target_url, {
      headers: {
        ...commonHeaders,
      },
    }).then(async (response) => {
      const { data } = response;

      console.log(data);

      const info = {
        cover_img_url: data.info.list.imgurl
          ? data.info.list.imgurl.replace('{size}', '400') : '',
        title: data.info.list.specialname,
        id: `kgplaylist_${data.info.list.specialid}`,
        source_url: 'http://www.kugou.com/yy/special/single/{size}.html'
          .replace('{size}', data.info.list.specialid),
      };


      const list = data.list.list.info || {};

      const tracks = await Promise.all(list.map((item) => {
        return kg_render_playlist_result_item(item);
      }));

      return {
        info,
        tracks,
      };

      // async_process_list(data.list.list.info, kg_render_playlist_result_item, [hm],
      //   (err, tracks) => fn({
      //     tracks,
      //     info,
      //   }));
    });
  }

  function kg_render_artist_result_item(item, info) {
    const track = {
      id: `${prefix}${item.hash}`,
      title: '',
      artist: '',
      artist_id: info.id,
      album: '',
      album_id: `${prefix}${item.album_id}`,
      source: 'kugou',
      source_url: `http://www.kugou.com/song/#hash=${
        item.hash}&album_id=${item.album_id}`,
      img_url: '',
      url: `${prefix}${item.hash}`,
      lyric_url: item.hash,
    };
    const one = item.filename.split('-');
    track.title = one[1].trim();
    track.artist = one[0].trim();
    // Fix album name and img
    const target_url = `${'http://www.kugou.com/yy/index.php?'
            + 'r=play/getdata&hash='}${item.hash}`;
    return axios({
      url: `http://mobilecdnbj.kugou.com/api/v3/album/info?albumid=${item.album_id}`,
      method: 'GET',
      headers: {
        ...commonHeaders,
      },
    }).then((response) => {
      const { data } = response;
      if (data.status && data.data !== undefined) {
        track.album = data.data.albumname;
      } else {
        track.album = '';
      }
      return axios({
        url: target_url,
        method: 'GET',
        headers: {
          ...commonHeaders,
        },
      }).then((res) => {
        const res_data = res.data;
        track.img_url = res_data.data.img;
        return track;
      });
    });
  }

  function kg_artist(artistId = '') { // eslint-disable-line no-unused-vars
    artistId = artistId.replace(prefix, '');
    let target_url = `http://mobilecdnbj.kugou.com/api/v3/singer/info?singerid=${artistId}`;
    return axios({
      url: target_url,
      method: 'GET',
      headers: {
        ...commonHeaders,
      }
    }).then((response) => {
      const { data } = response;
      const info = {
        cover_img_url: data.data.imgurl.replace('{size}', '400'),
        title: data.data.singername,
        id: `${prefix}${artistId}`,
        source_url: 'http://www.kugou.com/singer/{id}.html'.replace('{id}', artistId),
      };
      target_url = `http://mobilecdnbj.kugou.com/api/v3/singer/song?singerid=${
        artistId}&page=1&pagesize=30`;
      return axios({
        url: target_url,
        method: 'GET',
        headers: {
          ...commonHeaders,
        }
      }).then(async (res) => {
        const { data: res_data } = res;
        const list = res_data.data.info;
        const tracks = await Promise.all(
          list.map((item) => {
            return kg_render_artist_result_item(item, info);
          })
        );
        return {
          tracks,
          info,
        };
      });
    });
  }

  function getTimestampString() {
    return (new Date()).getTime().toString();
  }

  function getRandomIntString() {
    return (Math.random() * 100).toString().replace(/\D/g, '');
  }

  // eslint-disable-next-line no-unused-vars
  function kg_bootstrap_track(trackId = '') {
    trackId = trackId.replace(prefix, '');
    let target_url = 'https://wwwapi.kugou.com/yy/index.php?r=play/getdata';
    const jQueryHeader = `jQuery1910${getRandomIntString()}_${getTimestampString()}`;

    target_url = `${target_url}&callback=${jQueryHeader}&hash=${trackId}&_=${getTimestampString()}`;

    return axios({
      url: target_url,
      method: 'GET',
      headers: {
        ...commonHeaders,
      }
    }).then((response) => {
      let data = response.data.slice(jQueryHeader.length + 1, response.data.length - 2);
      data = JSON.parse(data);
      if (data.status === 1) {
        return data.data.play_url; // eslint-disable-line no-param-reassign
      }
      return '';
    });
  }

  function kg_lyric(trackId = '') { // eslint-disable-line no-unused-vars
    trackId = trackId.replace(prefix, '');
    const lyric_url = `http://www.kugou.com/yy/index.php?r=play/getdata&hash=${
      trackId}`;
    return axios({
      url: lyric_url,
      method: 'GET',
      headers: {
        ...commonHeaders,
      }
    }).then((response) => {
      const { data } = response;
      return {
        lyric: data.data.lyrics,
      };
    });
  }

  function kg_render_album_result_item(item, album, albumId) {
    const track = {
      id: `kgtrack_${item.hash}`,
      title: '',
      artist: '',
      artist_id: '',
      album,
      album_id: `${prefix}${albumId}`,
      source: 'kugou',
      source_url: `http://www.kugou.com/song/#hash=${
        item.hash}&album_id=${albumId}`,
      img_url: '',
      url: `${prefix}${item.hash}`,
      lyric_url: item.hash,
    };
    // Fix other data
    const target_url = `${'http://m.kugou.com/app/i/getSongInfo.php?'
            + 'cmd=playInfo&hash='}${item.hash}`;
    return axios({
      url: target_url,
      method: 'GET',
      headers: {
        ...commonHeaders,
      }
    }).then((response) => {
      const { data } = response;
      track.title = data.songName;
      track.artist = data.singerId === 0
        ? '未知' : data.singerName;
      track.artist_id = `${prefix}${data.singerId}`;
      track.img_url = data.imgUrl.replace('{size}', '400');
      return track;
    });
  }

  function kg_album(albumId = '') { // eslint-disable-line no-unused-vars
    albumId = albumId.replace(prefix, '');
    let target_url = `${'http://mobilecdnbj.kugou.com/api/v3/album/info?'
          + 'albumid='}${albumId}`;

    let info;
    // info
    return axios({
      url: target_url,
      method: 'GET',
      headers: {
        ...commonHeaders,
      }
    }).then((response) => {
      const { data } = response;

      info = {
        cover_img_url: data.data.imgurl.replace('{size}', '400'),
        title: data.data.albumname,
        id: `kgalbum_${data.data.albumid}`,
        source_url: 'http://www.kugou.com/album/{id}.html'
          .replace('{id}', data.data.albumid),
      };

      target_url = `${'http://mobilecdnbj.kugou.com/api/v3/album/song?'
            + 'albumid='}${albumId}&page=1&pagesize=-1`;
      return axios({
        url: target_url,
        method: 'GET',
        transformResponse: undefined,
      }).then(async (res) => {
        let res_data = res.data;
        res_data = JSON.parse(res_data);

        const list = res_data.data.info;

        const tracks = await Promise.all(
          list.map((item) => {
            return kg_render_album_result_item(item, data.data.albumname, albumId);
          })
        );

        return {
          tracks,
          info,
        };
      });
    });
  }

  function kg_show_playlist(offset = 0) {
    // const page = offset / 30 + 1;
    const target_url = `${'http://m.kugou.com/plist/index'
            + '?json=true&page='}${offset}`;
    return axios.get(target_url, {
      headers: {
        ...commonHeaders,
      },
    }).then((response) => {
      const { data } = response;
      console.log(response);
      // const total = data.plist.total;
      const result = data.plist.list.info.map(item => ({
        cover_img_url: item.imgurl ? item.imgurl.replace('{size}', '400') : '',
        title: item.specialname,
        id: `${prefix}${item.specialid}`,
        source_url: 'http://www.kugou.com/yy/special/single/{size}.html'.replace('{size}', item.specialid),
      }));
      return result;
    });
  }

  function kg_parse_url(url) {
    let result;
    const match = /\/\/www.kugou.com\/yy\/special\/single\/([0-9]+).html/.exec(url);
    if (match != null) {
      const playlist_id = match[1];
      result = {
        type: 'playlist',
        id: `kgplaylist_${playlist_id}`,
      };
    }
    return result;
  }

  function get_playlist(url, hm, se) { // eslint-disable-line no-unused-vars
    const list_id = getParameterByName('list_id', url).split('_')[0];
    switch (list_id) {
      case 'kgplaylist':
        return kg_get_playlist(url, hm, se);
      case 'kgalbum':
        return kg_album(url, hm, se);
      case 'kgartist':
        return kg_artist(url, hm, se);
      default:
        return null;
    }
  }

  return {
    show_playlist: kg_show_playlist,
    get_playlist: kg_get_playlist,
    parse_url: kg_parse_url,
    bootstrap_track: kg_bootstrap_track,
    search: kg_search,
    lyric: kg_lyric,
    get_album: kg_album,
    get_artist: kg_artist,
  };
}

module.exports = build_kugou(); // eslint-disable-line no-unused-vars
