import axios, {AxiosInstance} from "axios";
import RequestProcess from "./RequestProcess";

const baseURL = '/'

class BaseRequest {

  instance: AxiosInstance

  process: RequestProcess

  constructor(process: RequestProcess) {
    let base:string = baseURL
    try {
      const win = window as any
      if (window.location.href.indexOf('http://') < 0 && win.electron) {
        base = `http://localhost:${win.electron.port}/`
      }
    } catch (error) {
      console.error('init base api fail', error)
    }
    console.log("init baseURL:", base)
    this.instance = axios.create({
      baseURL: base,
      timeout: 60000
    });
    this.process = process;
    // 添加请求拦截器
    this.instance.interceptors.request.use((config) => {
      // 在发送请求之前做些什么
      return config;
    }, (error) => {
      process.processError("request has error", `error message: ${error}`)
      return Promise.reject(error);
    });
    this.instance.interceptors.response.use((response) => {
      const data = response.data as {success:boolean, data: any, error: any}
      if (!data.success) {
        const errorMessage = typeof data.error == 'string' ? data.error : JSON.stringify(data.error)
        process.processError("response has error", `error message: ${errorMessage}`)
        return Promise.reject(data.error);
      }
      return response;
    }, (error) => {
      process.processError("response has error", `error message: ${error}`)
      return Promise.reject(error);
    });
  }

  async get<T>(url: string, params: any): Promise<T> {
    const response = await this.instance.get(url, {params})
    const data = response.data as {success:boolean, data: any, error: any}
    return data.data as T
  }

  async delete<T>(url: string, params: {}): Promise<T> {
    const response = await this.instance.delete(url, {params})
    const data = response.data as {success:boolean, data: any, error: any}
    return data.data as T
  }

  async put<T>(url: string, data: any): Promise<T> {
    const response = await this.instance.put(url, data)
    const responseData = response.data as {success:boolean, data: any, error: any}
    return responseData.data as T
  }

  async post<T>(url: string, data: any): Promise<T> {
    const response = await this.instance.post(url, data)
    const responseData = response.data as {success:boolean, data: any, error: any}
    return responseData.data as T
  }

}

export default BaseRequest