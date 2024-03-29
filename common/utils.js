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
  // 去掉换行符，把相连的时间替换为后一个的时间
  lyric = lyric.replace(/\n/g, '').replace(/\[\d+:[\d.]+\](\[\d+:[\d.]+\])/g, (match, p) => {
    return p;
  }).replace(/\[\D*:\S*(?=\[)/g, '');
  const timeRegx = /\[(\d+:[\d.]+)(:\d+)?\]/g;
  const timeStrs = [];
  let result = timeRegx.exec(lyric);
  while (result) {
    timeStrs.push(result[1]);
    result = timeRegx.exec(lyric);
  }
  const timesArr = timeStrs.map((time = '') => {
    const [first = 0, second = 0, third = 0] = time.split(':');
    return Number.parseFloat(first) * 60 + Number.parseFloat(second) + Number.parseFloat(third) / 60;
  });
  const lyricArr = lyric.replace(timeRegx, '$#')
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
