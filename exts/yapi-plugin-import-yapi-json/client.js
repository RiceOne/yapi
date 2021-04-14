import { message } from 'antd';

function importData(importDataModule) {
  async function run(res) {
    try {
      let interfaceData = { apis: [], cats: [] };
      res = JSON.parse(res);
      res.forEach(item => {
        interfaceData.cats.push({
          ...item
        });
      });
      interfaceData.apis = [].concat(getAllInterface(res));
      return interfaceData;
    } catch (e) {
      console.error(e);
      message.error('数据格式有误');
    }
  }

  if (!importDataModule || typeof importDataModule !== 'object') {
    console.error('importDataModule 参数Must be Object Type');
    return null;
  }

  importDataModule.json = {
    name: 'Json',
    run: run,
    desc: 'YApi接口 Json数据导入'
  };
}

function getAllInterface(treeData){
  let apis = []
  treeData.forEach(item => {
    if(item.list){
      apis = apis.concat(item.list)
      item.list.forEach(api => {
        api.catname = item.name;
      });
    }
    if(item.children){
      apis = apis.concat(getAllInterface(item.children))
    }
  })
  return apis
}

module.exports = function() {
  this.bindHook('import_data', importData);
};
