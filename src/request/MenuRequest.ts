import BaseRequest from "./BaseRequest";
import MenuInfo from "../bean/MenuInfo";
import ContainerView from "../bean/ContainerView.ts";

class MenuRequest extends BaseRequest{

  public async getMenu (linkId: string) {
    const info = await this.get<MenuInfo>('/api/menu', {id: linkId})
    info.containerMap = new Map<string, ContainerView[]>();
    for (const container of info.containers) {
      let arr = info.containerMap.get(container.databaseId)
      if (!arr) {
        arr = []
        info.containerMap.set(container.databaseId, arr)
      }
      arr.push(container)
    }
    return info
  }
}

export default MenuRequest

