import React, { PureComponent as Component } from 'react'
import PropTypes from 'prop-types'
import {Form, Input, Select, Button, TreeSelect} from 'antd';

import constants from '../../../../constants/variable.js'
import {buildTree, handleApiPath, nameLengthLimit} from '../../../../common.js'
import axios from "axios";
const HTTP_METHOD = constants.HTTP_METHOD;
const HTTP_METHOD_KEYS = Object.keys(HTTP_METHOD);

const FormItem = Form.Item;
const Option = Select.Option;
function hasErrors(fieldsError) {
  return Object.keys(fieldsError).some(field => fieldsError[field]);
}


class AddInterfaceForm extends Component {


  static propTypes = {
    form: PropTypes.object,
    onSubmit: PropTypes.func,
    onCancel: PropTypes.func,
    catid: PropTypes.number,
    catdata: PropTypes.array,
  }

    constructor(props) {
        super(props);
        this.state = {
            menuTree: []
        };
    }

    componentWillMount() {
        this.getMenuTree();
    }


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
            let _menuList = [];
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

  handleSubmit = (e) => {
    e.preventDefault();
    this.props.form.validateFields((err, values) => {
      if (!err) {
        this.props.onSubmit(values, () => {
          this.props.form.resetFields();
        });

      }
    });
  }

  handlePath = (e) => {
    let val = e.target.value
    this.props.form.setFieldsValue({
      path: handleApiPath(val)
    })
  }


  render() {
      const {menuTree} = this.state;
    const { getFieldDecorator, getFieldsError } = this.props.form;
    const prefixSelector = getFieldDecorator('method', {
      initialValue: 'GET'
    })(
      <Select style={{ width: 75 }}>
        {HTTP_METHOD_KEYS.map(item => {
          return <Option key={item} value={item}>{item}</Option>
        })}
      </Select>
      );
    const formItemLayout = {
      labelCol: {
        xs: { span: 24 },
        sm: { span: 6 }
      },
      wrapperCol: {
        xs: { span: 24 },
        sm: { span: 14 }
      }
    };


    return (

      <Form onSubmit={this.handleSubmit}>
        <FormItem
          {...formItemLayout}
          label="接口分类"
        >
          {getFieldDecorator('catid', {
            initialValue: this.props.catid ? this.props.catid + '' : this.props.catdata[0]._id + ''
          })(
              <TreeSelect
                  treeData={menuTree}
                  style={{width: '100%'}}
                  dropdownStyle={{maxHeight: 400, overflow: 'auto'}}
                  placeholder="请选择接口分类"
                  treeDefaultExpandAll={false}
              />
            )}
        </FormItem>
        <FormItem
          {...formItemLayout}
          label="接口名称"
        >
          {getFieldDecorator('title', {
            rules: nameLengthLimit('接口')
          })(
            <Input placeholder="接口名称" />
            )}
        </FormItem>

        <FormItem
          {...formItemLayout}
          label="接口路径"
        >
          {getFieldDecorator('path', {
            rules: [{
              required: true, message: '请输入接口路径!'
            }]
          })(
            <Input onBlur={this.handlePath} addonBefore={prefixSelector} placeholder="/path" />
            )}
        </FormItem>
        <FormItem
          {...formItemLayout}
          label="注"
        >
          <span style={{ color: "#929292" }}>详细的接口数据可以在编辑页面中添加</span>
        </FormItem>
        <FormItem className="catModalfoot" wrapperCol={{ span: 24, offset: 8 }} >
          <Button onClick={this.props.onCancel} style={{ marginRight: "10px" }}  >取消</Button>
          <Button
            type="primary"
            htmlType="submit"
            disabled={hasErrors(getFieldsError())}
          >
            提交
          </Button>
        </FormItem>

      </Form>

    );
  }
}

export default Form.create()(AddInterfaceForm);
