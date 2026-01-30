import { LOG_MAX_DEPTH } from "../const/common";

export class LogService {

    private static clean(obj: any, depth: number = 0, seen: WeakSet<any> = new WeakSet()): any {
        if (depth > LOG_MAX_DEPTH) {
            return '[DepthLimit]';
        }
        if (typeof obj !== 'object' || obj === null) {
            return obj;
        }

        if (seen.has(obj)) {
            return '[Circular]';
        }
        seen.add(obj);

        if (Array.isArray(obj)) {
            return obj.map(item => this.clean(item, depth + 1, seen));
        }

        if (obj instanceof Error) {
            // Error properties are not enumerable by default
            return {
                message: obj.message,
                name: obj.name,
                stack: obj.stack,
                ...this.clean({ ...obj }, depth + 1, seen) // Catch any other attached properties
            };
        }

        const res: Record<string, any> = {};
        for (const key of Object.keys(obj)) {
            try {
                res[key] = this.clean(obj[key], depth + 1, seen);
            } catch (err) {
                res[key] = '[Error accessing property]';
            }
        }
        return res;
    }

    static safeStringify(obj: any): string {
        try {
            const cleaned = this.clean(obj);
            return JSON.stringify(cleaned, null, 2);
        } catch (err) {
            return '[LogService Error: Failed to stringify]';
        }
    }

    static error(message: string, error?: any) {
        if (error) {
            console.error(message, this.safeStringify(error));
        } else {
            console.error(message);
        }
    }

    static warn(message: string, data?: any) {
        if (data) {
            console.warn(message, this.safeStringify(data));
        } else {
            console.warn(message);
        }
    }

    static info(message: string, data?: any) {
        if (data) {
            console.log(message, this.safeStringify(data));
        } else {
            console.log(message);
        }
    }

    static debug(message: string, data?: any) {
        if (data) {
            console.debug(message, this.safeStringify(data));
        } else {
            console.debug(message);
        }
    }
}
