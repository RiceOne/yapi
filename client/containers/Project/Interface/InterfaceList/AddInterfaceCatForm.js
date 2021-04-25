import React, {PureComponent as Component} from 'react';
import PropTypes from 'prop-types';
import {Form, Input, Button, InputNumber, TreeSelect} from 'antd';
import axios from "axios";
import {buildTree} from "../../../../common";

const FormItem = Form.Item;

function hasErrors(fieldsError) {
    return Object.keys(fieldsError).some(field => fieldsError[field]);
}

class AddInterfaceCatForm extends Component {
    static propTypes = {
        form: PropTypes.object,
        onSubmit: PropTypes.func,
        onCancel: PropTypes.func,
        catdata: PropTypes.object
    };

    constructor(props) {
        super(props);
        this.state = {
            menuTree: []
        };
    }

    componentWillMount() {
        this.getMenuTree();
    }

    handleSubmit = e => {
        e.preventDefault();
        this.props.form.validateFields((err, values) => {
            if (!err) {
                this.props.onSubmit(values);
            }
        });
    };

    // 获取菜单树
    async getMenuTree() {
        let projectId = this.props.projectId;
        let menuList = []
        await axios.get(`/api/interface/getCatMenu?project_id=${projectId}`).then(data => {
            if (data.data.errcode === 0) {
                menuList = data.data.data;
            }
        });
        // 菜单树
        if (menuList) {
            let _menuList = [{_id: 0, label: '根目录', title: '根目录', value: '0'}];
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

    render() {
        const {menuTree} = this.state;
        const {getFieldDecorator, getFieldsError} = this.props.form;
        let {type, catdata, projectId} = this.props;
        let _catdata = Object.assign({}, catdata);
        if (type === 'add' || type === 'addsub') {
            _catdata = {
                parent_id: catdata._id ? catdata._id : 0,
                project_id: catdata.project_id ? catdata.project_id : projectId
            }
        }

        const formItemLayout = {
            labelCol: {
                xs: {span: 24},
                sm: {span: 6}
            },
            wrapperCol: {
                xs: {span: 24},
                sm: {span: 14}
            }
        };

        return (
            <Form onSubmit={this.handleSubmit}>
                <FormItem {...formItemLayout} label="父级分类">
                    {getFieldDecorator('parent_id', {
                        rules: [
                            {
                                required: true,
                                message: '请输入分类名称!'
                            }
                        ],
                        initialValue: _catdata ? (_catdata.parent_id + '' || null) : null
                    })(
                        <TreeSelect
                            disabled={type === 'addsub'}
                            treeData={menuTree}
                            style={{width: '100%'}}
                            dropdownStyle={{maxHeight: 400, overflow: 'auto'}}
                            placeholder="请选择父级分类"
                            treeDefaultExpandAll={false}
                        />)}
                </FormItem>
                <FormItem {...formItemLayout} label="分类名">
                    {getFieldDecorator('name', {
                        rules: [
                            {
                                required: true,
                                message: '请输入分类名称!'
                            }
                        ],
                        initialValue: _catdata ? _catdata.name || null : null
                    })(<Input placeholder="分类名称"/>)}
                </FormItem>
                <FormItem {...formItemLayout} label="顺序">
                    {getFieldDecorator('order', {
                        initialValue: _catdata ? _catdata.order || null : null,
                        rules: [{
                            required: false,
                            pattern: new RegExp(/^[1-9]\d*$/, "g"),
                            message: '请输入正整数作为排序顺序号'
                        }],
                        getValueFromEvent: (event) => {
                            return event.target.value.replace(/\D/g, '')
                        }

                    })(<Input placeholder="顺序"/>)}
                </FormItem>
                <FormItem {...formItemLayout} label="备注">
                    {getFieldDecorator('desc', {
                        initialValue: _catdata ? _catdata.desc || null : null
                    })(<Input placeholder="备注"/>)}
                </FormItem>
                <FormItem className="catModalfoot" wrapperCol={{span: 24, offset: 8}}>
                    <Button onClick={this.props.onCancel} style={{marginRight: '10px'}}>
                        取消
                    </Button>
                    <Button type="primary" htmlType="submit" disabled={hasErrors(getFieldsError())}>
                        提交
                    </Button>
                </FormItem>
            </Form>
        );
    }
}

export default Form.create()(AddInterfaceCatForm);
