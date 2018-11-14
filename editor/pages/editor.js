import { useState, useEffect, useRef } from 'react'
import { withRouter } from 'next/router'
import Link from 'next/link'
import semver from 'semver'
import {
  getPackageInfo,
  getExternMapJson,
  getPackageMetaList,
} from '../api/request'

import './editor.less'

const noop = () => {}

const Block = ({ data = '' }) => {
  const onDragStart = ev => {
    ev.dataTransfer.dropEffect = 'copy'
    ev.dataTransfer.setData('text/plain', data)
  }
  return (
    <div className="file" draggable onDragStart={onDragStart}>
      {data}
    </div>
  )
}

const getSortable = (handlers = {}) => {
  const onDragStart = ev => {
    ev.dataTransfer.dropEffect = 'copy'
    ev.dataTransfer.setData('text/plain', data)
  }
  const onDragOver = ev => {
    ev.preventDefault()
    const rect = ev.target.getBoundingClientRect()
    const middle = rect.height / 2
    const offset = ev.clientY - rect.top
    // console.log(offset)
    if (offset < middle) {
      onDragDownward(ev)
    } else {
      onDragUpward(ev)
    }
  }
  const onDragEnd = ev => {
    console.log('end')
  }
  const onDrop = ev => {
    console.log('onDrop in Block')
    ev.stopPropagation()
  }
  const onDragDownward = ev => {
    if (handlers.onDragDownward) {
      handlers.onDragDownward(ev)
    }
  }
  const onDragUpward = ev => {
    if (handlers.onDragUpward) {
      handlers.onDragUpward(ev)
    }
  }
  const draggable = true
  // remove Unknown event handler property avoid warning
  let cloneHandlers = { ...handlers }
  delete cloneHandlers['onDragDownward']
  delete cloneHandlers['onDragUpward']
  return {
    onDragStart,
    onDragOver,
    onDrop,
    draggable,
    onDragEnd,
    ...cloneHandlers,
  }
}

const SortBlock = ({
  data = '',
  onDragStart = noop,
  onDrop = noop,
  onDelete = noop,
}) => {
  const [toward, setToward] = useState('up')
  const sortableProps = getSortable({
    onDragStart: ev => {
      ev.dataTransfer.dropEffect = 'move'
      ev.dataTransfer.setData('text/plain', data)
      onDragStart(data)
    },
    onDragDownward: ev => {
      console.log('down')
      setToward('down')
    },
    onDragUpward: ev => {
      console.log('up')
      setToward('up')
    },
    onDrop: ev => {
      onDrop(ev, data, toward)
      ev.stopPropagation()
    },
  })

  const onClick = ev => {
    onDelete(data)
  }

  return (
    <div className="file" {...sortableProps}>
      <span onClick={onClick}>remove:</span>
      {data}
    </div>
  )
}

const SourceCard = ({ onChange = noop, title = '' }) => {
  const [source, setSource] = useState([])
  const [solutionName, setSolutionName] = useState('')
  
  const onDrop = ev => {
    const data = ev.dataTransfer.getData('text/plain')
    if (source.indexOf(data) !== -1) {
      // skip when exist
      return
    }
    setSource([...source, data])
  }
  const onDragOver = ev => {
    ev.preventDefault()
  }
  const onItemDragStart = data => {
    // remove item when drag start
    // setSource(source.filter(v => v !== data))
  }
  const onDelete = data => {
    console.log(data)
  }
  const onItemDrop = (ev, self, toward) => {
    const data = ev.dataTransfer.getData('text/plain')
    if (self === data) {
      // skip when drop on self
      return
    }
    let index = source.indexOf(self)

    if (index !== -1) {
      let newSource = source.filter(e => e !== data) // remove origin data
      index = newSource.indexOf(self)
      console.log(toward)
      if (toward === 'up') {
        newSource.splice(index + 1, 0, data)
      } else {
        newSource.splice(index, 0, data)
      }
      setSource(newSource)
    }
  }
  const Blocks = source.map((v, i) => {
    return (
      <SortBlock
        key={i}
        data={v}
        onDragStart={onItemDragStart}
        onDrop={onItemDrop}
        onDelete={onDelete}
      />
    )
  })
  return (
    <div>
      <div>
        <label>Solution Name:</label>
        <input />
      </div>
      <div onDrop={onDrop} onDragOver={onDragOver} className="source-card">
        {Blocks}
      </div>
    </div>
  )
}

// const reducer = (state, action) => {
//   switch (action.type) {
//     case 'editor/set_versions':
//       return {
//         ...state,
//         versions: action.versions,
//       }
//     case 'editor/set_selected_version':
//       return {
//         ...state,
//         selectedVersion: action.selectedVersion,
//       }
//     case 'editor/set_source':
//       return {
//         ...state,
//         source: action.source,
//       }
//   }
//   return state
// }

// const useEditorStatus = (name, range) => {
//   const [state, setState] = useState({
//     versions: [],
//     selectedVersion: '',
//     source: [],
//   })

//   const { selectedVersion } = state

//   const dispatch = action => {
//     const nextState = reducer(state, action)
//     setState(nextState)
//   }

//   useEffect(
//     () => {
//       getPackageInfo(name).then(info => {
//         const versions = Object.keys(info.versions).filter(e => {
//           return semver.satisfies(e, range)
//         })
//         dispatch({ type: 'editor/set_versions', versions })
//         // default is the first version
//         dispatch({ type: 'editor/set_selected_version', selectedVersion })
//       })
//     },
//     [name],
//   )

//   useEffect(
//     () => {
//       if (selectedVersion) {
//         getPackageMetaList()(name, selectedVersion).then(source => {
//           dispatch({ type: 'editor/set_source', source })
//         })
//       }
//     },
//     [state],
//   )

//   return [state, dispatch]
// }
// const EditorContext = React.createContext({
//   state: {},
//   dispatch: noop,
// })

// export default withRouter(({ router }) => {
//   const { name, range } = router.query

//   const [state, dispatch] = useEditorStatus(name, range)

//   const onSelect = e => {
//     setSelectedVersion(e.target.value)
//     dispatch({type: 'editor/set_selected_version', selectedVersion: e.target.value})
//   }

//   const {versions, selectedVersion, source} = state

//   const VersionOptions = versions.map((v, i) => {
//     return (
//       <option key={i} value={v}>
//         {v}
//       </option>
//     )
//   })
//   const Files = source.map((v, i) => {
//     return <Block key={i} data={v} />
//   })
//   return (
//     <div className="container">
//       <div className="source">
//         <h3>包内容窗口</h3>
//         <select defaultValue={selectedVersion} onChange={onSelect}>
//           {VersionOptions}
//         </select>
//         <div>{Files}</div>
//       </div>
//       <div>
//         <h3>资源窗口</h3>
//         <div>
//           <label>Version Range:</label>
//           <input />
//         </div>
//         <div>
//           <label>window.</label>
//           <input />
//         </div>
//         <div>
//           <h4>JavaScript</h4>
//           <SourceCard source={['/packks']} title="dev" />
//         </div>
//       </div>
//       <div>测试窗口</div>
//     </div>
//   )
// })
export default withRouter(({ router }) => {
  const { name, range } = router.query

  const [versions, setVersions] = useState([])
  const [selectedVersion, setSelectedVersion] = useState('')
  const [source, setSource] = useState([])

  const [windowRoot, setWindowRoot] = useState('')

  const [jsSolutions, setJSSolution] = useState([{}])
  const [cssSolutions, setCSSSolution] = useState([{}])

  useEffect(
    () => {
      getPackageInfo(name).then(info => {
        const version = Object.keys(info.versions).filter(e => {
          return semver.satisfies(e, range)
        })
        setVersions(version)
        // default is the first version
        setSelectedVersion(version[0] || '')
      })
    },
    [name],
  )

  useEffect(
    () => {
      if (selectedVersion) {
        getPackageMetaList()(name, selectedVersion).then(list => {
          return setSource(list.map(e => e.path))
        })
      }
    },
    [selectedVersion],
  )

  const onSelect = e => {
    setSelectedVersion(e.target.value)
  }

  const VersionOptions = versions.map((v, i) => {
    return (
      <option key={i} value={v}>
        {v}
      </option>
    )
  })
  const Files = source.map((v, i) => {
    return <Block key={i} data={v} />
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
        <div>
          <label>Version Range:</label>
          <input />
        </div>
        <div>
          <label>window.</label>
          <input />
        </div>
        <div>
          <h4>JavaScript</h4>
          <SourceCard source={['/packks']} title="dev" />
        </div>
      </div>
      <div>测试窗口</div>
    </div>
  )
})
