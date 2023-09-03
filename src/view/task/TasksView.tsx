import React, { Component } from "react";
import {Drawer, Button, Badge, Result} from 'antd'


import ContainerView from "../../bean/ContainerView.ts";
import ImportTask from "../../bean/ImportTask.ts";
import RequestUtil from "../../tool/RequestUtil.ts";
import TaskProgress from "./TaskProgress.tsx";
import CreateTask from "./CreateTask.tsx";
import { AlertTwoTone,UpCircleTwoTone } from "@ant-design/icons";

interface IProps {
  collapsed:boolean
}

interface IData {
  show: boolean,
  loading: boolean,
  type: string,
  linkId: string,
  tasks: ImportTask[],

  runTaskNum: number
}

export default class TasksView extends Component<IProps, IData> {

  createRef = React.createRef<CreateTask>();

  private timer:number = 0;

  private taskKey: number = 1;

  constructor(props:any) {
    super(props)
    this.state = {
      show: false,
      loading: false,
      type: 'query',
      linkId: '',
      tasks: [],
      runTaskNum: 0
    }
  }

  componentDidMount() {
    this.reGetTasks();
  }

  reGetTasks = () => {
    clearTimeout(this.timer)
    this.taskKey++
    this.getTasks(this.taskKey)
  }

  getTasks = (taskKey: number) => {
    RequestUtil.taskApi.getTasks().then(tasks => {
      const runTaskNum = tasks.filter(t => t.status !== "end").length;
      this.setState({tasks, runTaskNum}, () => {
        if (taskKey !== this.taskKey) {
          return
        }
        this.timer = setTimeout(() => this.getTasks(taskKey), runTaskNum > 0 ? 1000 : 60000)
      })
    })
  }

  showDrawer = () => {
    this.setState({show: true}, () => {
    })
  }

  onClose = () => {
    this.setState({show: false})
  }

  createTask = (fromView: ContainerView, sql: string, linkIds: string[]) => {
    this.createRef!.current!.showCreate(fromView, sql, linkIds);
  }

  createAfter = (task: ImportTask) => {
    console.log("createAfter:", task)
    this.reGetTasks()
    this.showDrawer()
  }

  render() {
    return (
      <>
        <Badge count={this.state.runTaskNum} style={{ backgroundColor: '#52c41a' }} >
          <Button type="dashed" style={{color: 'chocolate'}} ghost icon={<UpCircleTwoTone />}
                  onClick={this.showDrawer}>
            {this.props.collapsed ? "":"tasks" }
          </Button>
        </Badge>

        <CreateTask ref={this.createRef} createAfter={this.createAfter} ></CreateTask>

      <Drawer title="Tasks" placement="bottom" onClose={this.onClose} height={"50%"}
              open={this.state.show} destroyOnClose={true} >
        {
          this.state.tasks.map(task => (
            <TaskProgress key={task.id} task={task} ></TaskProgress>
          ))
        }

        {
          this.state.tasks.length === 0 &&
            <Result
                icon={<AlertTwoTone />}
                title="There are currently no ongoing import tasks. Please create a task first."
            />
        }
      </Drawer>
       
      </>
    )
  }
}