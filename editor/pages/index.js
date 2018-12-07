import React, { useState, useEffect } from 'react'
import { Input, Alert } from 'antd'
import Link from 'next/link'
import {getExternMapJson, getPackageInfo, searchPackage} from '../api/request'
import 'antd/dist/antd.css'
import './index.less'

const Search = Input.Search


export default function Home() {
  const [packages, setPackages] = useState([])
  const [total, setTotal] = useState(0)
  const [searched, setSearched] = useState(false)

  const onSearch = (value) => {
    searchPackage(value).then(data => {
      setPackages(data.objects)
      setTotal(data.total)
      setSearched(true)
    })
  }
  let empty = searched ? <Alert message="No packages found ☹️ " type="warning" /> : null
  const Packages = packages.map((e, i) => {
    return (
      <div key={i}><Link href={{ pathname: '/version', query: { name: e.package.name } }}><a className="package-name">{e.package.name }</a></Link></div>
    )
  })
  return (
    <div className="container">
      <div className="header">
        <Search
          placeholder="Search packages"
          enterButton="Search"
          size="large"
          onSearch={onSearch}
        />
      </div>
      <div className="content">
        {Packages.length > 0 ? Packages :empty}
      </div>
    </div>
  )
}