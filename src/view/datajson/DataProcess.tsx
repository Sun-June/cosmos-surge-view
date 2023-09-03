import React,{ Component } from "react";
import JSONEditor, {JSONEditorOptions, EditableNode} from "jsoneditor";
import { Button, message } from 'antd';
import CompareJsonView from './CompareJsonView.tsx';
import DeleteJsonView from './DeleteJsonView.tsx';
import ContainerView from "../../bean/ContainerView.ts";

interface IProps {
    json?: string,
    jsonObj: any,

    view: ContainerView,

    processResult: (type: string, data: any) => void
}

interface IData {
    json?: string,
}

export default class DataProcess extends Component<IProps, IData> {
    divRef = React.createRef<HTMLDivElement>()
    comRef = React.createRef<CompareJsonView>()
    deleteRef = React.createRef<DeleteJsonView>()

    private jsoneditor: JSONEditor|undefined = undefined;

    constructor(props:any) {
        super(props)
        this.state = {
            json: "{}",
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
            onValidationError: this.onError,
            onEditable: node => {
                try {
                    const partation = this.getPartition()
                    const editNode = node as EditableNode
                    if (editNode.field === 'id' || (partation !== '' && editNode.field === partation)) {
                        return false
                    }
                } catch (error) {
                    console.error("edit has error", error)
                }
                return true
            }
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

    getPartition = (): string => {
        return this.props.view.partition
    }

    onError = (val:any) => {
        if (val && val.length > 0) {
            console.error('onError:', val)
        }
    }

    onUpdateItem = () => {
        const diffAny:Array<any> = []
        const sourceAny:Array<any> = []
        const source = this.props.jsonObj as Array<any>
        const now = this.jsoneditor!.get() as Array<any>
        const nowMap = new Map()
        now.forEach(nowObj => {
            nowMap.set(nowObj['id'], nowObj)
        })
        source.forEach((obj) => {
            const nowObj = nowMap.get(obj['id'])
            if (nowObj && JSON.stringify(obj) !== JSON.stringify(nowObj)) {
                sourceAny.push(obj)
                diffAny.push(nowObj)
            }
        })
        console.log('diff::', diffAny)
        console.log('source::', sourceAny)
        if (diffAny.length > 0) {
            console.log('the comRef::', this.comRef)
            this.comRef.current?.showCompate(sourceAny, diffAny)
        } else {
            message.open({
                type: 'warning',
                content: 'Please modify the data first before proceeding.',
            });
        }
    }

    onDeleteItem = () => {
        const source = this.props.jsonObj as Array<any>
        const now = this.jsoneditor!.get() as Array<any>
        const nowMap = new Map()
        now.forEach(nowObj => {
            nowMap.set(nowObj['id'], nowMap)
        })
        const deleteObj:Array<any> = []
        source.forEach(obj => {
            const nowObj = nowMap.get(obj['id'])
            if (!nowObj) {
                deleteObj.push(obj)
            }
        })
        if (deleteObj.length > 0) {
            this.deleteRef.current?.showDelete(deleteObj)
        } else {
            message.open({
                type: 'warning',
                content: 'Please delete at least one JSON data entry before proceeding.',
            });
        }
    }

    render() {
        return (
            <>
                <CompareJsonView view={this.props.view} processResult={this.props.processResult} ref={this.comRef} ></CompareJsonView>
                <DeleteJsonView view={this.props.view} processResult={this.props.processResult} ref={this.deleteRef} ></DeleteJsonView>
                <div className="jsoneditor-react-container"
                     style={{width:"100%",height:"calc(100% - 100px)"}}
                     ref={this.divRef} >
                        <span style={{float:"right", zIndex: 2, top: "65px", right:"20px", position: 'relative' }}>
                            <Button type="primary" onClick={this.onUpdateItem}>
                            Update items
                            </Button>
                            <Button type="primary" onClick={this.onDeleteItem} danger>
                              Delete items
                            </Button>
                        </span>

                </div>
            </>
        )
    }
}