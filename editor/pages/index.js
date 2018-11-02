import React, { Component } from 'react'
import { Layout, Input } from 'antd'
import {getExternMapJson, getPackageInfo} from '../../isomorphic/request'
import 'antd/dist/antd.css'

const { Header, Footer, Content } = Layout
const Search = Input.Search

export default class Home extends Component {
  componentDidMount() {
    getExternMapJson().then((result) => {
      console.log(result)
    }).catch((err) => {
      
    });
    getPackageInfo().then(res => console.log(res))
  }
  render() {
    return (
      <Layout>
        <Header>
          <Search
            placeholder="Search packages"
            enterButton="Search"
            size="large"
            onSearch={value => console.log(value)}
          />
        </Header>
        <Content />
      </Layout>
    )
  }
}
