import Dexie from 'dexie';

interface DeleteRecord {
  id?: number

  time: Date

  num: number

  des: string
}

interface DeleteItem {
  id: number

  items: any[]
}

class DeleteRecordDataBase extends Dexie {
    public deleteRecords: Dexie.Table<DeleteRecord, number>; // id is number in this case

    public deleteItems: Dexie.Table<DeleteItem, number>;

    public static readonly limit: number = 100

    private static readonly dataBaseMap: Map<string, DeleteRecordDataBase> = new Map()

    public static getInstance(linkId:string):DeleteRecordDataBase {
        const database = this.dataBaseMap.get(linkId)
        if (database) {
          return database
        }
        let newDatabase = new DeleteRecordDataBase(linkId)
        this.dataBaseMap.set(linkId, newDatabase)
        return newDatabase
    }

    protected constructor(linkId:string) {
        super("DeleteRecordDataBase-" + linkId);
        this.version(1).stores({
          DeleteRecord: "++id,time,num,des",
          DeleteItem: "id,items"
        });
        this.deleteRecords = this.table("DeleteRecord");
        this.deleteItems = this.table("DeleteItem");
    }

    public async addRecord(items: any[], des: string) {
      let record:DeleteRecord = {time: new Date(), num: items.length, des }
      let key = await this.deleteRecords.add(record)

      let recordItem:DeleteItem = {id: key, items}
      await this.deleteItems.add(recordItem)

      let count = await this.deleteRecords.count()
      if (count > DeleteRecordDataBase.limit) {
        const data = await this.deleteRecords.orderBy("time").limit(1).toArray()
        if (data.length > 0) {
          this.deleteRecords.delete(data[0].id!)
          this.deleteItems.delete(data[0].id!)
        }
      }
      return key
    }

    public async query(offset: number):Promise<DeleteRecord[]> {
      return await this.deleteRecords.orderBy("time").reverse().limit(10).offset(offset).toArray()
    }

    public async getItems(id: number):Promise<any[] > {
      let record = await this.deleteItems.get(id)
      if (record) {
        return record.items
      }
      return []
    }
}

export { DeleteRecordDataBase }

export default DeleteRecord
