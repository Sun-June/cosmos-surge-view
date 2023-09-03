import Dexie from 'dexie';

interface AddRecord {
  id?: number

  time: Date

  num: number

  des: string
}

interface AddItem {
  id: number

  items: any[]
}

class AddRecordDataBase extends Dexie {
    public addRecords: Dexie.Table<AddRecord, number>; // id is number in this case

    public addItems: Dexie.Table<AddItem, number>;

    public static readonly limit: number = 100

    private static readonly dataBaseMap: Map<string, AddRecordDataBase> = new Map()

    public static getInstance(linkId:string):AddRecordDataBase {
        const database = this.dataBaseMap.get(linkId)
        if (database) {
          return database
        }
        const newDatabase = new AddRecordDataBase(linkId)
        this.dataBaseMap.set(linkId, newDatabase)
        return newDatabase
    }

    protected constructor(linkId:string) {
        super("AddRecordDataBase-" + linkId);
        this.version(1).stores({
          AddRecord: "++id,time,num,des",
          AddItem: "id,items"
        });
        this.addRecords = this.table("AddRecord");
        this.addItems = this.table("AddItem");
    }

    public async addRecord(items: any[], des: string) {
      const record:AddRecord = {time: new Date(), num: items.length, des }
      const key = await this.addRecords.add(record)

      const recordItem:AddItem = {id: key, items}
      await this.addItems.add(recordItem)

      const count = await this.addRecords.count()
      if (count > AddRecordDataBase.limit) {
        const data = await this.addRecords.orderBy("time").limit(1).toArray()
        if (data.length > 0) {
          this.addRecords.delete(data[0].id!)
          this.addItems.delete(data[0].id!)
        }
      }
      return key
    }

    public async query(offset: number):Promise<AddRecord[]> {
      return this.addRecords.orderBy("time").reverse().limit(10).offset(offset).toArray();
    }

    public async getItems(id: number):Promise<any[] > {
      const record = await this.addItems.get(id)
      if (record) {
        return record.items
      }
      return []
    }
}

export { AddRecordDataBase }

export default AddRecord
