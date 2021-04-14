import React, {PureComponent as Component} from 'react';
import PropTypes from 'prop-types';
import {Table, Select, Tooltip, Icon} from 'antd';
import variable from '../../../../constants/variable';
import {connect} from 'react-redux';

const Option = Select.Option;
import {fetchInterfaceMenuTree} from '../../../../reducer/modules/interface.js';

@connect(
    state => {
        return {
            projectList: state.project.projectList,
            list: state.inter.list
        };
    },
    {
        fetchInterfaceMenuTree
    }
)
export default class ImportInterface extends Component {
    constructor(props) {
        super(props);
    }

    state = {
        selectedRowKeys: [],
        categoryCount: {},
        project: this.props.currProjectId,
        interfaceData: []
    };

    static propTypes = {
        list: PropTypes.array,
        selectInterface: PropTypes.func,
        projectList: PropTypes.array,
        currProjectId: PropTypes.string,
        fetchInterfaceMenuTree: PropTypes.func
    };

    async componentDidMount() {
        // console.log(this.props.currProjectId)
        await this.props.fetchInterfaceMenuTree(this.props.currProjectId);
        const {list} = this.props;
        const interfaceData = this.handleTreeData(list);
        this.setState({interfaceData})
    }

    // 切换项目
    onChange = async val => {
        this.setState({
            project: val,
            selectedRowKeys: [],
            categoryCount: {}
        });
        await this.props.fetchInterfaceMenuTree(val);
    };

    handleTreeData = (data) => {
        let _data = [].concat(data);
        _data.forEach(menu => {
            menu.key = 'category_' + menu._id;
            menu.title = menu.name;
            menu.isCategory = true;
            if (menu.children) {
                menu.children = this.handleTreeData(menu.children);
            } else {
                menu.children = []
            }
            if (menu.list) {
                menu.list.forEach(itf => {
                    itf.key = itf._id;
                    itf.categoryKey = 'category_' + itf._id;
                    itf.categoryLength = menu.list.length;
                    menu.children.push(itf);
                });
            }
        })
        return _data;
    }

    render() {

        const {projectList} = this.props;

        const data = this.state.interfaceData;

        const self = this;
        const checkStrictly = false;

        const rowSelection = {

            onSelect: (record, selected) => {
                // console.log(record, selected, selectedRows);
                const oldSelecteds = self.state.selectedRowKeys;
                const categoryCount = self.state.categoryCount;
                const categoryKey = record.categoryKey;
                const categoryLength = record.categoryLength;
                let selectedRowKeys = [];

                const getCategoryChildrenIds = (children = []) => {
                    let ids = children.map(v => v.key);
                    children.forEach(v => {
                        if (v.children && v.children.length) {
                            const childrenIds = getCategoryChildrenIds(v.children);
                            ids = [...ids, ...childrenIds]
                        }
                    })
                    return ids;
                };
                if (record.isCategory) {
                    // selectedRowKeys = record.children ? record.children.map(item => item._id).concat(record.key) : [];
                    selectedRowKeys = getCategoryChildrenIds([record]);
                    if (selected) {
                        selectedRowKeys = selectedRowKeys
                            .filter(id => oldSelecteds.indexOf(id) === -1)
                            .concat(oldSelecteds);
                        categoryCount[categoryKey] = categoryLength;
                    } else {
                        selectedRowKeys = oldSelecteds.filter(id => selectedRowKeys.indexOf(id) === -1);
                        categoryCount[categoryKey] = 0;
                    }
                } else {
                    if (selected) {
                        selectedRowKeys = oldSelecteds.concat(record._id);
                        if (categoryCount[categoryKey]) {
                            categoryCount[categoryKey] += 1;
                        } else {
                            categoryCount[categoryKey] = 1;
                        }
                        if (categoryCount[categoryKey] === record.categoryLength) {
                            selectedRowKeys.push(categoryKey);
                        }
                    } else {
                        selectedRowKeys = oldSelecteds.filter(id => id !== record._id);
                        if (categoryCount[categoryKey]) {
                            categoryCount[categoryKey] -= 1;
                        }
                        selectedRowKeys = selectedRowKeys.filter(id => id !== categoryKey);
                    }
                }
                self.setState({ selectedRowKeys, categoryCount });
                self.props.selectInterface(
                    selectedRowKeys.filter(id => ('' + id).indexOf('category') === -1),
                    self.state.project
                );
            },
            onSelectAll: (selected, selectedRows) => {
                let selectedRowKeys = selectedRows.map(v => v.key);
                let categoryCount = self.state.categoryCount;
                if (selected) {
                    selectedRows.forEach(item => {
                        if (item.children) {
                            categoryCount['category_' + item._id] = item.children.length;
                        }
                    });
                } else {
                    categoryCount = {};
                    selectedRowKeys = [];
                }
                self.setState({ selectedRowKeys, categoryCount });
                self.props.selectInterface(
                    selectedRowKeys.filter(id => ('' + id).indexOf('category') === -1),
                    self.state.project
                );
            },
            selectedRowKeys: self.state.selectedRowKeys
        };

        const columns = [
            {
                title: '接口名称',
                dataIndex: 'title',
                width: '30%'
            },
            {
                title: '接口路径',
                dataIndex: 'path',
                width: '40%'
            },
            {
                title: '请求方法',
                dataIndex: 'method',
                render: item => {
                    let methodColor = variable.METHOD_COLOR[item ? item.toLowerCase() : 'get'];
                    return (
                        <span
                            style={{
                                color: methodColor.color,
                                backgroundColor: methodColor.bac,
                                borderRadius: 4
                            }}
                            className="colValue"
                        >
              {item}
            </span>
                    );
                }
            },
            {
                title: (
                    <span>
            状态{' '}
                        <Tooltip title="筛选满足条件的接口集合">
              <Icon type="question-circle-o"/>
            </Tooltip>
          </span>
                ),
                dataIndex: 'status',
                render: text => {
                    return (
                        text &&
                        (text === 'done' ? (
                            <span className="tag-status done">已完成</span>
                        ) : (
                            <span className="tag-status undone">未完成</span>
                        ))
                    );
                },
                filters: [
                    {
                        text: '已完成',
                        value: 'done'
                    },
                    {
                        text: '未完成',
                        value: 'undone'
                    }
                ],
                onFilter: (value, record) => {
                    let arr = record.children.filter(item => {
                        return item.status.indexOf(value) === 0;
                    });
                    return arr.length > 0;
                    // record.status.indexOf(value) === 0
                }
            }
        ];

        return (
            <div>
                <div className="select-project">
                    <span>选择要导入的项目： </span>
                    <Select value={this.state.project} style={{width: 200}} onChange={this.onChange}>
                        {projectList.map(item => {
                            return item.projectname ? (
                                ''
                            ) : (
                                <Option value={`${item._id}`} key={item._id}>
                                    {item.name}
                                </Option>
                            );
                        })}
                    </Select>
                </div>
                <Table columns={columns} rowSelection={{ ...rowSelection, checkStrictly }} dataSource={data}/>
            </div>
        );
    }
}
