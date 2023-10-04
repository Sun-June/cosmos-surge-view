import React, {Component} from 'react';
import './App.css';
import {Layout, Menu, Button, Affix, Tabs, Modal, Result, Spin} from 'antd';
import {
  MenuUnfoldOutlined,
  MenuFoldOutlined,
  EditOutlined,
  DeleteOutlined,
  AppstoreTwoTone,
  PlusOutlined,
  WarningOutlined,
  RedoOutlined,
  SmileOutlined,
  BuildTwoTone,
  DatabaseTwoTone,
  ContainerTwoTone,
  GoldTwoTone,
  ProjectTwoTone,
  BankTwoTone
} from '@ant-design/icons';

import RequestUtil from "./tool/RequestUtil";
import ConfigLinkEdit from "./view/ConfigLinkEdit";
import ConfigLink from "./bean/ConfigLink";
import ContainerView from "./bean/ContainerView.ts";
import DbMain from "./view/DbMain.tsx";
import {ItemType, MenuDividerType, MenuItemType, SubMenuType} from "antd/es/menu/hooks/useItems";
import {Tab} from "rc-tabs/lib/interface";
import TasksView from "./view/task/TasksView.tsx";

const { Sider } = Layout;
const { confirm } = Modal;
const icons:any[] = [
    <AppstoreTwoTone />,
    <BankTwoTone twoToneColor={"#2febb0"} />,
    <BuildTwoTone twoToneColor={"#eb5e2f"}/>,
    <DatabaseTwoTone twoToneColor={"#2f96eb"} />,
    <ContainerTwoTone twoToneColor={"#96eb2f"} />,
    <GoldTwoTone twoToneColor={"#eb2f59"} />,
    <ProjectTwoTone twoToneColor={"#2feb75"} />
]

interface AppState {
  collapsed: boolean
  showEdit: boolean,
  configId: number,
  menus: SubMenuType[],
  choiceConfig: ConfigLink
  tabItems: Tab[]
  activeTab: string,
  loading: boolean
}

class App extends Component<any, AppState> {

  private configMap: Map<string, ConfigLink> = new Map<string, ConfigLink>();

  private containerMap: Map<string, ContainerView> = new Map<string, ContainerView>();

  taskRef = React.createRef<TasksView>();

  constructor(props:any) {
    super(props)
    this.state = {
      collapsed: false,
      showEdit: false,
      configId: 0,
      menus: [],
      choiceConfig: {id: "", name: "", connectionString: ""},
      tabItems: [],
      activeTab: "",
      loading: false
    };

  }

  getFuncMenu(key: string): ItemType[] {
    const funcs:ItemType[] = [];
    const divider: MenuDividerType = {type: 'divider', dashed: true};
    const refresh: MenuItemType = {key: key + "_refresh", label: "REFRESH", icon: <RedoOutlined />,
      className: "menu-refresh",
      onClick: () => this.refreshMenu(key)};
    const edit: MenuItemType = {key: key + "_edit", label: "EDIT", icon: <EditOutlined/>,
      className: "menu-edit",
      onClick: () => this.editMenu(key)};
    const del: MenuItemType = {key: key + "_delete", danger: true, label: "DELETE", icon: <DeleteOutlined/>,
      className: "menu-delete",
      onClick: ()  => this.deleteMenu(key)};
    funcs.push(divider)
    funcs.push(refresh)
    funcs.push(edit)
    funcs.push(del)
    return funcs;
  }

  refreshMenu(key: string) {
    const menu = this.state.menus.find(m => m.key === key)
    if (menu) {
      this.updateMenuInfoData(menu)
    }
  }

  editMenu(key: string) {
    const config = this.configMap.get(key)
    this.setState({choiceConfig: config!}, () => {
      this.setShowEdit(true)
    })
  }

  deleteMenu(key: string) {
    confirm({
      icon: <WarningOutlined />,
      content: "Confirmation of deletion?",
      onOk: () => {
        RequestUtil.configApi.deleteConfig(key).then(config => {
          console.log('delete config:', config)
          const newMenus:SubMenuType[] = []
          for (const newMenu of this.state.menus) {
            if (newMenu.key !== key) {
              newMenus.push(newMenu)
            }
          }
          this.setState({menus: newMenus})
        })
      },
      onCancel() {
        console.log('Cancel');
      },
    });
  }

  setShowEdit = (show: boolean) => {
    this.setState({showEdit: show})
  }

  toggle = () => {
    this.setState({
      collapsed: !this.state.collapsed,
    });
  };

  initConfig = () => {
    RequestUtil.configApi.getConfigs().then(configs => {
      const newMenus:SubMenuType[] = []
      for (const [index,config] of configs.entries()) {
        this.configMap.set(config.id, config)
        const menu = this.getMenuInfoByConfig(config, index);
        menu.onMouseEnter = info => {
          if (info.key !== menu.key) {
            return
          }
          this.updateMenuInfoData(menu);
        }
        newMenus.push(menu)
      }
      this.setState({menus: newMenus})
    })
  }

  componentDidMount() {
    const win = window as any
    if (window.location.href.indexOf('http://') < 0 && !win.electron) { // load slow
      console.warn("electron loading so slow, next to wait....")
      this.setState({loading: true})
      const reloadNext = () => {
        setTimeout(() => {
          if (!win.electron) {
            console.warn("electron loading so slow, next to wait....")
            reloadNext();
          } else {
            RequestUtil.reload();
            this.setState({loading: false})
            this.initConfig();
          }
        }, 200)
      }
      reloadNext()
    } else {
      this.initConfig();
    }

  }

  getMenuInfoByConfig(config: ConfigLink, index: number):SubMenuType {
    return {key: config.id, label: config.name, icon: icons[index % icons.length],
      children: this.getFuncMenu(config.id)};
  }

  choiceContainer(key: string) {
    const container = this.containerMap.get(key);
    if (!container) {
      return
    }
    const search = this.state.tabItems.find(t => t.key === key)
    if (search) {
      this.setState({activeTab: key})
    } else {
      const tab: Tab = {id: container.id, key: container.id, label: container.name,
        children: <DbMain view={container} export={this.exportData} />}
      const newTabItems = [...this.state.tabItems];
      newTabItems.push(tab)
      this.setState({tabItems: newTabItems}, () => {
        this.setState({activeTab: key})
      })
    }

  }

  exportData = (view: ContainerView, sql: string) => {
    console.log(`export data ${view.name}, sql: ${sql}`)
    const linkIds = this.state.menus.map(m => m.key);
    this.taskRef.current!.createTask(view, sql, linkIds)
  }

  tabOnEdit = (targetKey: React.MouseEvent | React.KeyboardEvent | string, action: 'add' | 'remove') => {
    if (action === "add" || !targetKey) {
      return
    }

    const search = this.state.tabItems.find(t => t.key === targetKey)
    if (search) {
      const index = this.state.tabItems.indexOf(search);
      const newTabItems = [...this.state.tabItems];
      newTabItems.splice(index, 1)
      if (this.state.activeTab === search.key && newTabItems.length > 0) {
        this.setState({activeTab: newTabItems[0].key!})
      }
      this.setState({tabItems: newTabItems})
    } else {
      console.warn(`not search tab: ${targetKey}`)
    }
  }

  async updateMenuInfoData(menu: SubMenuType) {
    const index = this.state.menus.indexOf(menu);
    const info = await RequestUtil.menuApi.getMenu(menu.key);
    const newMenu: SubMenuType = {key: menu.key, label: menu.label, icon: menu.icon, children: []}
    for (const databaseId of info.databaseIds) {
      const categoryMenu:SubMenuType = {key: menu.key + databaseId, label: databaseId, children: []}
      const views = info.containerMap.get(databaseId);
      for (const view of views!) {
        this.containerMap.set(view.id, view);
        categoryMenu.children.push({key: view.id, label: view.name, onClick: info => this.choiceContainer(info.key)})
      }
      if (categoryMenu.children.length > 5) {
          categoryMenu.popupOffset = [0, -40]
      }
      newMenu.children.push(categoryMenu);
    }
    newMenu.children = newMenu.children.concat(this.getFuncMenu(newMenu.key));

    const newMenus = [...this.state.menus];
    newMenus[index] = newMenu
    this.setState({menus: newMenus})
  }

  addConfig() {
    this.setState({choiceConfig: {id: "", name: "", connectionString: ""}}, () => {
      this.setShowEdit(true)
    })
  }

  updateConfigFromEdit = (config: ConfigLink) => {
    const sourceConfig = this.configMap.get(config.id);
    const menu = this.state.menus.find(m => m.key === config.id)
    if (!sourceConfig || !menu || (config.name === sourceConfig.name && config.connectionString === sourceConfig.connectionString)) {
      return
    }
    this.configMap.set(config.id, config)
    const index = this.state.menus.indexOf(menu)
    const newMenu: SubMenuType = this.getMenuInfoByConfig(config, index);
    const newMenus = [...this.state.menus];
    newMenus[index] = newMenu
    this.setState({menus: newMenus}, async () => {
      await this.updateMenuInfoData(newMenu)
    })

  }

  addConfigFromEdit = (config: ConfigLink) => {

    this.configMap.set(config.id, config);
    const newMenu: SubMenuType = this.getMenuInfoByConfig(config, this.state.menus.length);
    const newMenus = [...this.state.menus];
    newMenus.push(newMenu)
    this.setState({menus: newMenus}, async () => {
      await this.updateMenuInfoData(newMenu)
    })

  }

  render() {

    return (
        <div className="App">
          <Spin spinning={this.state.loading} />
          <ConfigLinkEdit show={this.state.showEdit} setShow={this.setShowEdit}
                          config= {this.state.choiceConfig}
                          updateConfig={this.updateConfigFromEdit}
                          addConfig={this.addConfigFromEdit}  ></ConfigLinkEdit>
          <Layout className="main-layout" >
            <Sider trigger={null} theme="light" collapsible collapsed={this.state.collapsed}
                   style={{overflowY: "auto", background: "#eaeaea"}}   >
              <Affix className="top-button" offsetTop={1} >
                <Button type="dashed" block className="trigger" onClick={this.toggle}
                        icon={this.state.collapsed ? <MenuUnfoldOutlined/> : <MenuFoldOutlined/>}  />

                <Button type="primary" block onClick={() => this.addConfig()} icon={<PlusOutlined />} >Add</Button>

              </Affix>
              <Menu theme="light" mode="vertical" items={this.state.menus} forceSubMenuRender >
              </Menu>

              <Affix className={this.state.collapsed ? "bottom-button" : "bottom-button-collapsed"} offsetBottom={10} >
                <TasksView ref={this.taskRef} collapsed={this.state.collapsed} ></TasksView>
              </Affix>
            </Sider>
            <Layout className="site-layout">
              {
                this.state.tabItems.length > 0 &&
                  <Tabs
                      hideAdd rootClassName="tab-customer"
                      onChange={key => this.setState({activeTab: key})}
                      activeKey={this.state.activeTab}
                      type="editable-card"
                      onEdit={this.tabOnEdit}
                      items={this.state.tabItems}
                  />
              }


              {this.state.tabItems.length === 0 &&
                  <Result
                      icon={<SmileOutlined />} className={"result-show"}
                      title="Please select a container or create a new link configuration."
                      extra={<Button type="primary" onClick={() => this.addConfig()} icon={<PlusOutlined />} >Create Link</Button>}
                  />
              }
            </Layout>
          </Layout>
        </div>
    );
  }

}

export default App;
