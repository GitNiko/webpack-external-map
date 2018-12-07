import { useState, useEffect, useRef } from 'react'
import { Form, Select, Input, Icon, Button } from 'antd'
import cloneDeep from 'lodash/cloneDeep'
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd'
import { withRouter } from 'next/router'
import Link from 'next/link'
import semver from 'semver'
import { subset } from '../api/common'
import {
  getPackageInfo,
  getExternMapJson,
  getPackageMetaList,
  commit,
} from '../api/request'

import './index.less'
import 'antd/dist/antd.css'

const FormItem = Form.Item

function noop() {}

function getExtension(str) {
  return str.split('.').pop()
}
// a*b*c*d ...
function encode(...args) {
  return args.reduce((acc, x) => (acc = acc + '*' + x))
}
function decode(str) {
  return str.split('*')
}
function cutHead(str) {
  return str.slice(1)
}
function unpkg(str, name, version) {
  return `https://unpkg.com/${name}@${version}/${str}`
}
function cutWindow(str) {
  return str.split('.')[1]
}
// remove empty array and empty attrbutuion
function reduction(pObj) {
  let obj = cloneDeep(pObj)

  function reduct(obj) {
    Object.keys(obj).forEach(k => {
      if (!!obj[k]) {
        if (typeof obj[k] === 'string') {
          return
        }
        if (Array.isArray(obj[k])) {
          if (obj[k].length) {
            obj[k].forEach(o => reduct(o))
          } else {
            delete obj[k]
          }
        } else {
          return reduct(obj[k])
        }
      } else {
        // '', undefined, null
        delete obj[k]
      }
    })
  }
  reduct(obj)
  return obj
}

function BlurInput({ value, onChange = noop }) {
  const [state, setState] = useState(value)
  //  const onValueChange
  useEffect(
    () => {
      setState(value)
    },
    [value],
  )
  return (
    <Input
      onChange={ev => setState(ev.target.value)}
      value={state}
      onBlur={() => onChange(state)}
    />
  )
}
function SourceCard({
  source = [],
  solutionName = '',
  type,
  droppableId,
  onDelete,
  onSolutionNameChange = noop,
}) {
  function onClick(ev) {
    onDelete(droppableId)
  }

  return (
    <div className="source-card">
      <div className="peer">
        <BlurInput
          value={solutionName}
          onChange={(v) => onSolutionNameChange(droppableId, v)}
        />
        <div className="peer-delete">
          <Icon type="delete" onClick={onClick} />
        </div>
      </div>
      <Droppable droppableId={droppableId}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            style={getListStyle(snapshot.isDraggingOver)}
          >
            {source.map((item, index) => (
              <Draggable
                key={item}
                draggableId={encode(droppableId, item)}
                index={index}
              >
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    style={getItemStyle(
                      snapshot.isDragging,
                      provided.draggableProps.style,
                    )}
                  >
                    {item}
                  </div>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  )
}

function Leaf({
  tKey = '',
  value = '',
  onRemove = noop,
  onAttrValChange = noop,
  onAttrKeyChange = noop,
}) {
  return (
    <div className="peer">
      <div>
        <BlurInput value={tKey} onChange={v => onAttrKeyChange(tKey, v)} />
      </div>{' '}
      :
      <div>
        <BlurInput value={value} onChange={v => onAttrValChange(tKey, v)} />
      </div>
      <div className="peer-delete">
        <Icon type="delete" onClick={() => onRemove(tKey)} />
      </div>
      {/* <Button onClick={() => onRemove(tKey)}>Delete</Button> */}
    </div>
  )
}

function useNode(init = {}) {
  const [state, setState] = useState(init)
  return [
    state,
    {
      setState,
      add: function(k, v) {
        if (state[k]) {
          console.warn(`${k} is exist`)
          return
        }
        const newState = { ...state }
        newState[k] = v
        setState(newState)
      },
      remove: function(k) {
        if (!state[k]) {
          console.warn(`${k} is not exist`)
          return
        }
        const newState = { ...state }
        delete newState[k]
        setState(newState)
      },
      changeKey: function(k, newK) {
        if (state[newK]) {
          console.warn(`${newK} is exist`)
          return
        }
        if (!state[k]) {
          console.warn(`${k} is not exist`)
          return
        }
        const newState = { ...state }
        newState[newK] = newState[k]
        delete newState[k]

        setState(newState)
      },
      changeValue: function(k, v) {
        if (!state[k]) {
          console.warn(`${k} is not exist`)
          return
        }
        const newState = { ...state }
        newState[k] = v

        setState(newState)
      },
    },
  ]
}

function getListStyle(isDraggingOver) {
  return {
    background: isDraggingOver ? 'lightblue' : 'lightgrey',
    padding: grid,
    width: 250,
  }
}

const grid = 8

function getItemStyle(isDragging, draggableStyle) {
  return {
    // some basic styles to make the items look a bit nicer
    userSelect: 'none',
    padding: grid * 2,
    margin: `0 0 ${grid}px 0`,

    // change background colour if dragging
    background: isDragging ? 'lightgreen' : 'grey',

    // styles we need to apply on draggables
    ...draggableStyle,
  }
}

function useSolution(
  defaultSolution = {
    root: '',
    primaryKey: {
      js: {},
      css: {},
    },
    js: {
      development: [],
      deployment: [],
    },
    css: {},
  },
) {
  function calcPrimaryKey(state) {
    function keysToPrimary(obj) {
      return Object.keys(obj).reduce((acc, x, i) => {
        acc[i] = x
        return acc
      }, {})
    }
    const newState = { primaryKey: {}, js: {}, css: {}, ...state }
    const jsPrimaryKey = keysToPrimary(newState.js)
    newState.primaryKey.js = jsPrimaryKey

    const cssPrimaryKey = keysToPrimary(newState.css)
    newState.primaryKey.css = cssPrimaryKey

    return newState
  }
  const [state, setState] = useState(calcPrimaryKey(defaultSolution))

  const reOrder = type => (name, src, dest) => {
    const newState = { ...state }
    const [removed] = newState[type][name].splice(src, 1)
    newState[type][name].splice(dest, 0, removed)
    setState(newState)
  }
  const insert = type => (name, file, index) => {
    const newState = { ...state }
    if (!newState[type][name]) {
      // init and insert first file
      newState[type][name] = [file]
    } else {
      // if exist then insert
      newState[type][name].splice(index, 0, file)
    }
    setState(newState)
  }

  const remove = type => (name, file, index) => {
    const newState = { ...state }
    if (!newState[type][name]) {
      // skip
      return
    } else {
      // if exist then delete
      newState[type][name].splice(index, 1)
    }
    setState(newState)
  }

  const create = type => () => {
    const newState = { ...state }
    // invoid duplicate
    const newKey = Object.keys(newState.primaryKey[type]).length
    const name = newKey
    newState.primaryKey[type][newKey] = name
    newState[type][name] = []

    setState(newState)
  }

  const del = type => key => {
    const newState = { ...state }
    const name = newState.primaryKey[type][key]
    // remove key
    delete newState.primaryKey[type][key]
    // remove value
    delete newState[type][name]
    setState(newState)
  }

  const rename = type => (key, newName) => {
    const newState = { ...state }
    const name = newState.primaryKey[type][key]
    const origin = newState[type][name]
    // remove value
    delete newState[type][name]
    // update value
    newState.primaryKey[type][key] = newName
    newState[type][newName] = origin
    setState(newState)
  }
  const getNameByKey = type => key => {
    return state.primaryKey[type][key]
  }

  function getSolutionWithoutKey() {
    let newState = { ...state }
    delete newState.primaryKey
    return newState
  }

  return [
    state,
    {
      setRoot: root => setState({ ...state, root }),
      insert,
      remove,
      create,
      del,
      rename,
      reOrder,
      getNameByKey,
      setSolution: solution => setState(calcPrimaryKey(solution)),
      getSolutionWithoutKey,
    },
  ]
}

export default withRouter(({ router }) => {
  const { name, range: defaultRange } = router.query

  const [versions, setVersions] = useState([])
  const [selectedVersion, setSelectedVersion] = useState('')
  const [source, setSource] = useState([])
  const [displaySource, setDisplaySouce] = useState([])
  const [range, setRange] = useState(defaultRange)
  const [depens, depensInterface] = useNode({})

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
      if (name && range) {
        getExternMapJson().then(extnMap => {
          if (extnMap[name] && extnMap[name][range]) {
            setSolution(extnMap[name][range])
            if (extnMap[name][range].peerDependencies) {
              depensInterface.setState(extnMap[name][range].peerDependencies)
            }
          }
        })
      }
    },
    [name, range],
  )

  useEffect(
    () => {
      if (selectedVersion) {
        getPackageMetaList()(name, selectedVersion).then(list => {
          const source = list
            .map(e => e.path)
            .filter(
              path =>
                getExtension(path) === 'js' || getExtension(path) === 'css',
            )
            .map(cutHead)

          setDisplaySouce(source)
          return setSource(source)
        })
      } else {
        // clear
        setSource([])
        setDisplaySouce([])
      }
    },
    [selectedVersion],
  )

  // on version selected
  function onSelect(v) {
    setSelectedVersion(v)
  }

  const VersionOptions = versions.map((v, i) => {
    return (
      <option key={i} value={v}>
        {v}
      </option>
    )
  })
  const [
    solution,
    {
      setRoot,
      setSolution,
      insert,
      remove,
      create,
      del,
      rename,
      reOrder,
      getNameByKey,
      getSolutionWithoutKey,
    },
  ] = useSolution()
  const onAddSolution = create
  const onSolutionNameChange = type => (key, newName) => {
    rename(type)(decode(key).pop(), newName)
  }
  const onSolutionDelete = type => key => {
    del(type)(decode(key).pop())
  }
  function onDragStart(ev) {
    /*...*/
  }
  function onDragUpdate() {
    /*...*/
  }
  function onDragEnd(result) {
    // the only one that is required
    const { source, destination, draggableId } = result
    const type = getExtension(draggableId)

    if (type !== 'js' && type !== 'css') {
      return
    }

    // dropped outside the list
    if (!destination) {
      // remove solution when dropped outside solution
      if (source.droppableId !== 'source') {
        const key = decode(source.droppableId)[1]
        const name = getNameByKey(type)(key)
        remove(type)(name, decode(draggableId).pop(), source.index)
      }
      return
    }
    // don't need change for source
    if (destination.droppableId === 'source') {
      return
    }
    // don't need change between solutions
    if (
      source.droppableId !== 'source' &&
      source.droppableId !== destination.droppableId
    ) {
      return
    }
    const key = decode(destination.droppableId)[1]
    const name = getNameByKey(type)(key)
    if (source.droppableId === destination.droppableId) {
      reOrder(type)(name, source.index, destination.index)
    } else {
      if (source.droppableId === 'source') {
        // don't insert if exist
        if (solution[type][name].find(x => x === decode(draggableId).pop())) {
          return
        }
      }
      insert(type)(name, decode(draggableId).pop(), destination.index)
    }
  }
  const getSolution = type => sln =>
    Object.keys(sln.primaryKey[type]).map((key, i) => {
      const solutionName = sln.primaryKey[type][key]
      const source = sln[type][solutionName]
      const droppableId = encode(type, key)
      return (
        <SourceCard
          key={i}
          source={source}
          solutionName={solutionName}
          onSolutionNameChange={onSolutionNameChange(type)}
          droppableId={droppableId}
          onDelete={onSolutionDelete(type)}
        />
      )
    })
  const JSSolutions = getSolution('js')(solution)
  const CSSSolutions = getSolution('css')(solution)

  function onRunTest() {
    getExternMapJson()
      .then(extnMap => {
        const depPromises = Object.keys(depens).map(dep =>
          getPackageInfo(dep).then(d => ({ name: dep, versions: d.versions })),
        )
        return Promise.all(depPromises).then(pkgs => [
          extnMap,
          pkgs.reduce((acc, v) => {
            acc[v.name] = Object.keys(v.versions)
            return acc
          }, {}),
        ])
      })
      .then(([extnMap, pkgs]) => {
        return Object.keys(depens)
          .map(dep => {
            let source = ''
            if (extnMap[dep]) {
              const depRange = depens[dep]
              Object.keys(extnMap[dep]).forEach(range => {
                if (subset(semver.Range(depRange), semver.Range(range))) {
                  let version = null
                  for (let index = 0; index < pkgs[dep].length; index++) {
                    const e = pkgs[dep][index]
                    if (semver.satisfies(e, depRange)) {
                      version = e
                      break
                    }
                  }
                  source = unpkg(
                    extnMap[dep][range].js.deployment,
                    dep,
                    version,
                  )
                }
              })
            }
            return source
          })
          .filter(e => e !== '')
      })
      .then(depSource => {
        const parentId = 'testList'
        const className = 'test-window'
        const parent = document.getElementById(parentId)
        // clear previous iframe
        while (parent.firstChild) {
          parent.removeChild(parent.firstChild)
        }
        Object.keys(solution.js).forEach(key => {
          const urls = depSource
            // .concat(['https://unpkg.com/moment@2.22.2/min/moment.min.js'])
            .concat(solution.js[key].map(e => unpkg(e, name, selectedVersion)))
            .join(',')
          const root = cutWindow(solution.root)
          const iframe = document.createElement('iframe')
          iframe.id = key
          iframe.src = `/test?urls=${urls}&root=${root}&name=${key}`
          iframe.className = className
          parent.appendChild(iframe)
        })
      })
  }

  function onSave() {
    let mapping = {
      ...getSolutionWithoutKey(),
      peerDependencies: depens,
    }
    mapping = reduction(mapping);
    console.log('save', getSolutionWithoutKey(), reduction(mapping))
    commit(name, range, mapping)
  }

  function onFilter(value) {
    if (!!value) {
      const newDisplaySource = source.filter(s => s.indexOf(value) !== -1)
      setDisplaySouce(newDisplaySource)
    }
  }

  const PeerDepdens = Object.keys(depens).map((k, i) => {
    return (
      <Leaf
        key={i}
        tKey={k}
        value={depens[k]}
        onAttrKeyChange={depensInterface.changeKey}
        onAttrValChange={depensInterface.changeValue}
        onRemove={depensInterface.remove}
      />
    )
  })
  return (
    <div className="container colum">
      <DragDropContext
        onDragStart={onDragStart}
        onDragUpdate={onDragUpdate}
        onDragEnd={onDragEnd}
      >
        <div className="card">
          <h3>包内容窗口</h3>
          <Form layout="vertical">
            <FormItem label="Version">
              <Select value={selectedVersion} onChange={onSelect}>
                {VersionOptions}
              </Select>
            </FormItem>
            <FormItem label="Fitler">
              <BlurInput onChange={onFilter} />
            </FormItem>
            <FormItem label="Files">
              <Droppable droppableId="source">
                {(provided, snapshot) => (
                  <div
                    className="v-scroll"
                    ref={provided.innerRef}
                    style={getListStyle(snapshot.isDraggingOver)}
                  >
                    {displaySource.map((item, index) => (
                      <Draggable
                        key={item}
                        draggableId={encode('source', item)}
                        index={index}
                      >
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            style={getItemStyle(
                              snapshot.isDragging,
                              provided.draggableProps.style,
                            )}
                          >
                            {item}
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </FormItem>
          </Form>
        </div>
        <div className="card">
          <h3>资源窗口</h3>
          <Form layout="vertical">
            <FormItem label="Version Range">
              <BlurInput value={range} onChange={x => setRange(x)} />
            </FormItem>
            <FormItem label="Root">
              <BlurInput value={solution.root} onChange={x => setRoot(x)} />
            </FormItem>
            <FormItem label="Peer Dependencies">
              {PeerDepdens}
              <Button block onClick={() => depensInterface.add('key', 'value')}>
                Add
              </Button>
            </FormItem>
            <FormItem label="Javascript">
              {JSSolutions}
              <Button onClick={onAddSolution('js')} block>
                Add
              </Button>
            </FormItem>
            <FormItem label="CSS">
              {CSSSolutions}
              <Button onClick={onAddSolution('css')} block>
                Add
              </Button>
            </FormItem>
          </Form>
        </div>
      </DragDropContext>
      <div className="card">
        <h3>测试窗口</h3>
        <div className="test-operation">
          <Button onClick={onRunTest}>Test</Button>
          <Button onClick={onSave}>Save</Button>
        </div>
        <div id="testList" className="test-group" />
      </div>
    </div>
  )
})
