import { useState, useEffect, useRef } from 'react'
// import { resolve } from 'uri-js'

export default function Test({}) {
  const [root, setRoot] = useState('')
  const [result, setResult] = useState(false)
  function loadScript(urls) {
    const loads = urls.map(
      url =>
        new Promise((resolve, reject) => {
          const script = document.createElement('script')
          script.src = url
          script.async = true
          script.onload = () => resolve(true)
          script.onerror = () => reject(false)
          document.body.appendChild(script)
        }),
    )
    return Promise.all(loads)
  }
  function receiveMessage(event) {
    const { urls, root:newRoot = '' } = event.data
    if(!urls) {
      return
    }
    console.log(event);
    setRoot(newRoot)
    loadScript(urls).then(() => { 
      if(window[newRoot]) {
        setResult(true)
      } else {
        setResult(false)
      }
    }).catch(
      setResult(false)
    )
  }
  function refresh() {
    window.location.reload()
  }
  useEffect(() => {
    window.addEventListener('message', receiveMessage, false)
    window.parent.postMessage({
      type: '@editor/iframe_ready',
      iframeId: window.frameElement.id
    })
    return function cleanup() {
      window.removeEventListener('message', receiveMessage)
    }
  })
  return (
    <div>
      <div>
        <label>
          root:
          window.{root}
        </label>
      </div>
      <div>test {result ? 'success' : 'fail'}</div>
    </div>
  )
}
