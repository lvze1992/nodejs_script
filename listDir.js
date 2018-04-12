const fs = require('fs-extra');

const path = require('path');

const base = 'src/cards';
const matchs = {
  name: /^((?!example).)*config.js((?!example).)*$/, //path
  code: /^((?!cardParam).)*\/imports((?!cardParam).)*$/, //code包含
};
const deleteBase = 'src/entry';
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
  // 必须这么做 不然文件会查不全  似乎是并发导致的
  name.lastIndex = 0;
  code.lastIndex = 0;
  // const filename = filepath.split(path.sep).pop();
  const lines = fs
    .readFileSync(filepath, 'utf8')
    .split('\n')
    .join('###');
  if (name && !name.exec(filepath)) {
    return false;
  }
  if (code && !code.exec(lines)) {
    return false;
  }
  return true;
}
function replace(path, targets, arrows) {
  let lines = fs
    .readFileSync(path, 'utf8')
    .split('\n')
    .join('###');
  targets.forEach((target, idx) => {
    lines = lines.replace(target, arrows[idx]);
  });
  const r = lines.split('###');
  fs.writeFileSync(path, r.join('\n'));
}
function deleteFolder(path, boolean) {
  fs.removeSync(path);
  boolean && fs.mkdirsSync(path);
}
function writeFile(path, content) {
  fs.writeFileSync(path, content, 'utf8');
}
const handle = () => {
  deleteFolder(deleteBase, true); //删除entry目录
  const files = findFile(base, matchs); //所有的configs
  // writeFile('framework/scripts/list.js', files.join('\n'));
  // console.log(files);
  // return;
  files.forEach((i) => {
    console.log(i);
    const exist = /const name = '([^']+)'/.exec(fs.readFileSync(i));
    const filename = exist[1];
    const content = `export { default } from '${i
      .replace('src/', '../')
      .replace('.js', '')}';`;
    writeFile(`src/entry/${filename}.js`, content);
  });
};
const handle2 = () => {
  const files = findFile(base, matchs); //所有的configs
  files.forEach((file) => {
    console.log(file);
    replace(
      file,
      [
        /(const param .*?);/,
        /noData:.*handler.*=>\s(.*)\(\)\.exec.*?},/,
        /isNoData:.*?},/,
      ],
      [
        "$1;###const cardParam = {###      type: ['investedProduct', 'name','kkkkkkk'],###      idSelector: 'accountId',###    };",
        '      noData: (settings, options) => {###        const { params, canConfig } = settings;###        const { type } = params;###        const typeSame = (type && cardParam.type.includes(type)) || !type;###        if (!typeSame) {###          return <CardNoData typeError={!typeSame} />;###        }###        return (###          <CardNoData###            handler={() => $1().exec(settings, options)}###          />###        );###      },',
        '      isNoData: (settings, options) => {###        const { params, canConfig } = settings;###        const { onToggleState } = options;###        const { type } = params;###        const typeSame = (type && cardParam.type.includes(type)) || !type;###        const withConfig =###          _.isEmpty(param) ||###          _.some(param.map(({ id }) => !_.isEmpty(params[id])), Boolean);###        return (canConfig && !withConfig) || (canConfig && !typeSame);###      },',
      ]
    );
  });
};
handle2();
