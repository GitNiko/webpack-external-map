import { useState, useEffect, useRef } from 'react'
import { withRouter } from 'next/router'

export default withRouter(function Test({router}) {
  const { root:rootName, urls, name } = router.query
  console.log('urls', urls)
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
  useEffect(() => {
    if(!urls) {
      return
    }
    setRoot(rootName)
    loadScript(urls.split(',')).then(() => { 
      if(window[rootName]) {
        setResult(true)
      } else {
        setResult(false)
      }
    }).catch(
      setResult(false)
    )
  }, [urls])
  return (
    <div>
      <div><label>solution name: {name}</label></div>
      <div>
        <label>
          root:
          window.{root}
        </label>
      </div>
      <div>test {result ? 'success' : 'fail'}</div>
    </div>
  )
})
