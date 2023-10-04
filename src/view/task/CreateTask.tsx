import React, { Component } from "react";
import {Modal, Form, Input, FormInstance, TreeSelect, Radio} from 'antd'
import ImportTask from "../../bean/ImportTask.ts";
import {DefaultOptionType} from "rc-tree-select/lib/TreeSelect";
import RequestUtil from "../../tool/RequestUtil.ts";
import ContainerView from "../../bean/ContainerView.ts";
import MenuInfo from "../../bean/MenuInfo.ts";


const layout = {
    labelCol: { span: 8 },
    wrapperCol: { span: 16 },
};

interface IProps {
    createAfter: (task: ImportTask) => void
}

interface IState {
    show: boolean
    saveLoading: boolean,
    initLoading: boolean,
    task: ImportTask,
    treeData: DefaultOptionType[]
}

export default class CreateTask extends Component<IProps, IState> {
    formRef = React.createRef<FormInstance>();

    viewMap: Map<string, ContainerView> = new Map<string, ContainerView>();

    constructor(props: any) {
        super(props)
        this.state = {
            show: false,
            saveLoading: false,
            initLoading: false,
            treeData: [],
            task: {id: "", name: "", type: "upsert", sql: "", status: "init", fromId: "", toId: ""}
        }
    }

    componentDidMount() {

    }

    showCreate = (view: ContainerView, sql: string, linkIds: string[]) => {
        const task: ImportTask = {id: "",
            name: `[${view.linkName}/${view.databaseId}/${view.name}] to `,
            type: "upsert",
            sql, status: "init", fromId: view.id, toId: ""}
        if (this.formRef && this.formRef.current) {
            this.formRef.current!.setFieldsValue(task);
        }
        this.setState({task, show: true, treeData: [], saveLoading: true}, () => {
            this.initTreeData(linkIds, view.id).then(() => {
                this.setState({saveLoading: false})
            })
        })
    }

    initTreeData = async (linkIds: string[], skipId: string) => {
        this.setState({initLoading: true})
        this.viewMap.clear()
        const treeData:DefaultOptionType[] = []
        for (const linkId of linkIds) {
            let info: MenuInfo
            try {
                info = await RequestUtil.menuApi.getMenu(linkId)
            } catch (e) {
                continue;
            }
            const node: DefaultOptionType = {title: info.name, value: info.id, children: [], selectable: false}
            for (const databaseId of info.databaseIds) {
                const databaseNode: DefaultOptionType = {label: databaseId, value: info.id + databaseId, children: [], selectable: false}
                const views = info.containerMap.get(databaseId)
                if (views && views.length > 0) {
                    for (const view of views) {
                        if (view.id !== skipId) {
                            databaseNode.children!.push({label: view.name, value: view.id})
                        }
                        this.viewMap.set(view.id, view)
                    }
                    if (databaseNode.children!.length > 0) {
                        node.children!.push(databaseNode)
                    }
                }
            }
            if (node.children!.length > 0) {
                treeData.push(node)
            }
        }
        this.setState({treeData}, () => {
            this.setState({initLoading: false})
        })
    }

    formFinish = (values: any) => {
        console.log('form value:', values)
        const task = values as ImportTask
        task.total = 0;
        task.process = 0;
        task.error = 0;
        task.skip = 0;
        task.start = new Date()

        const toView = this.viewMap.get(task.toId)
        if (toView) {
            task.name += `[${toView.linkName}/${toView.databaseId}/${toView.name}]`
        }

        this.setState({saveLoading: true})
        RequestUtil.taskApi.createTask(task).then(result => {
            console.log(`create task: ${result}`)
            this.props.createAfter(result)
            this.setState({show: false})
        }).finally(() => {
            this.setState({saveLoading: false})
        })

    }

    render() {
        return (
            <>
                <Modal
                    title={ "add import task"}
                    centered okText="Do" confirmLoading={this.state.saveLoading}
                    open={this.state.show}
                    onOk={() => this.formRef.current!.submit()}
                    onCancel={() => this.setState({show: false})}
                    width={900}
                >
                    <Form {...layout} ref={this.formRef} initialValues={this.state.task}
                          name="control-hooks" onFinish={this.formFinish}>
                        <Form.Item hidden name="id" label="id" >
                            <Input />
                        </Form.Item>
                        <Form.Item hidden name="name" label="name" >
                            <Input />
                        </Form.Item>
                        <Form.Item hidden name="status" label="status" >
                            <Input />
                        </Form.Item>
                        <Form.Item hidden name="sql" label="sql" >
                            <Input />
                        </Form.Item>
                        <Form.Item hidden name="fromId" label="fromId" >
                            <Input />
                        </Form.Item>
                        <Form.Item name="toId" label="toId" rules={[{ required: true }]} >
                            <TreeSelect
                                showSearch disabled={this.state.initLoading}
                                loading={this.state.initLoading}
                                style={{ width: '100%' }}
                                dropdownStyle={{ maxHeight: 400, overflow: 'auto' }}
                                placeholder="Please select"
                                allowClear
                                treeDefaultExpandAll
                                treeData={this.state.treeData}
                            />
                        </Form.Item>

                        <Form.Item name="type" label="Handling duplicate data" rules={[{ required: true }]}>
                            <Radio.Group>
                                <Radio value="upsert"> upsert </Radio>
                                <Radio value="skip"> skip </Radio>
                            </Radio.Group>
                        </Form.Item>

                    </Form>
                </Modal>
            </>
        )
    }
}