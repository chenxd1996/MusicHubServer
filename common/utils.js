exports.json2FormUrlEncoded = function (json) {
  return Object.keys(json).map((key) => {
    let value = json[key];
    if (typeof value === 'object') {
      value = JSON.stringify(value);
    }
    return `${encodeURIComponent(key)}=${encodeURIComponent(value)}`;
  }).join('&');
};


exports.parseLyric = function (lyric = '') {
  lyric = lyric.replace(/\n/g, '');
  const timeRegx = /\[(\d+:[\d.]+)\]/g;
  const timeStrs = [];
  let result = timeRegx.exec(lyric);
  while (result) {
    timeStrs.push(result[1]);
    result = timeRegx.exec(lyric);
  }
  const timesArr = timeStrs.map((time = '') => {
    const [minutes = 0, seconds = 0] = time.split(':');
    return Number.parseFloat(minutes) * 60 + Number.parseFloat(seconds);
  });
  const lyricArr = lyric.replace(/\[(\d+:[\d.]+)\]/g, '$#')
    .split('$#').filter((item) => {
      return item !== '';
    });
  return lyricArr.map((text, index) => {
    return {
      text,
      startTime: timesArr[index],
      endTime: timesArr[index + 1],
    };
  });
};
