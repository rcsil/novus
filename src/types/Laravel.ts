export interface LaravelRoute {
    domain: string | null;
    method: string;
    uri: string;
    name: string | null;
    action: string;
    middleware: string[];
}

export interface LaravelProjectStatus {
    isLaravel: boolean;
    path: string;
    version?: string;
}
