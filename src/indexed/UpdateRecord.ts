import Dexie from 'dexie';

interface UpdateRecord {
  id?: number

  time: Date

  num: number

  des: string
}

declare interface UpdateItem {
  id: number

  items: any[]

  oldItems: any[]
}

class UpdateRecordDataBase extends Dexie {
    public updateRecords: Dexie.Table<UpdateRecord, number>; // id is number in this case

    public updateItems: Dexie.Table<UpdateItem, number>;

    public static readonly limit: number = 100

    private static readonly dataBaseMap: Map<string, UpdateRecordDataBase> = new Map()

    public static getInstance(linkId:string):UpdateRecordDataBase {
        const database = this.dataBaseMap.get(linkId)
        if (database) {
          return database
        }
        let newDatabase = new UpdateRecordDataBase(linkId)
        this.dataBaseMap.set(linkId, newDatabase)
        return newDatabase
    }

    protected constructor(linkId:string) {
        super("UpdateRecordDataBase-" + linkId);
        this.version(1).stores({
          UpdateRecord: "++id,time,num,des",
          UpdateItem: "id,items"
        });
        this.updateRecords = this.table("UpdateRecord");
        this.updateItems = this.table("UpdateItem");
    }

    public async addRecord(items: any[], oldItems: any[], des: string) {
      let record:UpdateRecord = {time: new Date(), num: items.length, des }
      let key = await this.updateRecords.add(record)

      let recordItem:UpdateItem = {id: key, items, oldItems}
      await this.updateItems.add(recordItem)

      let count = await this.updateRecords.count()
      if (count > UpdateRecordDataBase.limit) {
        const data = await this.updateRecords.orderBy("time").limit(1).toArray()
        if (data.length > 0) {
          this.updateRecords.delete(data[0].id!)
          this.updateItems.delete(data[0].id!)
        }
      }
      return key
    }

    public async query(offset: number):Promise<UpdateRecord[]> {
      return await this.updateRecords.orderBy("time").reverse().limit(10).offset(offset).toArray()
    }

    public async getItems(id: number):Promise<UpdateItem> {
      let record = await this.updateItems.get(id)
      return record!
    }
}

export { UpdateRecordDataBase }

export type {UpdateItem}

export default UpdateRecord
