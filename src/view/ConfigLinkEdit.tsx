import React, { Component } from "react";
import { Modal, Form, Input, Button, FormInstance, message} from 'antd'
import ConfigLink from "../bean/ConfigLink";
import RequestUtil from "../tool/RequestUtil";

const { TextArea } = Input;

const layout = {
    labelCol: { span: 4 },
    wrapperCol: { span: 18 },
};
const tailLayout = {
    wrapperCol: { offset: 8, span: 16 },
};

interface IProps {
    show: boolean
    setShow: (show:boolean) => void
    updateConfig?: (config:ConfigLink) => void
    addConfig?: (config:ConfigLink) => void
    config?: ConfigLink
}

interface IState {
    config: ConfigLink,
    saveLoading: boolean,
    testLoading: boolean
}

export default class ConfigLinkEdit extends Component<IProps, IState> {
    formRef = React.createRef<FormInstance>();

    constructor(props: any) {
        super(props)
        this.state = {
            config: {id: "", name: "", connectionString: ""},
            saveLoading: false,
            testLoading: false
        }
    }

    componentDidMount() {

    }

    componentDidUpdate(prevProps: IProps) {
        if (this.props.show && !prevProps.show) {
            const form = this.formRef.current!
            if (this.props.config) {
                form.setFieldsValue(this.props.config)
            } else {
                console.log('form.resetFields')
                form.resetFields()
            }
        }
    }

    formFinish = (values: any) => {
        console.log('form value:', values)
        const config = values as ConfigLink
        this.setState({saveLoading: true})
        if (config.id && config.id.trim() !== "") { // update
            RequestUtil.configApi.updateConfig(config).then(newConfig => {
                this.props.setShow(false);
                this.props.updateConfig!(newConfig);
                message.success('save config is successful!');
            }).finally(() => this.setState({saveLoading: false}))
        } else {
            config.id = new Date().getTime().toString();
            RequestUtil.configApi.createConfig(config).then(newConfig => {
                this.props.setShow(false);
                this.props.addConfig!(newConfig)
                message.success('save config is successful!');
            }).finally(() => this.setState({saveLoading: false}))
        }
    }

    onTest = () => {
        const form = this.formRef.current!
        const config = form.getFieldsValue() as ConfigLink
        this.setState({testLoading: true})
        RequestUtil.configApi.testConfig(config).then(result => {
            console.log('testLink...', result)
            message.success('Test link is successful!');
        }).finally(() => {
            this.setState({testLoading: false})
        })
    }

    onReset = () => {
        this.formRef.current!.resetFields();
    }

    render() {
        return (
            <>
                <Modal
                    title={ this.state.config.name === "" ? "create" : this.state.config.name}
                    centered okText="Save" confirmLoading={this.state.saveLoading}
                    open={this.props.show}
                    onOk={() => this.formRef.current!.submit()}
                    onCancel={() => this.props.setShow(false)}
                    width={900}
                >
                    <Form {...layout} ref={this.formRef} initialValues={this.state.config}
                          name="control-hooks" onFinish={this.formFinish}>
                        <Form.Item hidden name="id" label="id" >
                            <Input />
                        </Form.Item>
                        <Form.Item name="name" label="name" rules={[{ required: true }]}>
                            <Input />
                        </Form.Item>
                        <Form.Item name="connectionString" label="connectionString" rules={[{ required: true }]}>
                            <TextArea rows={3} />
                        </Form.Item>

                        <Form.Item {...tailLayout}>

                            <Button htmlType="button" onClick={this.onTest} loading={this.state.testLoading} >
                                Test
                            </Button>
                            <Button htmlType="button" onClick={this.onReset} type="dashed" >
                                Reset
                            </Button>

                            <Button type="primary" htmlType="submit" style={{display: 'none'}} >
                                Submit
                            </Button>
                        </Form.Item>
                    </Form>
                </Modal>
            </>
        )
    }
}