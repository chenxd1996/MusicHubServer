const crypto = require('crypto');
const aesjs = require('aes-js');
const { JSDOM } = require('jsdom');
const btoa = require('btoa');
const atob = require('atob');
const encoding = require('text-encoding');
const axios = require('../common/axios');
const { prefixs } = require('../common/const');
const { json2FormUrlEncoded } = require('../common/utils');

const prefix = prefixs.XIAMI;

function MD5(rawStr = '') {
  const md5 = crypto.createHash('md5');
  return md5.update(rawStr).digest('hex');
}

/* global chrome */
/* global MD5 getParameterByName parseInt */
/* eslint-disable no-param-reassign */
function build_xiami() {
  function caesar(location) {
    const num = location[0];
    const avg_len = Math.floor(location.slice(1).length / num);
    const remainder = location.slice(1).length % num;

    const result = [];
    for (let i = 0; i < remainder; i += 1) {
      const line = location.slice(i * (avg_len + 1) + 1, (i + 1) * (avg_len + 1) + 1);
      result.push(line);
    }

    for (let i = 0; i < num - remainder; i += 1) {
      const line = location.slice((avg_len + 1) * remainder)
        .slice(i * avg_len + 1, (i + 1) * avg_len + 1);
      result.push(line);
    }

    const s = [];
    for (let i = 0; i < avg_len; i += 1) {
      for (let j = 0; j < num; j += 1) {
        s.push(result[j][i]);
      }
    }

    for (let i = 0; i < remainder; i += 1) {
      s.push(result[i].slice(-1));
    }

    return unescape(s.join('')).replace(/\^/g, '0');
  }

  function handleProtocolRelativeUrl(url) {
    const regex = /^.*?\/\//;
    const result = url.replace(regex, 'http://');
    return result;
  }

  function xm_retina_url(s) {
    if (s.slice(-6, -4) === '_1') {
      return s.slice(0, -6) + s.slice(-4);
    }
    return s;
  }

  function xm_get_token(headers) {
    const cookies = headers['set-cookie'];
    const cookie = cookies[1] || '';
    return cookie.replace('xm_sg_tk=', '');
  }

  function xm_get_api_url(api, params, token) {
    const params_string = JSON.stringify(params);
    const origin = `${token.split('_')[0]}_xmMain_${api}_${params_string}`;
    const sign = MD5(origin);
    const baseUrl = api.indexOf('http') === 0 ? '' : 'https://www.xiami.com';
    return encodeURI(`${baseUrl + api}?_q=${params_string}&_s=${sign}`);
  }

  async function xm_cookie_get(api, params) {
    const url = xm_get_api_url('/api/song/getPlayInfo', params, '');
    return axios.get(url).then((response) => {
      const token = xm_get_token(response.headers);
      const url2 = xm_get_api_url(api, params, token);
      return axios.get(url2, {
        headers: {
          Cookie: response.headers['set-cookie'],
        }
      }).then((res) => {
        return res;
      });
    });
  }

  function xm_get_low_quality_img_url(url) {
    return `${url}?x-oss-process=image/resize,m_fill,limit_0,s_330/quality,q_80`;
  }

  async function xm_show_playlist(offset = 0) {
    const page = offset / 30 + 1;
    const pageSize = 60;

    const api = '/api/list/collect';
    const params = {
      pagingVO: {
        page,
        pageSize,
      },
      dataType: 'system',
    };
    const response = await xm_cookie_get(api, params);
    const result = response.data.result.data.collects.map((d) => {
      const default_playlist = {
        cover_img_url: '',
        title: '',
        id: '',
        source_url: '',
      };
      default_playlist.cover_img_url = xm_get_low_quality_img_url(d.collectLogo);
      default_playlist.title = d.collectName;
      const list_id = d.listId;
      default_playlist.id = `${prefix}${list_id}`;
      default_playlist.source_url = `http://www.xiami.com/collect/${list_id}`;
      return default_playlist;
    });
    return result;
  }

  // eslint-disable-next-line no-unused-vars
  function xm_bootstrap_track(trackId = '') {
    trackId = trackId.replace(prefix, '');
    // const target_url = `http://www.xiami.com/song/playlist/id/${trackId.slice('xmtrack_'.length)
    // }/object_name/default/object_id/0/cat/json`;
    const target_url = '/api/song/getPlayInfo';
    return xm_cookie_get(target_url, {
      songIds: [trackId],
    }).then((response) => {
      const { data } = response;
      const { playInfos = [] } = data.result.data.songPlayInfos[0] || {};
      if (!playInfos.length) {
        return '';
      }
      const playInfo = playInfos[playInfos.length - 1];
      // console.log(data);

      // const { location } = data.data.trackList[0];
      // eslint-disable-next-line
      const url = playInfo.listenFile;
      // song.url = handleProtocolRelativeUrl(caesar(location));
      // song.img_url = xm_retina_url(handleProtocolRelativeUrl(data.data.trackList[0].pic));
      // song.album = data.data.trackList[0].album_name;
      // song.album_id = `${prefix}${data.data.trackList[0].album_id}`;
      // song.lyric_url = handleProtocolRelativeUrl(data.data.trackList[0].lyric_url);
      return url;
    });
  }

  function xm_convert_song(song_info, artist_field_name) {
    const track = {
      id: `${prefix}${song_info.song_id}`,
      title: song_info.song_name,
      artist: song_info[artist_field_name],
      artist_id: `${prefix}${song_info.artist_id}`,
      album: song_info.album_name,
      album_id: `${prefix}${song_info.album_id}`,
      source: 'xiami',
      source_url: `http://www.xiami.com/song/${song_info.song_id}`,
      img_url: song_info.album_logo,
      url: `${prefix}${song_info.song_id}`,
      lyric_url: song_info.lyric_file,
    };
    return track;
  }

  function xm_convert_song2(song_info, artist_field_name) { // eslint-disable-line no-unused-vars
    const track = {
      id: `${prefix}${song_info.songId}`,
      title: song_info.songName,
      artist: song_info.artistName,
      artist_id: `${prefix}${song_info.artistId}`,
      album: song_info.albumName,
      album_id: `${prefix}${song_info.albumId}`,
      source: 'xiami',
      source_url: `http://www.xiami.com/song/${song_info.songId}`,
      img_url: song_info.albumLogo,
      url: `${prefix}${song_info.songId}`,
      // 'lyric_url': song_info.lyricInfo.lyricFile
    };
    if (song_info.lyricInfo) {
      track.lyric_url = song_info.lyricInfo.lyricFile;
    }
    return track;
  }

  async function xm_get_playlist(playlistId = '') { // eslint-disable-line no-unused-vars
    playlistId = playlistId.replace(prefix, '');
    const api = '/api/collect/initialize';
    const params = {
      listId: parseInt(playlistId, 10),
    };
    const response = await xm_cookie_get(api, params);
    const collect = response.data.result.data.collectDetail;
    const info = {
      cover_img_url: xm_get_low_quality_img_url(collect.collectLogo),
      title: collect.collectName,
      id: `${prefix}${playlistId}`,
      source_url: `http://www.xiami.com/collect/${playlistId}`,
    };
    const tracks = response.data.result.data.collectSongs.map(item => xm_convert_song2(item, 'artist_name'));
    return {
      tracks,
      info,
    };
  }

  async function xm_search(keyword, curpage) { // eslint-disable-line no-unused-vars
    // const api = '/api/search/searchSongs';
    // const pageSize = 60;
    // const params = {
    //   pagingVO: {
    //     page: curpage,
    //     pageSize,
    //   },
    //   key: keyword,
    // };
    // const response = await xm_cookie_get(api, params);
    // const tracks = response.data.result.data.songs.map(item => xm_convert_song2(item, 'artistName'));
    // return {
    //   result: tracks,
    //   total: response.data.result.data.pagingVO.pages,
    // };
    // const url = 'http://api.xiami.com/web/search';
    // return axios.get(url, {
    //   params: {
    //     v: '2.0',
    //     key: keyword,
    //     page: curpage,
    //     limit: 60,
    //     r: 'search/songs',
    //     app_key: 1,
    //     callback: 'jsonp217',
    //   }
    // }).then((res) => {
    //   console.log(res.data);
    // });
  }

  function xm_album(albumId) { // eslint-disable-line no-unused-vars
    albumId = albumId.replace(prefix, '');
    const target_url = `http://api.xiami.com/web?v=2.0&app_key=1&id=${albumId
    }&page=1&limit=20&callback=jsonp217&r=album/detail`;
    return axios({
      url: target_url,
      method: 'GET',
      headers: {
        referer: 'http://www.xiami.com',
      }
    })
      .then((response) => {
        let { data } = response;
        data = data.slice('jsonp217('.length, -')'.length);
        data = JSON.parse(data);

        const info = {
          cover_img_url: data.data.album_logo,
          title: data.data.album_name,
          id: `${prefix}${data.data.album_id}`,
          source_url: `http://www.xiami.com/album/${data.data.album_id}`,
        };

        const tracks = data.data.songs.map(item => xm_convert_song(item, 'singers'));
        return {
          tracks,
          info,
        };
      });
  }

  function xm_artist(artistId = '') { // eslint-disable-line no-unused-vars
    artistId = artistId.replace(prefix, '');
    let target_url = `http://api.xiami.com/web?v=2.0&app_key=1&id=${artistId
    }&page=1&limit=20&_ksTS=1459931285956_216`
          + '&callback=jsonp217&r=artist/detail';

    return axios({
      url: target_url,
      method: 'GET',
      headers: {
        referer: 'http://www.xiami.com',
      }
    })
      .then((response) => {
        let { data } = response;
        data = data.slice('jsonp217('.length, -')'.length);
        data = JSON.parse(data);

        const info = {
          cover_img_url: xm_retina_url(data.data.logo),
          title: data.data.artist_name,
          id: `${prefix}${artistId}`,
          source_url: `http://www.xiami.com/artist/${artistId}`,
        };

        target_url = `http://api.xiami.com/web?v=2.0&app_key=1&id=${artistId
        }&page=1&limit=20&callback=jsonp217&r=artist/hot-songs`;
        return axios({
          url: target_url,
          method: 'GET',
          headers: {
            referer: 'http://www.xiami.com',
          }
        })
          .then((res) => {
            let { data: res_data } = res;
            res_data = res_data.slice('jsonp217('.length, -')'.length);
            res_data = JSON.parse(res_data);

            const tracks = res_data.data.map((item) => {
              const track = xm_convert_song(item, 'singers');
              track.artist_id = `${prefix}${artistId}`;
              return track;
            });
            return {
              tracks,
              info,
            };
          });
      });
  }

  async function xm_lyric(trackId = '') { // eslint-disable-line no-unused-vars
    trackId = trackId.replace(prefix, '');
    const target_url = '/api/lyric/getSongLyrics';

    return xm_cookie_get(target_url, {
      songId: trackId,
    }).then((response) => {
      const { data } = response;
      const { lyrics = [] } = data.result.data || {};
      if (!lyrics.length) {
        return '';
      }
      const lyric = lyrics[0];
      // console.log(data);

      // const { location } = data.data.trackList[0];
      // eslint-disable-next-line
      // song.url = handleProtocolRelativeUrl(caesar(location));
      // song.img_url = xm_retina_url(handleProtocolRelativeUrl(data.data.trackList[0].pic));
      // song.album = data.data.trackList[0].album_name;
      // song.album_id = `${prefix}${data.data.trackList[0].album_id}`;
      // song.lyric_url = handleProtocolRelativeUrl(data.data.trackList[0].lyric_url);
      return {
        lyric: lyric.content,
      };
    });
  }

  function xm_parse_url(url) {
    let result;
    const match = /\/\/www.xiami.com\/collect\/([0-9]+)/.exec(url);
    if (match != null) {
      const playlist_id = match[1];
      result = {
        type: 'playlist',
        id: `xmplaylist_${playlist_id}`,
      };
    }
    return result;
  }

  function get_playlist(url, hm, se) {
    const list_id = getParameterByName('list_id', url).split('_')[0];
    switch (list_id) {
      case 'xmplaylist':
        return xm_get_playlist(url, hm, se);
      case 'xmalbum':
        return xm_album(url, hm, se);
      case 'xmartist':
        return xm_artist(url, hm, se);
      default:
        return null;
    }
  }
  return {
    show_playlist: xm_show_playlist,
    get_playlist: xm_get_playlist,
    parse_url: xm_parse_url,
    bootstrap_track: xm_bootstrap_track,
    search: xm_search,
    lyric: xm_lyric,
    get_album: xm_album,
    get_artist: xm_artist,
  };
}

module.exports = build_xiami(); // eslint-disable-line no-unused-vars
