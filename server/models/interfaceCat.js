const yapi = require('../yapi.js');
const baseModel = require('./base.js');

/**
 * 接口分类
 */
class interfaceCat extends baseModel {
  getName() {
    return 'interface_cat';
  }

  getSchema() {
    return {
      name: { type: String, required: true },
      uid: { type: Number, required: true },
      parent_id: { type: Number, required: true },
      project_id: { type: Number, required: true },
      desc: String,
      add_time: Number,
      up_time: Number,
      index: { type: Number, default: 0 },
      order: { type: Number, min: 1, default: 100 },
      old_id: { type: Number, required: false},
    };
  }

  save(data) {
    let m = new this.model(data);
    return m.save();
  }

  get(id) {
    return this.model
      .findOne({
        _id: id
      })
      .exec();
  }

  listChilden(id) {
    return this.model
        .find({
          parent_id: id
        })
        .exec();
  }

  checkRepeat(name) {
    return this.model.countDocuments({
      name: name
    });
  }

  list(project_id) {
    return this.model
      .find({
        project_id: project_id
      })
      .sort({ order: 1, _id: 1 })
      .exec();
  }

  del(id) {
    return this.model.remove({
      _id: id
    });
  }

  delByProjectId(id) {
    return this.model.remove({
      project_id: id
    });
  }

  up(id, data) {
    data.up_time = yapi.commons.time();
    return this.model.update(
      {
        _id: id
      },
      data
    );
  }

  upCatIndex(id, index) {
    return this.model.update(
      {
        _id: id
      },
      {
        index: index
      }
    );
  }

  rebuildCat(){
    // 查询Json导入的目录（old_id不为空的数据）
    let cats = this.model.find({old_id: {$ne:null}})
    // 遍历，逐一更新parent_id到新_Id, 并清除old_id
    cats.forEach(cat => {
       let parent = this.model.findOne({old_id: cat.parent_id}).exec();
       cat.parent_id = parent._id;
       cat.old_id = null;
       this.model.update({_id: cat._id}, cat)
    })
    return cats;
  }
}

module.exports = interfaceCat;
