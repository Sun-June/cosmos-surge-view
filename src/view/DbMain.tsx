import React,{Component} from 'react';
import {Layout, Select, Pagination, Row, Col, Tooltip, Button, Breadcrumb, Dropdown, MenuProps, message} from 'antd';
import { BaseSelectRef } from 'rc-select'
import {
    SearchOutlined,PlusOutlined, RedoOutlined, ExportOutlined, HistoryOutlined, DownOutlined
} from '@ant-design/icons';
import AceEditor from "react-ace";
import "ace-builds/src-noconflict/mode-mysql";
import "ace-builds/src-noconflict/theme-xcode";
import "ace-builds/src-noconflict/ext-language_tools"

import OperationRequest from '../request/OperationRequest.ts';
import DataProcess from './datajson/DataProcess.tsx';
import AddJsonView from './datajson/AddJsonView.tsx';
import History from './history/History';
import {QueryRecordDataBase} from '../indexed/QueryRecord';

import './DbMain.css'
import RequestUtil from "../tool/RequestUtil.ts";
import containerView from "../bean/ContainerView.ts";

const { Header, Content } = Layout;

interface DbMainState {
    partitions: string[],
    queryStatus: boolean,
    choiceCategory: string[],
    sql:string,
    queryResult: any,
    total: number,
    current: number,
    pageSize: number,
    selectOpen: boolean,
    selectValue: string[],
    addTemplateItem: any[],
    showAdd: boolean,
    sortKeys: string[]
}

interface MainProps {

    view: containerView

    export: (view: containerView, sql: string) => void
}

const functionItems: MenuProps['items'] = [
    {
        label: 'add',
        key: 'add',
        icon: <PlusOutlined />
    },
    {
        label: 'history',
        key: 'history',
        icon: <HistoryOutlined />
    },
    {
        label: 'export',
        key: 'export',
        icon: <ExportOutlined />
    }
];

class DbMain extends Component<MainProps, DbMainState> {

    refSelect = React.createRef<BaseSelectRef>()

    refHistory = React.createRef<History>()

    private readonly operationReq: OperationRequest;

    initState: DbMainState = {
        partitions: [],
        queryStatus: false,
        choiceCategory: [],
        sql: '',
        queryResult: [],
        total: 0,
        current: 1,
        pageSize: 20,
        selectOpen: false,
        selectValue: [],
        addTemplateItem: [],
        showAdd: false,
        sortKeys: ["id", "_ts"]
    }

    constructor(props:any) {
        super(props)
        this.operationReq = RequestUtil.getOperationApi(this.props.view)
        this.state = Object.assign({}, this.initState)
    }

    componentDidMount() {
        this.updatePartition();
    }

    updatePartition = () => {
        this.setState({queryStatus: true}, () => {
            this.operationReq.queryPartition().then(partitions => {
                this.setState({partitions}, () => {
                    this.refSelect.current?.focus()
                    this.setSqlToEditor('')
                })
            }).finally(() => this.setState({queryStatus: false}))
        })
    }

    queryForSql = (buttonQuery?:boolean) => {

        if (!this.state.sql || this.state.sql === "") {
            return
        }

        let pageQueryHasError:boolean = false
        try {
            this.setState({queryStatus: true})
            let countSql = "";
            if (this.state.sql.indexOf("where ") > -1) {
                countSql = 'select COUNT(1) as num from c where ' + this.state.sql.split('where')[1]
            } else {
                countSql = 'select COUNT(1) as num from c ' + this.state.sql.split('from c')[1]
            }
            this.operationReq.query(countSql).then(result => {
                console.log('count result::', result)
                const countResult = result as {num: number}[]
                this.setState({total: countResult[0].num})
            })
        } catch (e) {
            console.error(`count from sql: [${this.state.sql}] has error`, e)
            pageQueryHasError = true
            this.setState({total: 1, current: 1})
        }

        let querySql = this.state.sql
        if (!pageQueryHasError) {
            const current = this.state.current ? this.state.current : 1
            const offset = this.state.pageSize * (current - 1)
            querySql = `${this.state.sql} OFFSET ${offset} LIMIT ${this.state.pageSize}`
        }

        this.operationReq.query(querySql).then(result => {
            console.log('result::', result)
            const arr = result as Array<any>
            const newArr:Array<any> = []
            let sortKeys:Array<string> = []
            try {
                sortKeys = sortKeys.concat(this.state.sortKeys)
                sortKeys.push(this.props.view.partition!)
                arr.forEach(obj => {
                    const keys = Object.keys(obj).sort((k1, k2) => {
                        const index1 = sortKeys.indexOf(k1)
                        const index2 = sortKeys.indexOf(k2)
                        if (index1 > -1 && index2 < 0) {
                            return -1;
                        }
                        if (index2 > -1 && index1 < 0) {
                            return 1;
                        }
                        if (index1 === index2) {
                            if (k1.startsWith('_') && !k2.startsWith('_')) {
                                return 1
                            } else if (!k1.startsWith('_') && k2.startsWith('_')) {
                                return -1
                            }
                            return k1.localeCompare(k2)
                        }
                        return index1 - index2
                    })
                    const newObj:any = {}
                    keys.forEach(k => {
                        newObj[k] = obj[k]
                        if (k === "_ts" && typeof obj[k] === "number" && obj[k].toString().length === 10) {
                            newObj[k] = obj[k] * 1000 // date 10 to date 13
                        }
                    })
                    newArr.push(newObj)
                })
                result = newArr
            } catch (error) {
                console.warn('result as Array<Object> has error.')
            }
            this.setState({queryResult: result}, () => {
                this.queryEnd(buttonQuery!)
                if (newArr.length > 0) {
                    this.setSqlParam(this.state.sql, newArr[0])
                }
            })
        }).finally(() => this.setState({queryStatus: false}))
    }

    queryEnd = (buttonQuery:boolean) => {
        if (buttonQuery) {
            QueryRecordDataBase.getInstance(this.props.view.id!).addRecord(this.state.sql)
        }
    }

    categoryChange = (value: string[]) => {
        this.refSelect.current?.blur()
        this.setState({selectValue: value})
        console.log('categoryChange::', value)
        if (value.length === 0) {
            return
        }

        const partition = this.props.view.partition
        const inParam = value.map(val => `"${val}"`).join(',')
        const sqlstr = `select * from c where c.${partition} in (${inParam})`
        this.setState({choiceCategory: value, sql: sqlstr}, () => {
            this.setSqlToEditor(sqlstr)
            this.queryForSql()
        })
    }

    setSqlToEditor = (sqlstr:string) => {
        this.setState({ sql: sqlstr })
    }

    setSqlParam = (sqlstr:string, obj: any) => {
        if (obj) {

            this.setState({ sql: sqlstr })

        }
    }

    pageChange = (page: number, pageSize: number) => {
        this.setState({current: page, pageSize}, () => this.queryForSql())
    }

    sqlChange = (sqlstr:string) => {
        this.setState({ sql: sqlstr })
    }

    setShowAdd = (show: boolean) => {
        this.setState({showAdd: show})
    }

    showAddWindow = () => {
        const template:any[] = []
        try {
            const queryResult = this.state.queryResult as any[]
            if (queryResult.length > 0) {
                template.push(queryResult[0])
            }
        } catch(error) {
            console.error('get queryResult fail', error)
        }
        if (template.length === 0) {
            const obj:any = {id: ""}
            if (this.props.view.partition) {
                obj[this.props.view.partition] = ""
            }
            template.push(obj)
        }
        this.setShowAdd(true)
        this.setState({addTemplateItem: template})
    }

    processResult = (type: string, data: any) => {
        console.log(`process type: ${type}, data:`, data)
        this.queryForSql(false)
    }

    functionOnClick: MenuProps['onClick'] = ({ key }) => {
        if (key === "add") {
            this.showAddWindow()
        } else if (key === "history") {
            this.refHistory.current!.showDrawer();
        }else if (key === "export") {
            if (!this.state.sql || this.state.sql === "") {
                message.warning("You need to specify the data export scope using an SQL statement before using this feature.")
            } else {
                this.props.export(this.props.view, this.state.sql)
            }
        }
    };

    render() {
        return (
            <>
                <AddJsonView jsonObj={this.state.addTemplateItem}
                             show={this.state.showAdd} processResult={this.processResult}
                         setShow={this.setShowAdd} view={this.props.view} ></AddJsonView>
                <Breadcrumb>
                    <Breadcrumb.Item>&nbsp;&nbsp;&nbsp;&nbsp;{this.props.view.linkName}</Breadcrumb.Item>
                    <Breadcrumb.Item>{this.props.view.databaseId}</Breadcrumb.Item>
                    <Breadcrumb.Item>
                        {this.props.view.name}
                        &nbsp;&nbsp;
                        {this.state.queryStatus ? "(loading...)" : ""}
                    </Breadcrumb.Item>
                </Breadcrumb>
                <Header className="site-layout-background" style={{ padding: 0 }}>
                    <Row>
                        <Col span={18} >
                            <Tooltip placement="bottom" color={'#108ee9'} title={"Refresh the partition list."}>
                                <Button type="link" icon={<RedoOutlined />} onClick={this.updatePartition} ></Button>
                            </Tooltip>
                            <Select
                                mode="multiple" ref={this.refSelect} value={this.state.selectValue}
                                allowClear loading={this.state.queryStatus} open={this.state.selectOpen}
                                style={{ width: 'calc(100% - 50px)' }}
                                onFocus={() => {this.setState({selectOpen: true})}}
                                onBlur={() => {this.setState({selectOpen: false})}}
                                placeholder={`Please select ${this.props.view.partition} `}
                                onChange={this.categoryChange}
                            >
                                {this.state.partitions.map((cate, index) => {
                                    return <Select.Option key={index} value={cate} >{cate}</Select.Option>
                                })}
                            </Select>
                        </Col>
                        <Col span={6} >
                            <Tooltip title="excute query">
                                <Button type="primary"  icon={<SearchOutlined />} loading={this.state.queryStatus}
                                        onClick={() => this.queryForSql(true)} >
                                    query
                                </Button>
                            </Tooltip>
                            &nbsp;
                            <Dropdown menu={{ items: functionItems, onClick: this.functionOnClick }}>
                                <Button icon={<DownOutlined />} danger ghost >Functions</Button>
                            </Dropdown>

                            <History view={this.props.view} ref={this.refHistory} ></History>
                        </Col>
                    </Row>

                </Header>
                <Content
                    className="site-layout-background"
                    style={{
                        margin: '4px 5px',
                        padding: 3,
                        minHeight: 280,
                        height: "calc(100% - 100px)"
                    }}
                >

                    <AceEditor
                        mode="mysql" theme="xcode"
                        height="80px" width="100%"
                        wrapEnabled={true} enableBasicAutocompletion={true}
                        enableLiveAutocompletion={true} enableSnippets={true}
                        onChange={this.sqlChange} onPaste={(str) => {this.setState({ sql: this.state.sql + str })}}
                        value={this.state.sql}
                        name="UNIQUE_ID_OF_DIV"
                        editorProps={{ $blockScrolling: true }}
                    />


                    <Pagination
                        total={this.state.total} current={this.state.current}
                        showSizeChanger pageSizeOptions={["20", "50", "100", "200"]}
                        showQuickJumper pageSize={this.state.pageSize}
                        onChange={(page, pageSize) => this.pageChange(page, pageSize!)}
                        showTotal={total => `Total ${total} items`}
                    />

                    <DataProcess jsonObj={this.state.queryResult} processResult={this.processResult}
                                 view={this.props.view} ></DataProcess>
                </Content>
            </>
        )
    }
}

export default DbMain
