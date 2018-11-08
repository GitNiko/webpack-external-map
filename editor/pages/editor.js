import { useState, useEffect } from 'react'
import { withRouter } from 'next/router'
import Link from 'next/link'
import {getExternMapJson, getPackageMetaList} from '../api/request'

import './editor.less'


export default withRouter(({ router }) => {
  const {name, version} = router.query

  const [versions, setVersions] = useState({})
  const [selectedVersion, setSelectedVersion] = useState()
  const [source, setSource] = useState({})

  useEffect(() => {
    // getExternMapJson().then(data => {
    //   if(data[name]) {
    //     setVersions(data[name])
    //   }
    // })
    let pkgVersion = version
    if(selectedVersion) {
      pkgVersion = selectedVersion
    }
    getPackageMetaList()(name, pkgVersion).then(list => console.log(list))
    // getPackageMetaList()(name, pkgVersion).then
  }, [name, selectedVersion, version])
  // const Versions = Object.keys(versions).map((k, i) => {
  //   return (
  //     <div key={i}><Link href={{ pathname: '/editor', query: { version: k } }}>{ k }</Link></div>
  //   )
  // })
  return (
    <div className="container">
      <div>
        <h3>包内容窗口</h3>
        
      </div>
      <div>资源窗口</div>
      <div>测试窗口</div>
    </div>
  )
})