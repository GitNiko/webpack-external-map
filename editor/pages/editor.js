import { useState, useEffect } from 'react'
import { withRouter } from 'next/router'
import Link from 'next/link'
import {getExternMapJson} from '../../isomorphic/request'

export default withRouter(({ router }) => {
  const [versions, setVersions] = useState({})
  const name = router.query.name
  const version = router.query.version
  useEffect(() => {
    getExternMapJson().then(data => {
      if(data[name]) {
        setVersions(data[name])
      }
    })
  }, [])
  // const Versions = Object.keys(versions).map((k, i) => {
  //   return (
  //     <div key={i}><Link href={{ pathname: '/editor', query: { version: k } }}>{ k }</Link></div>
  //   )
  // })
  return (<div>{name}, {version}</div>)
})