const SUPPORTED_PROTOCOL_VERSIONS = ['2025-03-26', '2024-11-05'] as const;

export const LATEST_PROTOCOL_VERSION = SUPPORTED_PROTOCOL_VERSIONS[0];

function hasOwnProperty(target: any, key: string): boolean {
    return !!target && Object.prototype.hasOwnProperty.call(target, key);
}

export function negotiateProtocolVersion(requestedVersion?: string): string {
    if (requestedVersion && SUPPORTED_PROTOCOL_VERSIONS.includes(requestedVersion as typeof SUPPORTED_PROTOCOL_VERSIONS[number])) {
        return requestedVersion;
    }

    return LATEST_PROTOCOL_VERSION;
}

export function normalizeJsonRpcMessages(payload: any): any[] {
    if (Array.isArray(payload)) {
        return payload;
    }

    return [payload];
}

export function isJsonRpcRequest(message: any): boolean {
    return !!message
        && typeof message === 'object'
        && !Array.isArray(message)
        && typeof message.method === 'string'
        && hasOwnProperty(message, 'id');
}

export function isJsonRpcNotification(message: any): boolean {
    return !!message
        && typeof message === 'object'
        && !Array.isArray(message)
        && typeof message.method === 'string'
        && !hasOwnProperty(message, 'id');
}

export function isJsonRpcResponse(message: any): boolean {
    return !!message
        && typeof message === 'object'
        && !Array.isArray(message)
        && !hasOwnProperty(message, 'method')
        && (hasOwnProperty(message, 'result') || hasOwnProperty(message, 'error'));
}

export function isResponseOrNotificationOnly(payload: any): boolean {
    const messages = normalizeJsonRpcMessages(payload);
    return messages.length > 0 && messages.every((message) => isJsonRpcNotification(message) || isJsonRpcResponse(message));
}
