import BaseRequest from "./BaseRequest";
import ContainerView from "../bean/ContainerView";
import CosmosOperation from "../bean/CosmosOperation";
import RequestProcess from "./RequestProcess";
import _ from "lodash";

class OperationRequest extends BaseRequest{

  private view:ContainerView

  constructor(process: RequestProcess, view: ContainerView) {
    super(process);
    this.view = view;
  }

  public async queryPartition() {
    const query:CosmosOperation = {linkId: this.view.id!, type: 'query'}
    const partition = this.view.partition!
    query.query = `select c.${partition} from c group by c.${partition}`
    const result = await this.post('/api/cosmos/operation', query) as any[]
    return result.map(item => item[partition]).sort()
  }

  public async query(sql:string) {
    const query:CosmosOperation = {linkId: this.view.id!, type: 'query'}
    query.query = sql
    return await this.post('/api/cosmos/operation', query)
  }

  public async operationItem(type: string, items:any[]) {
    const operation:CosmosOperation = {linkId: this.view.id!, type}
    if (items.length > 10) {
      let result: any[] = []
      const groups = _.chunk(items, 10);
      for (const group of groups) {
        operation.items = group
        result = result.concat(await this.post<any[]>('/api/cosmos/operation', operation))
      }
      return result
    } else {
      operation.items = items
      return await this.post<any[]>('/api/cosmos/operation', operation)
    }

  }

  public async createItem(items:any[]) {
    return await this.operationItem("create", items);
  }

  public async updateItem(items:any[]) {
    return await this.operationItem("update", items);
  }

  public async deleteItem(items:any[]) {
    return await this.operationItem("delete", items);
  }

}

export default OperationRequest

