import React,{ Component } from "react";
import JSONEditor, {JSONEditorOptions, JSONEditorMode} from "jsoneditor";
import { Modal } from 'antd'
import _ from 'lodash'

import '../datajson/CompareJsonView.css'

interface IProps {
  setShow?: (show:boolean) => void
}

interface IData {
  jsonL: any[],
  jsonR: any[],

  show: boolean,
  loading: boolean
}

export default class Json extends Component<IProps, IData> {
  divRefL = React.createRef<HTMLDivElement>()
  divRefR = React.createRef<HTMLDivElement>()

  jsoneditorL: JSONEditor|undefined = undefined
  jsoneditorR: JSONEditor|undefined = undefined

  constructor(props:any) {
    super(props)
    this.state = {
      jsonL: [],
      jsonR: [],
      show: false,
      loading: false
    }
  }

  initJsonEditer = () => {
    if (this.jsoneditorR) {
      return;
    }
    const options:JSONEditorOptions = {
      modes: ['text', 'code', 'tree', 'form', 'view'],
      mode: 'tree',
      history: true,
      search: true,
      mainMenuBar: true,
      statusBar: true,
      onChangeJSON: this.handleChange,
      onValidationError: this.onError,
      onClassName: this.onClassName,
      onModeChange: (oldMode: JSONEditorMode, newMode: JSONEditorMode) => {
        console.log("oldMode:", oldMode)
        if (newMode === 'tree' || newMode === 'form' || newMode === 'preview') {
          setTimeout(() => {
            this.addScrollListener()
            if (this.jsoneditorR && this.jsoneditorR.expandAll) {
              this.jsoneditorR.expandAll()
            }
          }, 500)
        }
      }
    };
 
    if (!this.divRefR.current) {
      return
    }
    const jsoneditor = new JSONEditor(this.divRefR.current, options)
    jsoneditor.set(this.state.jsonL)
    jsoneditor.expandAll()
    this.jsoneditorR = jsoneditor

  }

  initViewEditer = () => {
    if (this.jsoneditorL) {
      return;
    }
    const options:JSONEditorOptions = {
      modes: ['text', 'code', 'tree', 'form', 'view'],
      mode: 'tree',
      search: true,
      mainMenuBar: true,
      statusBar: true,
      onClassName: this.onClassName
    };
 
    if (!this.divRefL.current) {
      return
    }
    const jsoneditor = new JSONEditor(this.divRefL.current, options)
    jsoneditor.set(this.state.jsonR)
    jsoneditor.expandAll()
    this.jsoneditorL = jsoneditor
  }

  onClassName = ({ path} : any) => {
    const leftValue = _.get(this.state.jsonL, path)
    const rightValue = _.get(this.state.jsonR, path)

    return _.isEqual(leftValue, rightValue)
      ? 'the_same_element'
      : 'different_element'
  }

  componentDidMount() {
    this.initJsonEditer()
    this.initViewEditer()
    this.addScrollListener()
  }

  addScrollListener = () => {
    const right = this.divRefR.current?.querySelector('.jsoneditor-tree')
    if (right) {
      right.addEventListener('scroll', () => {
        const left = this.divRefL.current?.querySelector('.jsoneditor-tree')
        if (left) {
          left.scrollTop = right.scrollTop
        }
      })
    }
  }

  handleChange = (json: any) => {
    this.setState({
      jsonR: json
    })
    this.jsoneditorL?.refresh()
  }

  onError = (val:any) => {
    if (val && val.length > 0) {
      console.error('onError:', val)
    }
  }

  showCompate = (left: any[], right: any[]) => {
    this.setState({jsonL: left, jsonR: right, show: true}, () => {
      this.jsoneditorL?.set(this.state.jsonL)
      this.jsoneditorR?.set(this.state.jsonR)
      if (typeof this.jsoneditorL?.expandAll === 'function') {
        this.jsoneditorL?.expandAll()
      }
      if (typeof this.jsoneditorR?.expandAll === 'function') {
        this.jsoneditorR?.expandAll()
      }
    })
  }

  render() {
    return (
      <>
      <Modal
          title="update item" forceRender
          centered okText="update" bodyStyle={{height: "70vh"}}
          open={this.state.show} footer={null}
          onCancel={() => this.setState({show: false})}
          width="90%" style={{maxWidth: "1600px"}}
        >
        <div className="compare-main" >
          <div className="containerLeft"  ref={this.divRefL} />
          <div className="containerRight" ref={this.divRefR} />
        </div>
      </Modal>
        
       
      </>
    )
  }
}