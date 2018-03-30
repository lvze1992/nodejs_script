// please use:
// node src/report-config-set [d | s | d s] [--prefix]
// example:
// node src/report-config-set d s --https://gw.datayes-stg.com/usermaster/card/preference'

const arguments = process.argv.splice(2);
const { configs: _configsObj } = require('./report-config');
const axios = require('axios');

let prefix = 'https://gw.datayes-stg.com/usermaster/card/preference';
let prefixC = arguments.filter(i => i.includes('--'));
prefix = (prefixC.length && prefixC[0].slice(2)) || prefix;
console.log(`prefix =>  \x1b[33m ${prefix} \x1b[0m`);
const save = type => (
  {
    id,
    uid,
    key = uid || id,
    name,
    cards,
    version,
    config,
    layouts,
    dashboards,
    deleteCards,
    deleteDashboards,
    level = 'user'
  },
  cmt
) => {
  const url =
    level === 'user'
      ? `${prefix}/${type}/${key}.json`
      : `${prefix}/admin/${level}/${type}/${key}.json`;
  const data = {
    name,
    cards,
    version,
    config,
    layouts,
    dashboards,
    deleteCards,
    deleteDashboards
  };
  Object.keys(data).forEach(k => data[k] === undefined && delete data[k]);
  return axios(url, {
    baseURL: '',
    method: 'PUT',
    withCredentials: true,
    data,
    headers: {
      'Content-Type': 'application/json'
    }
  }).then(res => {
    const { message } = res.data;
    console.log(`${cmt}  \x1b[33m ${message} \x1b[0m`);
    return res.data;
  });
};
const del = type => (key, level = 'user', cmt) => {
  const url =
    level === 'user'
      ? `${prefix}/${type}/${key}.json`
      : `${prefix}/admin/${level}/${type}/${key}.json`;
  return axios(url, {
    baseURL: true,
    method: 'DELETE',
    withCredentials: true
  }).then(res => {
    const { message } = res.data;
    console.log(`${cmt}  \x1b[33m ${message} \x1b[0m`);
    return res.data;
  });
};
const savePage = save('pages');
const deletePage = del('pages');

const deleteConfig = keys => {
  // deletePage(keys[1]);
  const cmt = `delete config => ${keys[0]}`;
  deletePage(keys[0], 'global', cmt);
  return;
};
const saveConfig = (keys, cardsLayout) => {
  const cmt = `save config => ${keys[0]}`;
  savePage(
    {
      id: keys[0],
      name: `testConfig_${keys[0]}`,
      cards: Object.values(
        cardsLayout.cards
      ).map(({ uid, name, type, key = `${type}`, params, data }) => ({
        key,
        name,
        config: JSON.stringify({ params, data, type })
      })),
      config: JSON.stringify({ group: cardsLayout.group }),
      layouts: JSON.stringify(cardsLayout.layouts),
      level: 'global'
    },
    cmt
  );
  // setTimeout(() => {
  //   getPage(keys[0], { priority: ['global', 'tenant', 'user'] });
  // }, 500);
  return;
};
const setConfig = () => {
  console.log(arguments);
  if (!arguments.length) {
    console.log(
      'please use: node src/report-config-set [d | s | d s] [--prefix]\nexample: node src/report-config-set d s --https://gw.datayes-stg.com/usermaster/card/preference'
    );
    return;
  }
  const interval = (arguments.length && 3000) || 0;
  Object.keys(_configsObj).forEach(key => {
    // key(报告类型) _configsObj[key](配置)
    arguments.includes('d') && deleteConfig([`report_${key}`]);
    arguments.includes('s') &&
      setTimeout(() => {
        saveConfig([`report_${key}`], _configsObj[key]);
      }, interval);
    return;
  });
};
setConfig();
