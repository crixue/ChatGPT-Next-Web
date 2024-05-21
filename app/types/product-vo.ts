export interface Product {
    id: string;
    name: string;
    subtitle?: string;
    imageUrl?: string;
    detail?: string;
    price?: number;
    stock?: number;
    updateAt: Date;
}

