export interface FunctionPlugin {
    id: string;
    name: string;
    nameAlias: string;
    defaultShow?: boolean;
    description: string;
    descriptionAlias: string;
    lang?: string;
    parameters: any;
    status: number;
    supportedModels: string[];
    ver?: string;
    createdAt?: string;
    updatedAt?: string;
    avatar: string;

    checked?: boolean;
}

