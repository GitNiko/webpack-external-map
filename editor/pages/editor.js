import { useState, useEffect, useRef } from 'react'
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd'
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

const getExtension = str => str.split('.').pop()
// a*b*c*d ...
const encode = (...args) => args.reduce((acc, x) => (acc = acc + '*' + x))
const decode = str => str.split('*')

const BlurInput = ({ value, onChange = noop }) => {
  const [state, setState] = useState(value)
  //  const onValueChange
  useEffect(
    () => {
      setState(value)
    }, [value]
  )
  return (
    <input
      onChange={ev => setState(ev.target.value)}
      value={state}
      onBlur={() => onChange(state)}
    />
  )
}
const SourceCard = ({
  source = [],
  solutionName = '',
  type,
  droppableId,
  onDelete,
  onSolutionNameChange = noop,
}) => {
  const [name, setName] = useState(solutionName)
  const onNameChange = ev => {
    setName(ev.target.value)
    // onSolutionNameChange(ev.target.value, theKey)
  }
  const onClick = ev => {
    onDelete(droppableId)
  }
  return (
    <div>
      <div>
        <label>Solution Name:</label>
        <input
          value={name}
          onChange={onNameChange}
          onBlur={() => onSolutionNameChange(droppableId, name)}
        />
        <button onClick={onClick}>Delete</button>
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

const getListStyle = isDraggingOver => ({
  background: isDraggingOver ? 'lightblue' : 'lightgrey',
  padding: grid,
  width: 250,
})

const grid = 8

const getItemStyle = (isDragging, draggableStyle) => ({
  // some basic styles to make the items look a bit nicer
  userSelect: 'none',
  padding: grid * 2,
  margin: `0 0 ${grid}px 0`,

  // change background colour if dragging
  background: isDragging ? 'lightgreen' : 'grey',

  // styles we need to apply on draggables
  ...draggableStyle,
})

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
  const calcPrimaryKey = state => {
    const keysToPrimary = obj =>
      Object.keys(obj).reduce((acc, x, i) => {
        acc[i] = x
        return acc
      }, {})
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
    },
  ]
}

export default withRouter(({ router }) => {
  const { name, range: defaultRange } = router.query

  const [versions, setVersions] = useState([])
  const [selectedVersion, setSelectedVersion] = useState('')
  const [source, setSource] = useState([])
  const [range, setRange] = useState(defaultRange)

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
          return setSource(
            list
              .map(e => e.path)
              .filter(
                path =>
                  getExtension(path) === 'js' || getExtension(path) === 'css',
              ),
          )
        })
      } else {
        // clear
        setSource([])
      }
    },
    [selectedVersion],
  )

  // on version selected
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
    },
  ] = useSolution()
  const onAddSolution = create
  const onSolutionNameChange = type => (key, newName) => {
    rename(type)(decode(key).pop(), newName)
  }
  const onSolutionDelete = type => key => {
    del(type)(decode(key).pop())
  }
  const onDragStart = ev => {
    /*...*/
  }
  const onDragUpdate = () => {
    /*...*/
  }
  const onDragEnd = result => {
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
    // not need change for source
    if (destination.droppableId === 'source') {
      return
    }
    // not need change between solutions
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


  // test window
  const onRunTest = () => {
    console.log(solution)
  }

  return (
    <div className="container">
      <DragDropContext
        onDragStart={onDragStart}
        onDragUpdate={onDragUpdate}
        onDragEnd={onDragEnd}
      >
        <div className="source">
          <h3>包内容窗口</h3>
          <select defaultValue={selectedVersion} onChange={onSelect}>
            {VersionOptions}
          </select>
          <Droppable droppableId="source">
            {(provided, snapshot) => (
              <div
                ref={provided.innerRef}
                style={getListStyle(snapshot.isDraggingOver)}
              >
                {source.map((item, index) => (
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
        </div>
        <div>
          <h3>资源窗口</h3>
          <div>
            <label>Version Range:</label>
            <BlurInput value={range} onChange={x => setRange(x)} />
          </div>
          <div>
            <label>root:</label>
            <BlurInput value={solution.root} onChange={x => setRoot(x)} />
          </div>
          <h4>Javascript</h4>
          {JSSolutions}
          <button onClick={onAddSolution('js')}>Add</button>
          <h4>Css</h4>
          {CSSSolutions}
          <button onClick={onAddSolution('css')}>Add</button>
        </div>
      </DragDropContext>
      <div>
        <h3>测试窗口</h3>
        <div><button onClick={onRunTest}>Test</button></div>
      </div>
    </div>
  )
})
