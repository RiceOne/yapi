import React, {PureComponent as Component} from 'react'
import PropTypes from 'prop-types'
import {Form, Input, Select, Button, TreeSelect} from 'antd';

const FormItem = Form.Item;


function hasErrors(fieldsError) {
    return Object.keys(fieldsError).some(field => fieldsError[field]);
}

class AddUserForm extends Component {


    static propTypes = {
        form: PropTypes.object,
        onSubmit: PropTypes.func,
        onCancel: PropTypes.func,
    }

    constructor(props) {
        super(props);
        this.state = {
            confirmDirty: false
        };
    }

    componentWillMount() {

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

    checkPassword = (rule, value, callback) => {
        const form = this.props.form;
        if (value && value !== form.getFieldValue('password')) {
            callback('两次输入的密码不一致!');
        } else {
            callback();
        }
    };

    checkConfirm = (rule, value, callback) => {
        const form = this.props.form;
        if (value && this.state.confirmDirty) {
            form.validateFields(['confirm'], {force: true});
        }
        callback();
    };


    render() {

        const {getFieldDecorator, getFieldsError} = this.props.form;

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

                <FormItem
                    {...formItemLayout}
                    label="用户名"
                >
                    {getFieldDecorator('userName', {
                        rules: [{required: true, message: '请输入用户名!'}]
                    })(
                        <Input placeholder="用户名"/>
                    )}
                </FormItem>
                <FormItem
                    {...formItemLayout}
                    label="邮箱"
                >
                    {getFieldDecorator('email', {
                        rules: [
                            {
                                required: true,
                                message: '请输入email!',
                                pattern: /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{1,})+$/
                            }
                        ]
                    })(
                        <Input placeholder="Email"/>
                    )}
                </FormItem>
                <FormItem
                    {...formItemLayout}
                    label="密码"
                >
                    {getFieldDecorator('password', {
                        rules: [
                            {
                                required: true,
                                message: '请输入密码!'
                            },
                            {
                                validator: this.checkConfirm
                            }
                        ]
                    })(
                        <Input placeholder="密码" type="password"/>
                    )}
                </FormItem>
                <FormItem
                    {...formItemLayout}
                    label="确认密码"
                >
                    {getFieldDecorator('confirm', {
                        rules: [
                            {
                                required: true,
                                message: '请再次输入密码!'
                            },
                            {
                                validator: this.checkPassword
                            }
                        ]
                    })(
                        <Input placeholder="确认密码" type="password"/>
                    )}
                </FormItem>
                <FormItem {...formItemLayout} label="角色">
                    {getFieldDecorator('role', {
                        initialValue: 'member',
                        rules: [
                            {
                                required: true,
                                message: '请选择用户角色!'
                            }
                        ]
                    })(
                        <Select>
                            <Option value={'member'}
                            >
                                用户
                            </Option>
                            <Option value={'admin'}
                            >
                                管理员
                            </Option>
                        </Select>
                    )}
                </FormItem>
                <FormItem className="catModalfoot" wrapperCol={{span: 24, offset: 8}}>
                    <Button onClick={this.props.onCancel} style={{marginRight: "10px"}}>取消</Button>
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

export default Form.create()(AddUserForm);
