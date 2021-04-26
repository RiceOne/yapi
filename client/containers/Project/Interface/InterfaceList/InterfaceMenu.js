import React, {PureComponent as Component} from 'react';
import {connect} from 'react-redux';
import PropTypes from 'prop-types';
import {
    deleteInterfaceCatData,
    deleteInterfaceData,
    fetchInterfaceCatList,
    fetchInterfaceData,
    fetchInterfaceList,
    fetchInterfaceMenuTree,
    initInterface
} from '../../../../reducer/modules/interface.js';
import {getProject} from '../../../../reducer/modules/project.js';
import {Button, Icon, Input, message, Modal, Tooltip, Tree} from 'antd';
import AddInterfaceForm from './AddInterfaceForm';
import AddInterfaceCatForm from './AddInterfaceCatForm';
import axios from 'axios';
import {Link, withRouter} from 'react-router-dom';
import produce from 'immer';
import {arrayChangeIndex} from '../../../../common.js';

import './interfaceMenu.scss';

const confirm = Modal.confirm;
const TreeNode = Tree.TreeNode;
const headHeight = 240; // menu顶部到网页顶部部分的高度

@connect(
    state => {
        return {
            list: state.inter.list,
            inter: state.inter.curdata,
            curProject: state.project.currProject,
        };
    },
    {
        fetchInterfaceMenuTree,
        fetchInterfaceData,
        deleteInterfaceCatData,
        deleteInterfaceData,
        initInterface,
        getProject,
        fetchInterfaceCatList,
        fetchInterfaceList
    }
)
class InterfaceMenu extends Component {
    static propTypes = {
        match: PropTypes.object,
        inter: PropTypes.object,
        projectId: PropTypes.string,
        list: PropTypes.array,
        fetchInterfaceMenuTree: PropTypes.func,
        curProject: PropTypes.object,
        fetchInterfaceData: PropTypes.func,
        addInterfaceData: PropTypes.func,
        deleteInterfaceData: PropTypes.func,
        initInterface: PropTypes.func,
        history: PropTypes.object,
        router: PropTypes.object,
        getProject: PropTypes.func,
        fetchInterfaceCatList: PropTypes.func,
        fetchInterfaceList: PropTypes.func
    };

    constructor(props) {
        super(props);
        this.state = {
            curKey: null,
            visible: false,
            delIcon: null,
            curCatid: null,
            add_cat_modal_visible: false,
            add_subcat_modal_visible: false,
            change_cat_modal_visible: false,
            del_cat_modal_visible: false,
            expands: [],
            autoExpandParent: true,
            list: [],
            menuList: [],
            menuMap: null,
            interfaceList: [],
            filter: '',
        };
    }

    /**
     * @param {String} key
     */
    changeModal = (key, status) => {
        //visible add_cat_modal_visible change_cat_modal_visible del_cat_modal_visible
        let newState = {};
        newState[key] = status
        this.setState(newState);
    };

    handleCancel = () => {
        this.setState({
            visible: false
        });
    };

    handleRequest() {
        this.props.initInterface();
        this.getList();
    }

    async getList() {
        let r = await this.props.fetchInterfaceMenuTree(this.props.projectId);
        if (r.payload.data.data) {
            this.setState({
                    list: r.payload.data.data
                },
                () => {
                    const {menuList, interfaceList} = this.getDataList(r.payload.data.data);
                    let menuMap = new Map();
                    menuList.map(item => {
                        menuMap.set(item._id, item)
                    });
                    this.setState({menuList, interfaceList, menuMap})
                });
        }

    }

    componentWillMount() {
        this.handleRequest();
    }

    componentWillReceiveProps(nextProps) {
        if (this.props.list !== nextProps.list) {
            this.setState({
                list: nextProps.list
            });
        }
    }

    onSelect = selectedKeys => {
        const {history, match} = this.props;
        let curkey = selectedKeys[0];

        if (!curkey || !selectedKeys) {
            return false;
        }
        let basepath = '/project/' + match.params.id + '/interface/api';
        if (curkey === 'root') {
            history.push(basepath);
        } else {
            history.push(basepath + '/' + curkey);
        }
        // this.setState({
        //     expands: null
        // });
    };

    changeExpands = () => {
        // this.setState({
        //     expands: null
        // });
    };

    handleAddInterface = (data, cb) => {
        data.project_id = this.props.projectId;
        axios.post('/api/interface/add', data).then(res => {
            if (res.data.errcode !== 0) {
                return message.error(res.data.errmsg);
            }
            message.success('接口添加成功');
            let interfaceId = res.data.data._id;
            this.props.history.push('/project/' + this.props.projectId + '/interface/api/' + interfaceId);
            this.getList();
            this.setState({
                visible: false
            });
            if (cb) {
                cb();
            }
        });
    };

    handleAddInterfaceCat = data => {
        data.project_id = this.props.projectId;
        axios.post('/api/interface/add_cat', data).then(res => {
            if (res.data.errcode !== 0) {
                return message.error(res.data.errmsg);
            }
            message.success('接口分类添加成功');
            this.getList();
            this.props.getProject(data.project_id);
            this.setState({
                add_cat_modal_visible: false,
                add_subcat_modal_visible: false
            });
        });
    };

    handleChangeInterfaceCat = data => {
        data.project_id = this.props.projectId;
        let params = {
            catid: this.state.curCatdata._id,
            name: data.name,
            desc: data.desc,
            order: data.order ? data.order : 100,
            parent_id: data.parent_id
        };

        axios.post('/api/interface/up_cat', params).then(res => {
            if (res.data.errcode !== 0) {
                return message.error(res.data.errmsg);
            }
            message.success('接口分类更新成功');
            this.getList();
            this.props.getProject(data.project_id);
            this.setState({
                change_cat_modal_visible: false
            });
        });
    };

    showConfirm = data => {
        let that = this;
        let id = data._id;
        let catid = data.catid;
        const ref = confirm({
            title: '您确认删除此接口?',
            content: '温馨提示：接口删除后，无法恢复',
            okText: '确认',
            cancelText: '取消',
            async onOk() {
                await that.props.deleteInterfaceData(id, that.props.projectId);
                await that.getList();
                await that.props.fetchInterfaceCatList({catid, project_id: that.props.projectId});
                ref.destroy();
                that.props.history.push(
                    '/project/' + that.props.match.params.id + '/interface/api/cat_' + catid
                );
            },
            onCancel() {
                ref.destroy();
            }
        });
    };

    showDelCatConfirm = catid => {
        let that = this;
        const ref = confirm({
            title: '确定删除此接口分类吗？',
            content: '温馨提示：该操作会删除该分类下所有接口及子分类，接口删除后无法恢复',
            okText: '确认',
            cancelText: '取消',
            async onOk() {
                await that.props.deleteInterfaceCatData(catid, that.props.projectId);
                await that.getList();
                // await that.props.getProject(that.props.projectId)
                await that.props.fetchInterfaceList({project_id: that.props.projectId});
                that.props.history.push('/project/' + that.props.match.params.id + '/interface/api');
                ref.destroy();
            },
            onCancel() {
            }
        });
    };

    copyInterface = async id => {
        let interfaceData = await this.props.fetchInterfaceData(id);
        // let data = JSON.parse(JSON.stringify(interfaceData.payload.data.data));
        // data.title = data.title + '_copy';
        // data.path = data.path + '_' + Date.now();
        let data = interfaceData.payload.data.data;
        let newData = produce(data, draftData => {
            draftData.title = draftData.title + '_copy';
            draftData.path = draftData.path + '_' + Date.now();
        });

        axios.post('/api/interface/add', newData).then(async res => {
            if (res.data.errcode !== 0) {
                return message.error(res.data.errmsg);
            }
            message.success('接口添加成功');
            let interfaceId = res.data.data._id;
            await this.getList();
            this.props.history.push('/project/' + this.props.projectId + '/interface/api/' + interfaceId);
            this.setState({
                visible: false
            });
        });
    };

    enterItem = item => {
        this.setState({
            delIcon: item._id
        });
    };

    leaveItem = () => {
        this.setState({
            delIcon: null
        });
    };


    onExpand = e => {
        this.setState({
            expands: e,
            autoExpandParent: false
        });
    };

    // 推拽
    onDrop = async info => {

    };

    // 搜索过滤
    onFilter = e => {
        const {value} = e.target;
        const {menuMap, interfaceList} = this.state;
        let expandKeys = new Set();
        interfaceList.filter(item => {
            const title = item.title
            if (title.toLowerCase().indexOf(value.toLowerCase()) > -1) {
                let parents = this.getParents(item, menuMap);
                parents.forEach(id => {
                    expandKeys.add(id)
                });
            }
        })
        this.setState({
            filter: e.target.value,
            list: JSON.parse(JSON.stringify(this.props.list)),
            autoExpandParent: true,
            expands: Array.from(expandKeys),
        });
    };

    getParents = (item, dataMap) => {
        let _dataMap = new Map(dataMap);
        let parents = [];
        if (item) {
            let parentId = item.catid || item.parent_id;
            if (parentId) {
                parents.push('cat_' + parentId);
                parents = parents.concat(this.getParents(_dataMap.get(parentId), _dataMap));
                _dataMap = _dataMap.delete(parentId)//找完了，删掉
            }
        }
        return parents;
    }


    // 获取接口目录的平铺结构
    getDataList = (treeData) => {
        let menuList = [], interfaceList = [];
        if (treeData) {
            treeData.forEach(item => {
                menuList.push(item);
                if (item.children) {
                    const {menuList: _menuList, interfaceList: _interfaceList} = this.getDataList(item.children);
                    menuList = menuList.concat(_menuList);
                    interfaceList = interfaceList.concat(_interfaceList);
                }
                if (item.list) interfaceList = interfaceList.concat(item.list)
            })
        }
        return {menuList, interfaceList};
    }


    render() {

        const projectId = this.props.projectId;
        const matchParams = this.props.match.params;
        const {curCatdata, expands, autoExpandParent} = this.state;
        const searchBox = (<div className="interface-filter">
            <Input onChange={this.onFilter} value={this.state.filter} placeholder="搜索接口"/>
            <Button
                type="primary"
                onClick={e => {
                    e.stopPropagation();
                    this.setState({
                        curCatdata: {}
                    })
                    this.changeModal('add_cat_modal_visible', true);
                }}
                className="btn-filter"
            >
                添加分类
            </Button>
            {this.state.visible ? (
                <Modal
                    title="添加接口"
                    visible={this.state.visible}
                    onCancel={() => this.changeModal('visible', false)}
                    footer={null}
                    className="addcatmodal"
                    maskClosable={false}
                >
                    <AddInterfaceForm
                        projectId={projectId}
                        catdata={this.props.curProject.cat}
                        catid={this.state.curCatid}
                        onCancel={() => this.changeModal('visible', false)}
                        onSubmit={this.handleAddInterface}
                    />
                </Modal>
            ) : (
                ''
            )}

            {this.state.add_cat_modal_visible ? (
                <Modal
                    title={'添加分类'}
                    visible={this.state.add_cat_modal_visible}
                    onCancel={() => {
                        this.setState({
                            curCatdata: {}
                        })
                        this.changeModal('add_cat_modal_visible', false);
                    }}
                    footer={null}
                    className="addcatmodal"
                    maskClosable={false}
                >
                    <AddInterfaceCatForm
                        type={'add'}
                        projectId={projectId}
                        catdata={curCatdata}
                        onCancel={() => this.changeModal('add_cat_modal_visible', false)}
                        onSubmit={this.handleAddInterfaceCat}
                    />
                </Modal>
            ) : (
                ''
            )}

            {this.state.add_subcat_modal_visible ? (
                <Modal
                    title={'添加子分类'}
                    visible={this.state.add_subcat_modal_visible}
                    onCancel={() => {
                        this.setState({
                            curCatdata: {}
                        })
                        this.changeModal('add_subcat_modal_visible', false);
                    }}
                    footer={null}
                    className="addcatmodal"
                    maskClosable={false}
                >
                    <AddInterfaceCatForm
                        type={'addsub'}
                        projectId={projectId}
                        catdata={curCatdata}
                        onCancel={() => this.changeModal('add_subcat_modal_visible', false)}
                        onSubmit={this.handleAddInterfaceCat}
                    />
                </Modal>
            ) : (
                ''
            )}

            {this.state.change_cat_modal_visible ? (
                <Modal
                    title="修改分类"
                    visible={this.state.change_cat_modal_visible}
                    onCancel={() => this.changeModal('change_cat_modal_visible', false)}
                    footer={null}
                    className="addcatmodal"
                    maskClosable={false}
                >
                    <AddInterfaceCatForm
                        type={'edit'}
                        projectId={projectId}
                        catdata={curCatdata}
                        onCancel={() => this.changeModal('change_cat_modal_visible', false)}
                        onSubmit={this.handleChangeInterfaceCat}
                    />
                </Modal>
            ) : (
                ''
            )}
        </div>);

        const renderTreeNode = items => {
            const searchVal = this.state.filter;
            return items.map(item => {
                const title = (<span>{item.name}</span>);
                return (
                    searchVal && this.state.expands.indexOf('cat_' + item._id) < 0 ? null :
                        <TreeNode
                            title={
                                <div
                                    className="container-title"
                                    onMouseEnter={() => this.enterItem(item)}
                                    onMouseLeave={this.leaveItem}
                                >
                                    <Link
                                        className="interface-item"
                                        onClick={e => {
                                            e.stopPropagation();
                                            this.changeExpands();
                                        }}
                                        to={'/project/' + matchParams.id + '/interface/api/cat_' + item._id}
                                    >
                                        <Icon type="folder-open" style={{marginRight: 5}}/>
                                        {title}
                                    </Link>
                                    <div className="btns">
                                        <Tooltip title="删除分类">
                                            <Icon
                                                type="delete"
                                                className="interface-delete-icon"
                                                onClick={e => {
                                                    e.stopPropagation();
                                                    this.showDelCatConfirm(item._id);
                                                }}
                                                style={{display: this.state.delIcon == item._id ? 'block' : 'none'}}
                                            />
                                        </Tooltip>
                                        <Tooltip title="修改分类">
                                            <Icon
                                                type="edit"
                                                className="interface-delete-icon"
                                                style={{display: this.state.delIcon == item._id ? 'block' : 'none'}}
                                                onClick={e => {
                                                    e.stopPropagation();
                                                    this.setState({
                                                        curCatdata: item
                                                    });
                                                    this.changeModal('change_cat_modal_visible', true);
                                                }}
                                            />
                                        </Tooltip>
                                        <Tooltip title="添加子分类">
                                            <Icon
                                                type="addfolder"
                                                className="interface-delete-icon"
                                                onClick={e => {
                                                    e.stopPropagation();
                                                    this.setState({
                                                        curCatdata: item
                                                    })
                                                    this.changeModal('add_subcat_modal_visible', true);
                                                }}
                                                style={{display: this.state.delIcon == item._id ? 'block' : 'none'}}
                                            />
                                        </Tooltip>
                                        <Tooltip title="添加接口">
                                            <Icon
                                                type="plus"
                                                className="interface-delete-icon"
                                                style={{display: this.state.delIcon == item._id ? 'block' : 'none'}}
                                                onClick={e => {
                                                    e.stopPropagation();
                                                    this.changeModal('visible', true);
                                                    this.setState({
                                                        curCatid: item._id
                                                    });
                                                }}
                                            />
                                        </Tooltip>
                                    </div>
                                    {/*<Dropdown overlay={menu(item)} trigger={['click']} onClick={e => e.stopPropagation()}>
              <Icon type='ellipsis' className="interface-delete-icon" />
            </Dropdown>*/}
                                </div>
                            }
                            key={'cat_' + item._id}
                            className={`interface-item-nav ${(item.list.length || (item.children && item.children.length)) ? '' : 'cat_switch_hidden'}`}
                        >
                            {item.children ? renderTreeNode(item.children) : ''}
                            {item.list.map(renderInterfaceList)}
                        </TreeNode>
                );
            })
        }

        const renderInterfaceList = item => {
            const searchVal = this.state.filter;
            const index = item.title.toLowerCase().indexOf(searchVal.toLowerCase());
            const beforeStr = item.title.substr(0, index);
            const middleStr = item.title.substr(index, searchVal.length);
            const afterStr = item.title.substr(index + searchVal.length);
            const title = index > -1
                ? (<span>{beforeStr}<span style={{color: '#ff5500'}}>{middleStr}</span>{afterStr}</span>)
                : (<span>{item.title}</span>);
            return (
                searchVal && index < 0 ? null :
                    <TreeNode
                        title={
                            <div
                                className="container-title"
                                onMouseEnter={() => this.enterItem(item)}
                                onMouseLeave={this.leaveItem}
                            >
                                <Link
                                    className="interface-item"
                                    onClick={e => e.stopPropagation()}
                                    to={'/project/' + matchParams.id + '/interface/api/' + item._id}
                                >
                                    {title}
                                </Link>
                                <div className="btns">
                                    <Tooltip title="删除接口">
                                        <Icon
                                            type="delete"
                                            className="interface-delete-icon"
                                            onClick={e => {
                                                e.stopPropagation();
                                                this.showConfirm(item);
                                            }}
                                            style={{display: this.state.delIcon == item._id ? 'block' : 'none'}}
                                        />
                                    </Tooltip>
                                    <Tooltip title="复制接口">
                                        <Icon
                                            type="copy"
                                            className="interface-delete-icon"
                                            onClick={e => {
                                                e.stopPropagation();
                                                this.copyInterface(item._id);
                                            }}
                                            style={{display: this.state.delIcon == item._id ? 'block' : 'none'}}
                                        />
                                    </Tooltip>
                                </div>
                            </div>
                        }
                        key={'' + item._id}
                    />
            );
        };

        let menuList = this.state.list;

        return (
            <div>
                {searchBox}
                {menuList.length > 0 ? (
                    <div
                        className="tree-wrappper"
                        style={{maxHeight: parseInt(document.body.clientHeight) - headHeight + 'px'}}
                    >
                        <Tree
                            className="interface-list"
                            defaultExpandAll={false}
                            expandedKeys={expands}
                            onSelect={this.onSelect}
                            onExpand={this.onExpand}
                            draggable={false}
                            onDrop={this.onDrop}
                            autoExpandParent={autoExpandParent}
                        >
                            <TreeNode
                                className="item-all-interface"
                                title={
                                    <Link
                                        onClick={e => {
                                            e.stopPropagation();
                                            this.changeExpands();
                                        }}
                                        to={'/project/' + matchParams.id + '/interface/api'}
                                    >
                                        <Icon type="folder" style={{marginRight: 5}}/>
                                        全部接口
                                    </Link>
                                }
                                key="root"
                            />
                            {
                                renderTreeNode(menuList)
                            }
                        </Tree>
                    </div>
                ) : null}
            </div>
        );
    }
}

export default withRouter(InterfaceMenu);
