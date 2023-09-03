import React,{ Component } from "react";
import JSONEditor, {JSONEditorOptions} from "jsoneditor";
import { Modal, message } from 'antd'
import { AddRecordDataBase } from '../../indexed/AddRecord'
import ContainerView from "../../bean/ContainerView.ts";
import RequestUtil from "../../tool/RequestUtil.ts";

interface IProps {
    json?: string,
    jsonObj: any,
    show: boolean,
    setShow: (show:boolean) => void

    view: ContainerView

    processResult: (type: string, data: any) => void
}

interface IData {
    json?: string,

    loading: boolean
}

export default class JsonShow extends Component<IProps, IData> {
    divRef = React.createRef<HTMLDivElement>()

    private jsoneditor: JSONEditor|undefined = undefined;

    constructor(props:any) {
        super(props)
        this.state = {
            json: "{}",
            loading: false
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
            onChange: this.handleChange,
            onValidationError: this.onError
        };

        if (!this.divRef.current) {
            return
        }
        const jsoneditor = new JSONEditor(this.divRef.current, options)
        jsoneditor.set(this.props.jsonObj)
        jsoneditor.expandAll()
        this.jsoneditor = jsoneditor
    }

    componentDidUpdate(prevProps: IProps) {
        if (this.props.jsonObj !== prevProps.jsonObj) {
            this.jsoneditor!.set(this.props.jsonObj)
            if (typeof this.jsoneditor!.expandAll === 'function') {
                this.jsoneditor!.expandAll()
            }
        }
    }

    componentDidMount() {
        this.initJsonEditer()
    }

    handleChange = () => {
    }

    onError = (val:any) => {
        if (val && val.length > 0) {
            console.error('onError:', val)
        }
    }

    addItems = () => {
        const jsonObj: any[] = this.jsoneditor!.get()
        this.setState({loading: true})
        const view = this.props.view
        RequestUtil.getOperationApi(view).createItem(jsonObj).then(result => {
            console.log('create items::', result)
            message.success('save items is successful!');
            this.props.setShow(false)
            this.props.processResult("create", result)
            const partitions:string[] = []
            for (const obj of jsonObj) {
                const partName = obj[view.partition!] as string
                if (partitions.indexOf(partName) < 0) {
                    partitions.push(partName)
                }
            }
            AddRecordDataBase.getInstance(view.id!).addRecord(jsonObj,
                `Added data with partitions [${partitions.join(",")}] ...`)
        }).finally(() => this.setState({loading: false}))
    }

    render() {
        return (
            <>
                <Modal
                    title="add item" forceRender
                    centered okText="Add" bodyStyle={{height: "70vh"}}
                    open={this.props.show}
                    onOk={() => this.addItems()}
                    onCancel={() => this.props.setShow(false)}
                    width={800} confirmLoading={this.state.loading}
                >
                    <div className="jsoneditor-react-container"
                         style={{width:"100%",height:"100%"}}
                         ref={this.divRef} />
                </Modal>

            </>
        )
    }
}