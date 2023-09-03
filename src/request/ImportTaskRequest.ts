import BaseRequest from "./BaseRequest.ts";
import ImportTask from "../bean/ImportTask.ts";

export default class ImportTaskRequest extends BaseRequest {

    public async getTasks(): Promise<ImportTask[]> {
        const result = await this.get<ImportTask[]>("/api/import/data", {})
        return result.reverse()
    }

    public async createTask(task: ImportTask): Promise<ImportTask> {
        return await this.post<ImportTask>("/api/import/data", task)
    }

}