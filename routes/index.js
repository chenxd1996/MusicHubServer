const router = require('koa-router')();
const playList = require('../controllers/playList');
const search = require('../controllers/search');
const song = require('../controllers/song');

router.get('/:prefix/play_list/', playList.getAllPlayLists);
router.post('/:prefix/play_list/', playList.getAllPlayLists);

router.get('/play_list/:playListId', playList.getPlayListDetail);
router.post('/play_list/:playListId', playList.getPlayListDetail);

router.get('/artist/:artistId', playList.getArtist);
router.post('/artist/:artistId', playList.getArtist);

router.get('/album/:albumId', playList.getAlbum);
router.post('/album/:albumId', playList.getAlbum);

router.get('/:prefix/search', search.search);
router.post('/:prefix/search', search.search);

router.get('/lyric/:trackId', song.getLyric);
router.post('/lyric/:trackId', song.getLyric);

router.get('/song/:trackId', song.getSong);
router.post('/song/:trackId', song.getSong);

// router.get('/:play_list', async (ctx) => {
//   ctx.body = 'koa2 string';
// });

// router.get('/json', async (ctx) => {
//   ctx.body = {
//     title: 'koa2 json'
//   };
// });

module.exports = router;
