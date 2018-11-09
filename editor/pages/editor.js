import { useState, useEffect } from 'react'
import { withRouter } from 'next/router'
import Link from 'next/link'
import semver from "semver";
import {getPackageInfo,getExternMapJson, getPackageMetaList} from '../api/request'

import './editor.less'

const noop = () => {}


const Block = ({data=''}) => {
  const onDragStart = (ev) => {
    ev.dataTransfer.dropEffect = 'copy'
    ev.dataTransfer.setData('text/plain', data)
  }
  return (
    <ul className="file" draggable onDragStart={onDragStart}>{data}</ul>
  )
}

const SourceCard = ({onChange=noop, title=''}) => {
  const [source, setSource] = useState([])
  const onDrop = (ev) => {
    const data = ev.dataTransfer.getData("text/plain");
    setSource([...source, data])
    ev.preventDefault();
  }
  const onDragOver = (ev) => {
    ev.preventDefault();
  }
  const Blocks = source.map((v, i) => {
    return (
      <Block key={i} data={v}/>
    )
  })
  return (
    <div>
      <div><label>Solution Name:</label><input/></div>
      <div onDrop={onDrop} onDragOver={onDragOver} className="source-card">
        {Blocks}
      </div>
    </div>
  )
}


export default withRouter(({ router }) => {
  const {name, range} = router.query

  const [versions, setVersions] = useState([])
  const [selectedVersion, setSelectedVersion] = useState('')
  const [source, setSource] = useState([])

  useEffect(() => {
    getPackageInfo(name).then(info => {
      const version = Object.keys(info.versions).filter(e => {
        return semver.satisfies(e, range)
      })
      setVersions(version)
      // default is the first version
      setSelectedVersion(version[0] || '')
    })
  }, [name])

  useEffect(() => {
    if(selectedVersion) {
      getPackageMetaList()(name, selectedVersion).then(list => {
        return setSource(list.map(e => e.path))
      })
    }
  }, [selectedVersion])

  const onSelect = (e) => {
    setSelectedVersion(e.target.value)
  }

  const VersionOptions = versions.map((v, i) => {
    return (
      <option key={i} value={v} >{v}</option>
    )
  })
  const Files = source.map((v, i) => {
    return (
      <Block key={i} data={v}/>
    )
  })
  return (
    <div className="container">
      <div className="source">
        <h3>包内容窗口</h3>
        <select defaultValue={selectedVersion} onChange={onSelect}>
          {VersionOptions}
        </select>
        <div>{Files}</div>
      </div>
      <div>
        <h3>资源窗口</h3>
        <div><label>Version Range:</label><input/></div>
        <div><label>window.</label><input/></div>
        <div>
          <h4>JavaScript</h4>
          <SourceCard source={['/packks']} title="dev"/>
        </div>
      </div>
      <div>测试窗口</div>
    </div>
  )
})