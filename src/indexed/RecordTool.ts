import { AddRecordDataBase } from "./AddRecord";
import { DeleteRecordDataBase } from "./DeleteRecord";
import { QueryRecordDataBase } from "./QueryRecord";
import { UpdateItem, UpdateRecordDataBase } from "./UpdateRecord";
import dayjs from "dayjs";

declare interface TimeData {
  id: number
  time: string
  des: string
  type: 'add' | 'delete' | 'update' | 'query'
}

class RecordTool {

  public static readonly types: Array<string> = ['query', 'delete', 'update', 'add']

  private static offsetMap:Map<string, number> = new Map()


  public static reset() {
    this.types.forEach(type => this.offsetMap.set(type, 0))
  }

  public static formatTime(time: Date):string {
    return dayjs(time).format('YYYY-MM-DD HH:mm')
  }

  public static async getItems(type: 'delete' | 'add', linkId: string, id: number): Promise<any[]> {
    if (type === 'delete') {
      return await DeleteRecordDataBase.getInstance(linkId).getItems(id)
    } else {
      return await AddRecordDataBase.getInstance(linkId).getItems(id)
    }
  }

  public static async getUpdateItems(linkId: string, id: number): Promise<UpdateItem> {
    return await UpdateRecordDataBase.getInstance(linkId).getItems(id)
  }

  public static async queryNext(type: string, linkId: string):Promise<TimeData[]> {
    let offset = this.offsetMap.get(type)!
    offset += 10;
    this.offsetMap.set(type, offset)
    return await this.query(type, linkId)
  }

  public static async query(type: string, linkId: string):Promise<TimeData[]> {
    const offset = this.offsetMap.get(type)!
    const array:Array<TimeData> = []
    if (type === 'query') {
      const queryRecords = await QueryRecordDataBase.getInstance(linkId).query(offset);
      queryRecords.forEach(record => {
        array.push({id: record.id!, time: this.formatTime(record.time), des: record.sql, type: 'query'})
      })
    } else if (type === 'delete') {
      const deleteRecords = await DeleteRecordDataBase.getInstance(linkId).query(offset)
      deleteRecords.forEach(record => {
        array.push({
          id: record.id!,
          time: this.formatTime(record.time),
          des: record.des + ` ${record.num} items`,
          type: 'delete'
        })
      })
    } else if (type === 'update') {
      const updateRecords = await UpdateRecordDataBase.getInstance(linkId).query(offset)
      updateRecords.forEach(record => {
        array.push({
          id: record.id!,
          time: this.formatTime(record.time),
          des: record.des + ` ${record.num} items`,
          type: 'update'
        })
      })
    } else if (type === 'add') {
      const addRecords = await AddRecordDataBase.getInstance(linkId).query(offset)
      addRecords.forEach(record => {
        array.push({
          id: record.id!,
          time: this.formatTime(record.time),
          des: record.des + ` ${record.num} items`,
          type: 'update'
        })
      })
    } else {
      console.error("RecordTool.query type error ", type)
    }
    return array
  }
}

export type { TimeData }

export default RecordTool
