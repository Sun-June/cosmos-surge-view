import React,{ Component } from "react";
import { Drawer, Tabs } from 'antd'

import RecordTool from "../../indexed/RecordTool";

import HistoryTimeLine from './HistoryTimeLine'
import ShowItem from './ShowItem'
import ShowUpdateItem from './ShowUpdateItem'
import ContainerView from "../../bean/ContainerView.ts";

interface IProps {
  setShow?: (show:boolean) => void

  view: ContainerView
}

interface IData {
  show: boolean,
  loading: boolean,
  type: string,
  linkId: string
}

export default class History extends Component<IProps, IData> {

  queryRef = React.createRef<HistoryTimeLine>()
  addRef = React.createRef<HistoryTimeLine>()
  deleteRef = React.createRef<HistoryTimeLine>()
  updateRef = React.createRef<HistoryTimeLine>()

  showRef = React.createRef<ShowItem>()
  showUpdateRef = React.createRef<ShowUpdateItem>()
  
  constructor(props:any) {
    super(props)
    this.state = {
      show: false,
      loading: false,
      type: 'query',
      linkId: ''
    }
  }

  componentDidMount() {
  }

  showDrawer = () => {
    RecordTool.reset()
    this.setState({show: true}, () => {
      this.typeForStartQuery(this.state.type)
    })
  }

  typeChange = (type:string) => {
    this.setState({type}, () => {
      setTimeout(() => {
        this.typeForStartQuery(type)
      }, 200)
    })
  }

  typeForStartQuery = (type:string) => {
    switch (type) {
      case 'query':
            this.queryRef.current?.startQuery()
            break
      case 'delete': 
            this.deleteRef.current?.startQuery()
            break
      case 'update': 
            this.updateRef.current?.startQuery()
            break
      case 'add': 
            this.addRef.current?.startQuery()
            break
    }
  }

  onClose = () => {
    this.setState({show: false})
  }

  showHistoryData = (items: any[], type: string) => {
    this.showRef.current?.showHistoryData(items, type)
  }

  showUpdateHistoryData = (old: any[], items: any[]) => {
    this.showUpdateRef.current?.showCompate(old, items)
  }

  render() {
    return (
      <>
      {/*<Button type="dashed" style={{color: 'chocolate'}} ghost onClick={this.showDrawer}>*/}
      {/*  history*/}
      {/*</Button>*/}
      <Drawer width="736px" title="History Info" placement="right" onClose={this.onClose} open={this.state.show}>

        <ShowItem ref={this.showRef} ></ShowItem>
        <ShowUpdateItem ref={this.showUpdateRef} ></ShowUpdateItem>

        <Tabs defaultActiveKey="query" type="card" 
              activeKey={this.state.type}
              onChange={(activeKey) => this.typeChange(activeKey)}
              style={{height: "100%"}} centered>
          <Tabs.TabPane tab="query" key="query">
            <HistoryTimeLine type="query" view={this.props.view} ref={this.queryRef} ></HistoryTimeLine>
          </Tabs.TabPane>
          <Tabs.TabPane tab="delete" key="delete">
            <HistoryTimeLine type="delete" view={this.props.view} ref={this.deleteRef} showItem={this.showHistoryData} ></HistoryTimeLine>
          </Tabs.TabPane>
          <Tabs.TabPane tab="update" key="update">
            <HistoryTimeLine type="update" view={this.props.view} ref={this.updateRef} showUpdateItem={this.showUpdateHistoryData} ></HistoryTimeLine>
          </Tabs.TabPane>
          <Tabs.TabPane tab="add" key="add">
            <HistoryTimeLine type="add" view={this.props.view} ref={this.addRef} showItem={this.showHistoryData} ></HistoryTimeLine>
          </Tabs.TabPane>
        </Tabs>
      </Drawer>
       
      </>
    )
  }
}