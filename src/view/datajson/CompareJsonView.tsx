import React,{ Component } from "react";
import JSONEditor, {JSONEditorOptions, JSONEditorMode} from "jsoneditor";
import { Modal, message } from 'antd'
import _ from 'lodash'

import './CompareJsonView.css'
import {UpdateRecordDataBase} from "../../indexed/UpdateRecord";
import ContainerView from "../../bean/ContainerView.ts";
import RequestUtil from "../../tool/RequestUtil.ts";

interface IProps {
    setShow?: (show:boolean) => void

    view: ContainerView

    processResult: (type: string, data: any) => void
}

interface IData {
    jsonL: any[],
    jsonR: any[],

    show: boolean,
    loading: boolean
}

export default class CompareJsonView extends Component<IProps, IData> {
    divRefL = React.createRef<HTMLDivElement>()
    divRefR = React.createRef<HTMLDivElement>()

    jsoneditorL: JSONEditor|undefined = undefined;
    jsoneditorR: JSONEditor|undefined = undefined;

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
            modes: ['tree', 'form', 'view'],
            mode: 'tree',
            history: true,
            search: true,
            mainMenuBar: true,
            statusBar: true,
            onChangeJSON: this.handleChange,
            onValidationError: this.onError,
            onClassName: this.onClassName,
            onModeChange: (oldMode: JSONEditorMode, newMode: JSONEditorMode) => {
                console.log("oldMode", oldMode)
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
            mode: 'view',
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

    onClassName = ({ path } : any) => {
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
        console.log('handleChange:', json)
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
            this.jsoneditorL?.expandAll()
            this.jsoneditorR?.expandAll()
        })
    }

    updateItem = () => {
        this.setState({loading: true})
        const view = this.props.view;
        RequestUtil.getOperationApi(view).updateItem(this.state.jsonR).then(result => {
            console.log('update items::', result)
            message.success('update items is successful!');
            this.setState({show: false})
            this.props.processResult("update", result)
            const partitions:string[] = []
            for (const obj of this.state.jsonR) {
                const partName = obj[view.partition!] as string
                if (partitions.indexOf(partName) < 0) {
                    partitions.push(partName)
                }
            }
            UpdateRecordDataBase.getInstance(view.id!).addRecord(this.state.jsonR, this.state.jsonL,
                `Modified data with partitions [${partitions.join(",")}] ...`)
        }).finally(() => this.setState({loading: false}))
    }

    render() {
        return (
            <>
                <Modal
                    title="update item" forceRender
                    centered okText="update" bodyStyle={{height: "70vh"}}
                    open={this.state.show} style={{maxWidth: "1600px"}}
                    onOk={() => this.updateItem()}
                    onCancel={() => this.setState({show: false})}
                    width="90%" confirmLoading={this.state.loading}
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