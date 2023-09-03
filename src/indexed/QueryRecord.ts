import Dexie from 'dexie';

interface QueryRecord {
  id?: number

  time: Date

  sql: string
}

class QueryRecordDataBase extends Dexie {
    public queryRecords: Dexie.Table<QueryRecord, number>; // id is number in this case

    public static readonly limit: number = 100

    private static readonly dataBaseMap: Map<string, QueryRecordDataBase> = new Map()

    public static getInstance(linkId:string):QueryRecordDataBase {
        const database = this.dataBaseMap.get(linkId)
        if (database) {
          return database
        }
        let newDatabase = new QueryRecordDataBase(linkId)
        this.dataBaseMap.set(linkId, newDatabase)
        return newDatabase
    }

    protected constructor(linkId:string) {
        super("QueryRecordDataBase-" + linkId);
        this.version(1).stores({
          QueryRecord: "++id,time,sql"
        });
        this.queryRecords = this.table("QueryRecord");
    }

    public async addRecord(sql:string) {
      let record:QueryRecord = {time: new Date(), sql}
      let key = await this.queryRecords.add(record)
      let count = await this.queryRecords.count()
      if (count > QueryRecordDataBase.limit) {
        const data = await this.queryRecords.orderBy("time").limit(1).toArray()
        if (data.length > 0) {
          this.queryRecords.delete(data[0].id!)
        }
      }
      return key
    }

    public async query(offset: number):Promise<QueryRecord[]> {
      return await this.queryRecords.orderBy("time").reverse().limit(10).offset(offset).toArray()
    }
}

export { QueryRecordDataBase }

export default QueryRecord
