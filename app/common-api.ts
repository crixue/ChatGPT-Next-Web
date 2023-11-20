import {notification} from "antd";


export type ServerResponse<T> = {
    code: number;

    msg: string;

    data: T;
}

export const handleServerResponse = <T>(response: ServerResponse<T>) => {

    if (response.code !== 0) {
        throw new Error(JSON.stringify(response));
    }
    return response.data;
}