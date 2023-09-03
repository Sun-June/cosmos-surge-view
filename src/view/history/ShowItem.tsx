import React,{ Component } from "react";
import JSONEditor, {JSONEditorOptions} from "jsoneditor";
import { Modal } from 'antd'

interface IProps {
  setShow?: (show:boolean) => void
}

interface IData {
  jsonObj: any[],

  loading: boolean,
  show: boolean,
  type: string
}

export default class JsonShow extends Component<IProps, IData> {
  divRef = React.createRef<HTMLDivElement>()

  jsoneditor?: JSONEditor|undefined = undefined

  constructor(props:any) {
    super(props)
    this.state = {
      jsonObj: [],
      loading: false,
      show: false,
      type: ''
    }
  }

  initJsonEditer = () => {
    if (this.jsoneditor) {
      return;
    }

    const options:JSONEditorOptions = {
      modes: ['text', 'code', 'tree', 'form', 'view'],
      mode: 'tree',
      history: true,
      search: true,
      mainMenuBar: true,
      statusBar: true,
      navigationBar: true,
      onChangeJSON: this.handleChange,
      onValidationError: this.onError
    };
 
    if (!this.divRef.current) {
      return
    }
    const jsoneditor = new JSONEditor(this.divRef.current, options)
    jsoneditor.set(this.state.jsonObj)
    jsoneditor.expandAll()
    this.jsoneditor = jsoneditor
  }

  componentDidMount() {
    this.initJsonEditer()
  }

  handleChange = (json: any) => {
    console.log('handleChange:', json)
  }

  onError = (val:any) => {
    if (val && val.length > 0) {
      console.error('onError:', val)
    }
  }

  showHistoryData = (items: any[], type: string) => {
    this.setState({jsonObj: items, show: true, type}, () => {
      this.jsoneditor?.set(this.state.jsonObj)
      if (typeof this.jsoneditor?.expandAll === 'function') {
        this.jsoneditor?.expandAll()
      }
    })
  }

  render() {
    return (
      <>
      <Modal
          title={`${this.state.type} item`} forceRender
          centered bodyStyle={{height: "70vh"}}
          open={this.state.show} footer={null}
          onCancel={() => this.setState({show: false})}
          width="800px"
        >
        <div className="jsoneditor-react-container" 
          style={{width:"100%",height:"100%"}}
          ref={this.divRef} />
      </Modal>
       
      </>
    )
  }
}