const baseController = require('controllers/base.js');
const yapi = require('yapi.js');
const syncModel = require('../syncModel.js');
const projectModel = require('models/project.js');
const interfaceSyncUtils = require('../interfaceSyncUtils.js')

class syncController extends baseController {
  constructor(ctx) {
    super(ctx);
    this.syncModel = yapi.getInst(syncModel);
    this.projectModel = yapi.getInst(projectModel);
    this.interfaceSyncUtils = yapi.getInst(interfaceSyncUtils);
  }

  /**
   * 保存定时任务
   * @param {*} ctx 
   */
  async upSync(ctx) {
    let requestBody = ctx.request.body;
    let projectId = requestBody.project_id;
    if (!projectId) {
      return (ctx.body = yapi.commons.resReturn(null, 408, '缺少项目Id'));
    }

    if ((await this.checkAuth(projectId, 'project', 'edit')) !== true) {
      return (ctx.body = yapi.commons.resReturn(null, 405, '没有权限'));
    }

    let result;
    if (requestBody.id) {
      result = await this.syncModel.up(requestBody);
    } else {
      result = await this.syncModel.save(requestBody);
    }

    //操作定时任务
    if (requestBody.is_sync_open) {
      this.interfaceSyncUtils.addSyncJob(projectId, requestBody.sync_cat_id, requestBody.sync_cron, requestBody.sync_json_url, requestBody.sync_mode, requestBody.uid);
    } else {
      this.interfaceSyncUtils.deleteSyncJob(projectId);
    }
    return (ctx.body = yapi.commons.resReturn(result));
  }

  /**
   * 查询定时任务
   * @param {*} ctx 
   */
  async getSync(ctx) {
    let projectId = ctx.query.project_id;
    if (!projectId) {
      return (ctx.body = yapi.commons.resReturn(null, 408, '缺少项目Id'));
    }
    let result = await this.syncModel.getByProjectId(projectId);
    console.log('定时任务：', result)
    return (ctx.body = yapi.commons.resReturn(result));
  }

  /**
   * 删除定时任务
   * @param {*} ctx
   */
  async delSync(ctx) {
    let id = ctx.query.id;
    if (!id) {
      return (ctx.body = yapi.commons.resReturn(null, 408, '要删除的同步方案已不存在'));
    }
    let result = await this.syncModel.del(id);
    console.log('删除定时任务：', result)
    return (ctx.body = yapi.commons.resReturn(result));
  }

}


module.exports = syncController;