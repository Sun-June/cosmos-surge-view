import React,{ Component } from "react";
import JSONEditor, {JSONEditorOptions} from "jsoneditor";
import { Modal, message } from 'antd'
import { DeleteRecordDataBase } from '../../indexed/DeleteRecord'
import ContainerView from "../../bean/ContainerView.ts";
import RequestUtil from "../../tool/RequestUtil.ts";

interface IProps {
    setShow?: (show:boolean) => void

    view: ContainerView

    processResult: (type: string, data: any) => void
}

interface IData {
    jsonObj: any[],

    loading: boolean,
    show: boolean
}

export default class DeleteJsonView extends Component<IProps, IData> {
    divRef = React.createRef<HTMLDivElement>()

    jsoneditor: JSONEditor |undefined = undefined

    constructor(props:any) {
        super(props)
        this.state = {
            jsonObj: [],
            loading: false,
            show: false
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

    showDelete = (items: any[]) => {
        this.setState({jsonObj: items, show: true}, () => {
            this.jsoneditor?.set(this.state.jsonObj)
            if (typeof this.jsoneditor?.expandAll === 'function') {
                this.jsoneditor?.expandAll()
            }
        })
    }

    deleteItem = () => {
        const jsonObj: any[] = this.jsoneditor!.get()
        this.setState({loading: true})
        const view = this.props.view
        RequestUtil.getOperationApi(view).deleteItem(jsonObj).then(result => {
            message.success('delete items is successful!');
            this.setState({show: false})
            this.props.processResult("delete", result)

            const partitions:string[] = []
            for (const obj of jsonObj) {
                const partName = obj[view.partition!] as string
                if (partitions.indexOf(partName) < 0) {
                    partitions.push(partName)
                }
            }
            DeleteRecordDataBase.getInstance(view.id!).addRecord(jsonObj,
                `Deleted data with partitions [${partitions.join(",")}] ...`)
        }).finally(() => this.setState({loading: false}))
    }

    render() {
        return (
            <>
                <Modal
                    title="delete item" forceRender
                    centered okText="delete" bodyStyle={{height: "70vh"}}
                    open={this.state.show}
                    onOk={() => this.deleteItem()}
                    onCancel={() => this.setState({show: false})}
                    width="800px" confirmLoading={this.state.loading}
                >
                    <div className="jsoneditor-react-container"
                         style={{width:"100%",height:"100%"}}
                         ref={this.divRef} />
                </Modal>

            </>
        )
    }
}