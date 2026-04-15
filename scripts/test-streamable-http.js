const assert = require('assert');
const {
    LATEST_PROTOCOL_VERSION,
    isJsonRpcNotification,
    isJsonRpcRequest,
    isJsonRpcResponse,
    negotiateProtocolVersion,
    normalizeJsonRpcMessages,
} = require('../dist/protocol.js');

function run() {
    assert.strictEqual(negotiateProtocolVersion('2025-03-26'), '2025-03-26');
    assert.strictEqual(negotiateProtocolVersion('2024-11-05'), '2024-11-05');
    assert.strictEqual(negotiateProtocolVersion('unsupported-version'), LATEST_PROTOCOL_VERSION);

    const requestMessage = { jsonrpc: '2.0', id: 1, method: 'initialize', params: {} };
    const notificationMessage = { jsonrpc: '2.0', method: 'notifications/initialized' };
    const responseMessage = { jsonrpc: '2.0', id: 1, result: {} };

    assert.strictEqual(isJsonRpcRequest(requestMessage), true);
    assert.strictEqual(isJsonRpcNotification(requestMessage), false);
    assert.strictEqual(isJsonRpcResponse(requestMessage), false);

    assert.strictEqual(isJsonRpcRequest(notificationMessage), false);
    assert.strictEqual(isJsonRpcNotification(notificationMessage), true);
    assert.strictEqual(isJsonRpcResponse(notificationMessage), false);

    assert.strictEqual(isJsonRpcRequest(responseMessage), false);
    assert.strictEqual(isJsonRpcNotification(responseMessage), false);
    assert.strictEqual(isJsonRpcResponse(responseMessage), true);

    assert.deepStrictEqual(normalizeJsonRpcMessages(requestMessage), [requestMessage]);
    assert.deepStrictEqual(normalizeJsonRpcMessages([requestMessage, notificationMessage]), [requestMessage, notificationMessage]);

    console.log('streamable HTTP compatibility protocol tests passed');
}

run();
