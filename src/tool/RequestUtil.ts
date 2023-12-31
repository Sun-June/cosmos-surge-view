import ConfigLinkRequest from "../request/ConfigLinkRequest";
import RequestNotification from "./RequestNotification";
import MenuRequest from "../request/MenuRequest";
import OperationRequest from "../request/OperationRequest";
import ContainerView from "../bean/ContainerView";
import ImportTaskRequest from "../request/ImportTaskRequest.ts";

class RequestUtil {

    public static configApi: ConfigLinkRequest = new ConfigLinkRequest(RequestNotification.singleton);

    public static menuApi: MenuRequest = new MenuRequest(RequestNotification.singleton);

    public static taskApi: ImportTaskRequest = new ImportTaskRequest(RequestNotification.singleton)

    private static operationMap: Map<string, OperationRequest> = new Map<string, OperationRequest>();

    public static getOperationApi(view: ContainerView): OperationRequest {
        let opApi = this.operationMap.get(view.id);
        if (!opApi) {
            opApi = new OperationRequest(RequestNotification.singleton, view);
            this.operationMap.set(view.id, opApi);
        }
        return opApi;
    }

    public static reload() {
        this.configApi = new ConfigLinkRequest(RequestNotification.singleton);
        this.menuApi = new MenuRequest(RequestNotification.singleton);
        this.taskApi = new ImportTaskRequest(RequestNotification.singleton);
        this.operationMap.clear();
    }

}

export default RequestUtil