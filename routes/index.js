const router = require('koa-router')();
const playList = require('../controllers/playList');
const search = require('../controllers/search');
const song = require('../controllers/song');

router.get('/play_list/', playList.getAllPlayLists);
router.post('/play_list/', playList.getAllPlayLists);

router.get('/play_list/:playListId', playList.getPlayListDetail);
router.post('/play_list/:playListId', playList.getPlayListDetail);

router.get('/search', search.search);
router.post('/search', search.search);

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
