const fs = require('fs');
const path = require('path');

const base = 'src/cards/+InvestBrain';
const matchs = {
  name: /config.js/,
  code: /EventsTimeDistribution/g,
};
const findFile = (base, matchs) => {
  // 层级遍历
  let r = [];
  const baseFiles = fs.readdirSync(base);
  baseFiles.forEach((file) => {
    const fullpath = path.join(base, file);
    const target = { filepath: fullpath };
    const state = fs.lstatSync(fullpath);
    let tmp = [];
    if (state.isDirectory()) {
      tmp = findFile(fullpath, matchs);
    } else if (state.isFile() && match(target, matchs)) {
      tmp = tmp.concat(fullpath);
    }
    r = [...r, ...tmp];
  });
  return r;
};
function match({ filepath }, { name, code }) {
  const filename = filepath.split(path.sep).pop();
  const lines = fs.readFileSync(filepath, 'utf8');
  const result = !!name.exec(filename) && !!code.exec(lines);
  name.lastIndex = 0;
  code.lastIndex = 0;
  return result;
}

const handle = () => {
  const files = findFile(base, matchs);
  console.log(files);
};
handle();
