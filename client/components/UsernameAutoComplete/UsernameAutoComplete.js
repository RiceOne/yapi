import React, {PureComponent as Component} from 'react';
import PropTypes from 'prop-types';
import {Select} from 'antd';
import axios from 'axios';

const Option = Select.Option;

/**
 * 用户名输入框自动完成组件
 *
 * @component UsernameAutoComplete
 * @examplelanguage js
 *
 * * 用户名输入框自动完成组件
 * * 用户名输入框自动完成组件
 *
 *s
 */

/**
 * 获取自动输入的用户信息
 *
 * 获取子组件state
 * @property callbackState
 * @type function
 * @description 类型提示：支持数组传值；也支持用函数格式化字符串：函数有两个参数(scale, index)；
 * 受控属性：滑块滑到某一刻度时所展示的刻度文本信息。如果不需要标签，请将该属性设置为 [] 空列表来覆盖默认转换函数。
 * @returns {object} {uid: xxx, username: xxx}
 * @examplelanguage js
 * @example
 * onUserSelect(childState) {
 *   this.setState({
 *     uid: childState.uid,
 *     username: childState.username
 *   })
 * }
 *
 */
class UsernameAutoComplete extends Component {
    constructor(props) {
        super(props);
        // this.lastFetchId = 0;
        // this.fetchUser = debounce(this.fetchUser, 800);
    }

    state = {
        dataSource: [],
        fetching: false,
        searchKey: '',
        scrollPage: 1,
        limit: 10,
        pageEnd: false,
    };

    static propTypes = {
        callbackState: PropTypes.func
    };

    componentDidMount() {
        // 初始态加载用户
        this.listUserWithPage();
    }

    // 分页查询
    async listUserWithPage() {

        const {dataSource, searchKey, scrollPage, limit} = this.state;

        const params = {q: searchKey};

        // 分页懒加载
        // const params = {q: searchKey, page: scrollPage, limit};

        this.setState({fetching: true});
        await axios.get('/api/user/search', {params}).then(data => {
            // if (fetchId !== this.lastFetchId) { // for fetch callback order
            //   return;
            // }
            const userList = [].concat(dataSource);
            data = data.data.data;

            if (data && data.length > 0) {
                data.forEach(v =>
                    userList.push({
                        username: v.username,
                        id: v.uid
                    })
                );
                // 取回搜索值后，设置 dataSource
                this.setState({
                    dataSource: userList
                });
            } else {
                this.setState({pageEnd: true})
            }
        });
    }

    // 搜索回调
    handleSearch = value => {
        this.setState({
                dataSource: [],
                fetching: false,
                searchKey: value,
                scrollPage: 1,
                limit: 10,
                pageEnd: false,
            },
            () => {
                this.listUserWithPage();
            })
    };

    // 选中候选词时
    handleChange = value => {
        this.setState({
            // 初始化
            // dataSource: [],
            // value,
            fetching: false
        });
        this.props.callbackState(value);
    };

    //懒加载数据
    lazyLoad = e => {
        e.persist();
        const {target} = e;
        let {scrollPage, pageEnd} = this.state;
        if (target.scrollTop + target.offsetHeight === target.scrollHeight) {
            this.setState({scrollPage: scrollPage + 1}, () => {
                if (!pageEnd) {
                    this.listUserWithPage();
                }
            });
        }
    }


    render() {

        let {dataSource, fetching} = this.state;
        const children = dataSource.map((item, index) => (
            <Option key={index} value={'' + item.id}>
                {item.username}
            </Option>
        ));

        // if (!children.length) {
        //   fetching = false;
        // }
        return (
            <Select
                mode="multiple"
                style={{width: '100%'}}
                placeholder="请输入用户名"
                filterOption={false}
                optionLabelProp="children"
                notFoundContent={fetching ? <span style={{color: 'red'}}> 当前用户不存在</span> : null}
                onSearch={this.handleSearch}
                onChange={this.handleChange}
                /*onPopupScroll={this.lazyLoad} 懒加载*/
            >
                {children}
            </Select>
        );
    }
}

export default UsernameAutoComplete;
