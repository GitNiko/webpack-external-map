import { useState, useEffect } from 'react'
import { withRouter } from 'next/router'
import Link from 'next/link'
import { Tag, Icon } from 'antd'
import 'antd/dist/antd.css'
import {getExternMapJson} from '../api/request'

export default withRouter(({ router }) => {
  const [versions, setVersions] = useState({})
  const name = router.query.name
  useEffect(() => {
    getExternMapJson().then(data => {
      if(data[name]) {
        setVersions(data[name])
      }
    })
  }, [])
  const Versions = Object.keys(versions).map((k, i) => {
    return (
      <div key={i}><Link href={{ pathname: '/editor', query: { range: k, name: name } }}><Tag color="blue">{ k }</Tag></Link></div>
    )
  })
  return (
    <div className="container">
      <div className="header">
      <label>{name}</label>
      <div className="add-icon"><Link href={{ pathname: '/editor', query: { name: name,range: '>=0.0.0' } }}><Icon type="plus-circle" /></Link></div>
      </div>
      <div className="content">
      <div>{Versions}</div>
      </div>
    </div>
  )
})