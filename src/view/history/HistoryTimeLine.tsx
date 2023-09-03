import { Component } from "react";
import {Button, Timeline, Tooltip} from 'antd'
// import CodeMirror, { EditorView} from '@uiw/react-codemirror';
// import { sql } from '@codemirror/lang-sql';
import AceEditor from "react-ace";
import "ace-builds/src-noconflict/mode-mysql";
import "ace-builds/src-noconflict/theme-tomorrow";
import "ace-builds/src-noconflict/ext-language_tools"

import './HistoryTimeLine.css'

import RecordTool, {TimeData} from "../../indexed/RecordTool";
import ContainerView from "../../bean/ContainerView.ts";
import {RedoOutlined} from "@ant-design/icons";

interface IProps {
  setShow?: (show:boolean) => void
  type: string,
  showItem?: (items: any[], type: string) => void
  showUpdateItem?: (old: any[], items: any[]) => void

  view: ContainerView
}

interface IData {
  haveNext: boolean,
  loading: boolean,
  timeLines: TimeData[]
}

export default class HistoryTimeLine extends Component<IProps, IData> {
  
  constructor(props:any) {
    super(props)
    this.state = {
      haveNext: false,
      loading: false,
      timeLines: []
    }
  }

  componentDidMount() {
  }

  startQuery = () => {
    this.setState({timeLines: [], haveNext: false}, () => {
      RecordTool.query(this.props.type, this.props.view.id).then(result => {
        this.setState({timeLines: result, haveNext: result.length === 10}, () => {
          console.log('now timeLines::', this.state.timeLines)
        })
      })
    })
  }

  queryNext = () => {
    RecordTool.queryNext(this.props.type, this.props.view.id).then(result => {
      const arr = this.state.timeLines.concat(result)
      this.setState({timeLines: arr, haveNext: result.length === 10})
    })
  }

  

  showHistory = (record: TimeData) => {
    const type = record.type === 'delete' ? 'delete' : 'add'

    RecordTool.getItems(type, this.props.view.id, record.id).then(items => {
      this.props.showItem!(items, type)
    })
  }

  showUpdateHistory = (record: TimeData) => {
    RecordTool.getUpdateItems(this.props.view.id, record.id).then(updateRecord => {
      this.props.showUpdateItem!(updateRecord.oldItems, updateRecord.items)
    })
  }

  render() {
    return (
      <>
        <Tooltip placement="top" color={'#108ee9'} title={"Refresh the history list."}>
          <Button type="link" icon={<RedoOutlined />} onClick={this.startQuery} ></Button>
        </Tooltip>
      <Timeline mode="left">
        {
          this.state.timeLines.map((record) => {
            return <Timeline.Item key={record.id} label={record.time}>
              {/* {record.des} */}
              <AceEditor
                mode="mysql" theme="tomorrow"
                width="100%" height="50px" style={{top: "5px", right: "5px"}}
                wrapEnabled={true} readOnly={true} 
                value={record.des}
                name="UNIQUE_ID_OF_DIV"
                editorProps={{ $blockScrolling: true }}
              />
              { 
              (this.props.type === 'add' || this.props.type === 'delete') ? 
              <Button type="link" onClick={() => this.showHistory(record)} >details...</Button> : 
                ( 
                  this.props.type === 'update' ? 
                  <Button type="link" onClick={() => this.showUpdateHistory(record)} >update details...</Button> : null
                )
              }
            </Timeline.Item>
          })
        }
        
        {
          this.state.haveNext ? 
            <Timeline.Item>
              <Button onClick={this.queryNext} type="link">load more...</Button>
            </Timeline.Item> 
            : null
        }
        
      </Timeline>
       
      </>
    )
  }
}