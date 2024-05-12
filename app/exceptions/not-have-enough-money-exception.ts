
export class NotHaveEnoughMoneyException extends Error {
    constructor(message: string) {
        super(message);
        this.name = "NotHaveEnoughMoneyException";
    }
}