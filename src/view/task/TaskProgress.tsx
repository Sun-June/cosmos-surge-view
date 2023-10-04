import { Component } from "react";
import {Row, Col, Progress, Statistic, Tag, Card, Layout, Button, Popconfirm, Space} from 'antd'
import { PlayCircleOutlined,PauseCircleOutlined, StopOutlined } from "@ant-design/icons";


import ImportTask from "../../bean/ImportTask.ts";
import Sider from "antd/es/layout/Sider";
import {Content} from "antd/es/layout/layout";
import AceEditor from "react-ace";
import dayjs from "dayjs";
import RequestUtil from "../../tool/RequestUtil.ts";

interface IProps {
    task: ImportTask,

    key:string
}

interface IData {
    loading: boolean
}

export default class TaskProgress extends Component<IProps, IData> {

    constructor(props:any) {
        super(props)
        this.state = {
            loading: false
        }
    }

    componentDidMount() {
    }

    getPercent = (): number => {
        let result = 1.0;
        if (this.props.task.total! > 0) {
            result = this.props.task.process! * 100 / this.props.task.total!
        }
        return parseFloat(result.toFixed(2))
    }

    getDate(date: Date|undefined):string {
        if (date) {
            return dayjs(date).format('YYYY-MM-DD HH:mm:ss')
        }
        return ""
    }

    changeStop = () => {
        this.setState({loading: true})
        RequestUtil.taskApi.stopTask(this.props.task).finally(() => {
            setTimeout(() => {
                this.setState({loading: false})
            }, 1000)
        })
    }

    cancel = () => {
        this.setState({loading: true})
        RequestUtil.taskApi.cancelTask(this.props.task).finally(() => {
            setTimeout(() => {
                this.setState({loading: false})
            }, 1000)
        })
    }


    render() {
        return (
            <>
                <Card size="small" title={this.props.task.name}
                      extra={
                          <Space>
                              {
                                  this.props.task.stop ? <Tag color="#108ee9">task paused...</Tag> : ""
                              }
                              {
                                  this.props.task.cancel ? <Tag color="#f50">canceled</Tag> : ""
                              }
                              <Button disabled={this.props.task.status==="end"} type="primary"
                                       icon={this.props.task.stop ? <PlayCircleOutlined /> : <PauseCircleOutlined /> }
                                      loading={this.state.loading} onClick={this.changeStop} >
                              </Button>
                              <Popconfirm
                                  title="Cancel the task"
                                  description="Are you sure to cancel this task?"
                                  onConfirm={this.cancel}
                                  okText="Yes"
                                  cancelText="No"
                              >
                                  <Button danger disabled={this.props.task.status==="end"}
                                          icon={<StopOutlined />}
                                          loading={this.state.loading}>
                                  </Button>
                              </Popconfirm>

                              <Tag color="magenta">{this.getDate(this.props.task.start)}</Tag>
                          </Space>
                      }
                      style={{ width: "100%" }}>
                    <Layout hasSider style={{background: "#fff"}} >
                        <Sider  style={{background: "#fff"}} >
                            <Progress type="circle" percent={this.getPercent()} />
                        </Sider>
                        <Content >
                            <Row>
                                <Col span={4}>
                                    <Tag color={this.props.task.type === "upsert" ? "#2db7f5": "#87d068"}>
                                        {this.props.task.type}
                                    </Tag>
                                </Col>
                                <Col span={5}>
                                    <Statistic title="Total" value={this.props.task.total}  />
                                </Col>
                                <Col span={5}>
                                    <Statistic title="Process" value={this.props.task.process}  />
                                </Col>
                                <Col span={5}>
                                    <Statistic title="Error" value={this.props.task.error}  />
                                </Col>
                                <Col span={5} >
                                    <Statistic title="Skip" value={this.props.task.skip}  />
                                </Col>
                            </Row>
                            <Row>
                                <Col span={24}>
                                    <AceEditor
                                        mode="mysql" theme="tomorrow"
                                        width="100%" height="30px" style={{top: "5px", right: "5px"}}
                                        wrapEnabled={true} readOnly={true}
                                        value={this.props.task.sql}
                                        name={this.props.task.id}
                                        editorProps={{ $blockScrolling: true }}
                                    />
                                </Col>
                            </Row>
                        </Content>
                    </Layout>

                </Card>
            </>
        )
    }
}