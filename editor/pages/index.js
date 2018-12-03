import React, { useState, useEffect } from 'react'
import { Layout, Input } from 'antd'
import Link from 'next/link'
import {getExternMapJson, getPackageInfo, searchPackage} from '../api/request'
import 'antd/dist/antd.css'

const { Header, Footer, Content } = Layout
const Search = Input.Search

// export default class Home extends Component {
//   constructor(props) {
//     super(props)
//     this.state = {
//       versions:[],
//       packages:[],
//       total: 0,
//     }
//   }
//   componentDidMount() {
//     getExternMapJson().then((result) => {
//       console.log(result)
//     }).catch((err) => {
      
//     });
//     getPackageInfo().then(res => console.log(res))
//   }
//   onSearch = (value) => {
//     searchPackage(value).then(data => {
//       this.setState({
//         packages: data.objects,
//         total: data.total
//       })
//     })
//   }
//   render() {
//     const {packages} = this.state
//     const Packages = packages.map((e, i) => {
//       return (
//         <div key={i}>{e.package.name }</div>
//       )
//     })
//     return (
//       <Layout>
//         <Header>
//           <Search
//             placeholder="Search packages"
//             enterButton="Search"
//             size="large"
//             onSearch={this.onSearch}
//           />
//         </Header>
//         <Content>
//           {Packages}
//         </Content>
//       </Layout>
//     )
//   }
// }

export default function Home() {
  const [packages, setPackages] = useState([])
  const [total, setTotal] = useState(0)
  
  useEffect(() => {
    
  })
  const onSearch = (value) => {
    searchPackage(value).then(data => {
      setPackages(data.objects)
      setTotal(data.total)
    })
  }
  const Packages = packages.map((e, i) => {
    return (
      <div key={i}><Link href={{ pathname: '/version', query: { name: e.package.name } }}><a>{e.package.name }</a></Link></div>
    )
  })
  return (
    <Layout>
      <Header>
        <Search
          placeholder="Search packages"
          enterButton="Search"
          size="large"
          onSearch={onSearch}
        />
      </Header>
      <Content>
        {Packages}
      </Content>
    </Layout>
  )
}