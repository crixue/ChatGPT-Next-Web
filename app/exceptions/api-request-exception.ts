export class ApiRequestException extends Error {
    statusCode: number;
    businessCode: number;

    constructor(message: string, statusCode: number, businessCode: number) {
        super(message);
        this.name = "ApiRequestException";
        this.statusCode = statusCode;
        this.businessCode = businessCode;
    }
}