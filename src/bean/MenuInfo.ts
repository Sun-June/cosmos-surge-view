import ContainerView from "./ContainerView";

interface MenuInfo {

    id: string

    name: string

    databaseIds: string[]

    containers: ContainerView[]

    containerMap: Map<string, ContainerView[]>

}

export default MenuInfo