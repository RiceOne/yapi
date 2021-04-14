import React, {Component} from 'react';
import {connect} from 'react-redux';
import PropTypes from 'prop-types';
import {buildTree, formatTime} from 'client/common.js';
import {Form, Switch, Button, Icon, Tooltip, message, Input, Select, Layout, Row, Popconfirm, TreeSelect} from 'antd';
import {handleSwaggerUrlData} from 'client/reducer/modules/project';

const FormItem = Form.Item;
const Option = Select.Option;
import axios from 'axios';
import EasyDragSort from "../../../client/components/EasyDragSort/EasyDragSort";
import ProjectEnvContent from "../../../client/containers/Project/Setting/ProjectEnv/ProjectEnvContent";

const {Content, Sider} = Layout;

// layout
const formItemLayout = {
    labelCol: {
        lg: {span: 5},
        xs: {span: 24},
        sm: {span: 10}
    },
    wrapperCol: {
        lg: {span: 16},
        xs: {span: 24},
        sm: {span: 12}
    },
    className: 'form-item'
};
const tailFormItemLayout = {
    wrapperCol: {
        sm: {
            span: 16,
            offset: 11
        }
    }
};

@connect(
    state => {
        return {
            projectMsg: state.project.currProject
        };
    },
    {
        handleSwaggerUrlData
    }
)
@Form.create()
export default class ProjectInterfaceSync extends Component {
    static propTypes = {
        form: PropTypes.object,
        match: PropTypes.object,
        projectId: PropTypes.number,
        projectMsg: PropTypes.object,
        handleSwaggerUrlData: PropTypes.func
    };

    constructor(props) {
        super(props);
        this.state = {
            sync_data: {is_sync_open: false},
            // add
            env: [], // 左侧列表
            _id: null,
            delIcon: null,
            currentKey: -2,
            menuTree: []
        };
    }

    handleSubmit = async () => {
        const {form} = this.props;
        const projectId = this.props.projectMsg._id
        let params = {
            project_id: projectId,
            is_sync_open: this.state.sync_data.is_sync_open,
            uid: this.props.projectMsg.uid
        };
        if (this.state.sync_data._id) {
            params.id = this.state.sync_data._id;
        }
        form.validateFields(async (err, values) => {
            if (!err) {
                console.log('form', values);
                let assignValue = Object.assign(params, values);
                await axios.post('/api/plugin/autoSync/save', assignValue).then(res => {
                    if (res.data.errcode === 0) {
                        message.success('保存成功');
                    } else {
                        message.error(res.data.errmsg);
                    }
                });
                this.getSyncData();
            }
        });
    };

    validSwaggerUrl = async (rule, value, callback) => {
        console.log('同步开关', this.state.sync_data.is_sync_open)
        if (!value) return;
        if (this.state.sync_data && this.state.sync_data.is_sync_open == true) {
            try {
                await this.props.handleSwaggerUrlData(value);
            } catch (e) {
                callback('swagger地址不正确');
            }
        }
        callback()
    }

    componentWillMount() {
        //查询同步任务
        this.setState({
            sync_data: {}
        });
        //默认每份钟同步一次,取一个随机数
        this.setState({
            random_corn: '*/2 * * * *'
        });

        this.getSyncData();
        this.getMenuTree();
    }

    async getSyncData() {
        let projectId = this.props.projectMsg._id;
        let result = await axios.get('/api/plugin/autoSync/get?project_id=' + projectId);
        if (result.data.errcode === 0) {
            if (result.data.data) {
                console.log('sycnData', result.data.data)
                this.setState({
                    //sync_data: result.data.data
                    env: result.data.data
                });
            }
        }
    }

    // 获取菜单树
    async getMenuTree() {
        let projectId = this.props.projectMsg._id;
        let menuList = []
        await axios.get(`/api/interface/getCatMenu?project_id=${projectId}`).then(data => {
            if (data.data.errcode === 0) {
                menuList = data.data.data;
            }
        });
        // 菜单树
        if (menuList) {
            let _menuList = [{_id: 0, label: '全部接口', title: '全部接口', value: '0'}];
            menuList.map((item, key) => {
                _menuList.push({
                    ...item,
                    label: item.name,
                    title: item.name,
                    value: item._id + "",
                    children: []
                })
            });
            let menuTree = buildTree(_menuList, '_id', 'parent_id');
            this.setState({menuTree});
        }
    }

    async delSyncData(id) {
        let result = await axios.get('/api/plugin/autoSync/del?id=' + id);
        if (result.data.errcode === 0) {
            message.success('删除成功');
            this.getSyncData();
        } else {
            message.error(result.data.errmsg);
        }
    }

    // 是否开启
    onChange = v => {
        let sync_data = this.state.sync_data;
        sync_data.is_sync_open = v;
        this.setState({
            sync_data: sync_data
        });
    };

    sync_cronCheck(rule, value, callback) {
        if (!value) return;
        value = value.trim();
        if (value.split(/ +/).length > 5) {
            callback('不支持秒级别的设置，建议使用 "*/10 * * * *" ,每隔10分钟更新')
        }
        callback()
    }

    /**
     * 适配微服务改造：多套配置
     * */

        // 增加同步方案
    addScheme = (name, data) => {
        let env = this.state.env;
        data = {desc: '新建方案', is_sync_open: false};
        env.unshift(data);
        this.handleClick(0, data);
    };

    // 侧边栏选中
    handleClick = (key, data) => {
        this.props.form.resetFields(); // 更新Form
        this.setState({
            sync_data: data,
            currentKey: key
        });
    };

    // 动态修改环境名称
    handleInputChange = (value, currentKey) => {
        let _env = this.state.env;
        if (!_env[0]._id) {
            _env[0].desc = value || '新建方案';
            this.setState({env: _env});
        }
    };

    enterItem = key => {
        this.setState({delIcon: key});
    };

    // 删除
    delScheme(index, name) {
        let _env = [].concat(this.state.env);
        if (_env[index]._id) {
            this.delSyncData(_env[index]._id);
        } else {
            _env.splice(index, 1);
            this.setState({env: _env});
        }
    }

    render() {

        const {getFieldDecorator} = this.props.form;
        const {env, currentKey, menuTree} = this.state;

        // 左侧列表展示项
        const envSettingItems = env.map((item, index) => {
            let enableState = item.is_sync_open ? 'done' : 'undone';
            return (
                <Row
                    key={index}
                    className={'menu-item ' + (index === currentKey ? 'menu-item-checked' : '')}
                    onClick={() => this.handleClick(index, item)}
                    onMouseEnter={() => this.enterItem(index)}
                >
          <span className="env-icon-style">
            <span className={"env-name tag-status " + enableState} style={{color: item.desc === '新建方案' && '#2395f1'}}>
              {item.desc ? item.desc : '未命名方案'}
            </span>
            <Popconfirm
                title="您确认删除此方案?"
                onConfirm={e => {
                    e.stopPropagation();
                    this.delScheme(index, 'env');
                }}
                okText="确定"
                cancelText="取消"
            >
              <Icon
                  type="delete"
                  className="interface-delete-icon"
                  style={{
                      display: this.state.delIcon == index && env.length - 1 !== 0 ? 'block' : 'none'
                  }}
              />
            </Popconfirm>
          </span>
                </Row>
            );
        });

        return (
            <div className="m-env-panel">
                <Layout className="project-env">
                    <Sider width={195} style={{background: '#fff'}}>
                        <div style={{height: '100%', borderRight: 0}}>
                            <Row className="first-menu-item menu-item">
                                <div className="env-icon-style">
                                    <h3>
                                        同步方案&nbsp;<Tooltip placement="top" title="在这里添加项目的Swagger同步方案">
                                        <Icon type="question-circle-o"/>
                                    </Tooltip>
                                    </h3>
                                    <Tooltip title="添加同步方案">
                                        <Icon type="plus" onClick={() => this.addScheme('scheme')}/>
                                    </Tooltip>
                                </div>
                            </Row>
                            {envSettingItems}
                        </div>
                    </Sider>
                    <Layout className="env-content">
                        <Content style={{background: '#fff', padding: 24, margin: 0, minHeight: 280}}>
                            <div className="m-panel">
                                <Form>
                                    <FormItem {...formItemLayout} label="描述: ">
                                        {getFieldDecorator('desc', {
                                            rules: [],
                                            initialValue: this.state.sync_data.desc ? this.state.sync_data.desc : ''
                                        })(<Input onChange={e => this.handleInputChange(e.target.value)}/>)}
                                    </FormItem>
                                    <FormItem
                                        label="是否开启自动同步"
                                        {...formItemLayout}
                                    >
                                        <Switch
                                            checked={this.state.sync_data.is_sync_open}
                                            onChange={this.onChange}
                                            checkedChildren="开"
                                            unCheckedChildren="关"
                                        />
                                        {this.state.sync_data.last_sync_time != null ? (<div>上次更新时间:<span
                                            className="logtime">{formatTime(this.state.sync_data.last_sync_time)}</span>
                                        </div>) : null}
                                    </FormItem>
                                    <div>
                                        <FormItem {...formItemLayout} label="同步到: ">
                                            {getFieldDecorator('sync_cat_id', {
                                                rules: [
                                                    {
                                                        required: true,
                                                        message: '请选择目录'
                                                    }
                                                ],
                                                initialValue: this.state.sync_data.sync_cat_id ? this.state.sync_data.sync_cat_id + '' : '0'
                                            })(
                                                <TreeSelect
                                                    style={{width: '100%'}}
                                                    dropdownStyle={{maxHeight: 400, overflow: 'auto'}}
                                                    treeData={menuTree}
                                                    placeholder="请选择目录"
                                                    treeDefaultExpandAll={false}
                                                />
                                            )}
                                        </FormItem>
                                        <FormItem {...formItemLayout} label={
                                            <span className="label">
                同步模式&nbsp;
                                                <Tooltip
                                                    title={
                                                        <div>
                                                            <h3 style={{color: 'white'}}>普通模式</h3>
                                                            <p>不导入已存在的接口</p>
                                                            <br/>
                                                            <h3 style={{color: 'white'}}>智能合并</h3>
                                                            <p>
                                                                已存在的接口，将合并返回数据的 response，适用于导入了 swagger
                                                                数据，保留对数据结构的改动
                                                            </p>
                                                            <br/>
                                                            <h3 style={{color: 'white'}}>完全覆盖</h3>
                                                            <p>不保留旧数据，完全使用新数据，适用于接口定义完全交给后端定义</p>
                                                        </div>
                                                    }
                                                >
                  <Icon type="question-circle-o"/>
                </Tooltip>{' '}
              </span>
                                        }>
                                            {getFieldDecorator('sync_mode', {
                                                initialValue: this.state.sync_data.sync_mode,
                                                rules: [
                                                    {
                                                        required: true,
                                                        message: '请选择同步方式!'
                                                    }
                                                ]
                                            })(
                                                <Select>
                                                    <Option value="normal">普通模式</Option>
                                                    <Option value="good">智能合并</Option>
                                                    <Option value="merge">完全覆盖</Option>
                                                </Select>
                                            )}
                                        </FormItem>

                                        <FormItem {...formItemLayout} label="项目的swagger json地址">
                                            {getFieldDecorator('sync_json_url', {
                                                rules: [
                                                    {
                                                        required: true,
                                                        message: '输入swagger地址'
                                                    },
                                                    {
                                                        validator: this.validSwaggerUrl
                                                    }
                                                ],
                                                validateTrigger: 'onBlur',
                                                initialValue: this.state.sync_data.sync_json_url
                                            })(<Input/>)}
                                        </FormItem>

                                        <FormItem {...formItemLayout} label={<span>类cron风格表达式(默认10分钟更新一次)&nbsp;
                                            {/* <a href="https://blog.csdn.net/shouldnotappearcalm/article/details/89469047">参考</a>*/}
                                        </span>}>
                                            {getFieldDecorator('sync_cron', {
                                                rules: [
                                                    {
                                                        required: true,
                                                        message: '输入node-schedule的类cron表达式!'
                                                    },
                                                    {
                                                        validator: this.sync_cronCheck
                                                    }
                                                ],
                                                initialValue: this.state.sync_data.sync_cron ? this.state.sync_data.sync_cron : this.state.random_corn
                                            })(<Input/>)}
                                        </FormItem>
                                    </div>
                                    <FormItem {...tailFormItemLayout}>
                                        <Button type="primary" htmlType="submit" icon="save" size="large"
                                                onClick={this.handleSubmit}>
                                            保存
                                        </Button>
                                    </FormItem>
                                </Form>
                            </div>
                        </Content>
                    </Layout>
                </Layout>
            </div>
            /*  <div className="m-panel">
                <Form>
                  <FormItem
                    label="是否开启自动同步"
                    {...formItemLayout}
                  >
                    <Switch
                      checked={this.state.sync_data.is_sync_open}
                      onChange={this.onChange}
                      checkedChildren="开"
                      unCheckedChildren="关"
                    />
                    {this.state.sync_data.last_sync_time != null ? (<div>上次更新时间:<span className="logtime">{formatTime(this.state.sync_data.last_sync_time)}</span></div>) : null}
                  </FormItem>
                  <div>
                    <FormItem {...formItemLayout} label="同步到: ">
                      {getFieldDecorator('sync_cat_id', {
                        rules: [
                          {
                            required: true,
                            message: '请输入目录'
                          }
                        ],
                        initialValue: this.state.sync_data.sync_cat_id ? this.state.sync_data.sync_cat_id : ''
                      })(<Input />)}
                    </FormItem>
                    <FormItem {...formItemLayout} label={
                      <span className="label">
                        同步模式&nbsp;
                        <Tooltip
                          title={
                            <div>
                              <h3 style={{ color: 'white' }}>普通模式</h3>
                              <p>不导入已存在的接口</p>
                              <br />
                              <h3 style={{ color: 'white' }}>智能合并</h3>
                              <p>
                                已存在的接口，将合并返回数据的 response，适用于导入了 swagger
                                数据，保留对数据结构的改动
                              </p>
                              <br />
                              <h3 style={{ color: 'white' }}>完全覆盖</h3>
                              <p>不保留旧数据，完全使用新数据，适用于接口定义完全交给后端定义</p>
                            </div>
                          }
                        >
                          <Icon type="question-circle-o" />
                        </Tooltip>{' '}
                      </span>
                    }>
                      {getFieldDecorator('sync_mode', {
                        initialValue: this.state.sync_data.sync_mode,
                        rules: [
                          {
                            required: true,
                            message: '请选择同步方式!'
                          }
                        ]
                      })(

                        <Select>
                          <Option value="normal">普通模式</Option>
                          <Option value="good">智能合并</Option>
                          <Option value="merge">完全覆盖</Option>
                        </Select>
                      )}
                    </FormItem>

                    <FormItem {...formItemLayout} label="项目的swagger json地址">
                      {getFieldDecorator('sync_json_url', {
                        rules: [
                          {
                            required: true,
                            message: '输入swagger地址'
                          },
                          {
                            validator: this.validSwaggerUrl
                          }
                        ],
                        validateTrigger: 'onBlur',
                        initialValue: this.state.sync_data.sync_json_url
                      })(<Input />)}
                    </FormItem>

                    <FormItem {...formItemLayout} label={<span>类cron风格表达式(默认10分钟更新一次)&nbsp;<a href="https://blog.csdn.net/shouldnotappearcalm/article/details/89469047">参考</a></span>}>
                      {getFieldDecorator('sync_cron', {
                        rules: [
                          {
                            required: true,
                            message: '输入node-schedule的类cron表达式!'
                          },
                          {
                            validator: this.sync_cronCheck
                          }
                        ],
                        initialValue: this.state.sync_data.sync_cron ? this.state.sync_data.sync_cron : this.state.random_corn
                      })(<Input />)}
                    </FormItem>
                  </div>
                  <FormItem {...tailFormItemLayout}>
                    <Button type="primary" htmlType="submit" icon="save" size="large" onClick={this.handleSubmit}>
                      保存
                    </Button>
                  </FormItem>
                </Form>
              </div>*/
        );
    }
}
