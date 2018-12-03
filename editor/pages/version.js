import { useState, useEffect } from 'react'
import { withRouter } from 'next/router'
import Link from 'next/link'
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
      <div key={i}><Link href={{ pathname: '/editor', query: { range: k, name: name } }}><a>{ k }</a></Link></div>
    )
  })
  return (
    <div>
      <div>{Versions}</div>
      <div><Link href={{ pathname: '/editor', query: { name: name,range: '>=0.0.0' } }}><a>没有你想要的？来添加一个吧</a></Link></div>
    </div>
  )
})