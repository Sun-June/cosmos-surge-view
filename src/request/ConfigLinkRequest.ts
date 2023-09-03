import BaseRequest from "./BaseRequest";
import ConfigLink from "../bean/ConfigLink";

class ConfigLinkRequest extends BaseRequest{

  public async getConfigs (): Promise<ConfigLink[]> {
    return await this.get<ConfigLink[]>('/api/config', {})
  }

  public async updateConfig (config: ConfigLink): Promise<ConfigLink> {
    return await this.put<ConfigLink>('/api/config', config)
  }

  public async deleteConfig (configId: string): Promise<ConfigLink> {
    return await this.delete<ConfigLink>('/api/config', {id: configId})
  }

  public async createConfig (config: ConfigLink): Promise<ConfigLink> {
    return await this.post<ConfigLink>('/api/config', config)
  }

  public async testConfig (config: ConfigLink): Promise<number> {
    return await this.post<number>('/api/config/test', config)
  }
}

export default ConfigLinkRequest

