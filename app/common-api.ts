import {ApiRequestException} from "@/app/exceptions/api-request-exception";


export type ServerResponse<T> = {
    code: number;

    msg: string;

    data: T;
}

export const handleServerResponse = <T>(response: ServerResponse<T>) => {

    if (response.code !== 0) {
        throw new ApiRequestException(JSON.stringify(response), 200, response.code);
    }
    return response.data;
}