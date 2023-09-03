import RequestProcess from "../request/RequestProcess";
import {notification} from 'antd';

class RequestNotification implements RequestProcess{

    public static readonly singleton = new RequestNotification();

    private constructor() {
    }


    processError(title: string, message: string): void {
        notification.error({
            message: title,
            description: message,
            placement: 'topRight'
        })
    }

}

export default RequestNotification