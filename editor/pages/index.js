import React, { useState, useEffect } from 'react'
import { Layout, Input } from 'antd'
import Link from 'next/link'
import {getExternMapJson, getPackageInfo, searchPackage} from '../api/request'
import 'antd/dist/antd.css'
import './index.less'

const { Header, Footer, Content } = Layout
const Search = Input.Search

export default function Home() {
  const [packages, setPackages] = useState([])
  const [total, setTotal] = useState(0)
  
  useEffect(() => {
    
  })
  const onSearch = (value) => {
    searchPackage(value).then(data => {
      setPackages(data.objects)
      setTotal(data.total)
    })
  }
  const Packages = packages.map((e, i) => {
    return (
      <div key={i}><Link href={{ pathname: '/version', query: { name: e.package.name } }}><a className="package-name">{e.package.name }</a></Link></div>
    )
  })
  return (
    <Layout>
      <Header>
        <Search
          placeholder="Search packages"
          enterButton="Search"
          size="large"
          onSearch={onSearch}
        />
      </Header>
      <div className="content">
        {Packages}
      </div>
    </Layout>
  )
}