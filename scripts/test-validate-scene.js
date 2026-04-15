const assert = require('assert');

async function runUnsupportedMessageCase(DebugTools) {
    const requests = [];

    global.Editor = {
        Message: {
            request: async (channel, message) => {
                requests.push(`${channel}:${message}`);

                if (channel === 'scene' && message === 'check-missing-assets') {
                    throw new Error('Message does not exist: scene - check-missing-assets');
                }

                if (channel === 'scene' && message === 'query-hierarchy') {
                    throw new Error('Message does not exist: scene - query-hierarchy');
                }

                if (channel === 'scene' && message === 'query-node-tree') {
                    return {
                        children: [
                            { uuid: 'node-1', children: [] },
                            { uuid: 'node-2', children: [{ uuid: 'node-2-1', children: [] }] }
                        ]
                    };
                }

                throw new Error(`Unexpected message ${channel}:${message}`);
            }
        },
        Project: {
            name: 'test-project',
            path: 'E:/test-project',
            uuid: 'test-project-uuid'
        }
    };

    const debugTools = new DebugTools();
    const result = await debugTools.execute('validate_scene', {
        checkMissingAssets: true,
        checkPerformance: true
    });

    assert.equal(result.success, true);
    assert.equal(result.data.valid, true);
    assert.equal(result.data.summary.errorCount, 0);
    assert.equal(result.data.summary.infoCount, 1);
    assert.ok(result.data.skippedChecks.includes('missingAssets'));
    assert.ok(result.data.executedChecks.includes('performance'));
    assert.ok(requests.includes('scene:query-hierarchy'));
    assert.ok(requests.includes('scene:query-node-tree'));
}

async function runMissingAssetsCase(DebugTools) {
    global.Editor = {
        Message: {
            request: async (channel, message) => {
                if (channel === 'scene' && message === 'check-missing-assets') {
                    return {
                        missing: [{ uuid: 'missing-asset-uuid' }]
                    };
                }

                if (channel === 'scene' && message === 'query-hierarchy') {
                    return {
                        children: []
                    };
                }

                throw new Error(`Unexpected message ${channel}:${message}`);
            }
        },
        Project: {
            name: 'test-project',
            path: 'E:/test-project',
            uuid: 'test-project-uuid'
        }
    };

    const debugTools = new DebugTools();
    const result = await debugTools.execute('validate_scene', {
        checkMissingAssets: true,
        checkPerformance: true
    });

    assert.equal(result.success, true);
    assert.equal(result.data.valid, false);
    assert.equal(result.data.summary.errorCount, 1);
    assert.ok(result.data.executedChecks.includes('missingAssets'));
    assert.equal(result.data.issues[0].category, 'assets');
}

async function runNodeTreeNormalizationCase(DebugTools) {
    global.Editor = {
        Message: {
            request: async (channel, message, arg) => {
                if (channel === 'scene' && message === 'query-hierarchy') {
                    throw new Error('Message does not exist: scene - query-hierarchy');
                }

                if (channel === 'scene' && message === 'query-node-tree') {
                    return {
                        children: [
                            { uuid: 'root-node-uuid', children: [] }
                        ]
                    };
                }

                if (channel === 'scene' && message === 'query-node' && arg === 'root-node-uuid') {
                    return {
                        uuid: { value: 'root-node-uuid', type: 'String', readonly: false },
                        name: { value: 'Root Node', type: 'String', readonly: false },
                        active: { value: true, type: 'Boolean', readonly: false },
                        children: [
                            { value: 'child-node-uuid', type: 'String', readonly: false }
                        ],
                        __comps__: [
                            { __type__: 'cc.Sprite' }
                        ]
                    };
                }

                if (channel === 'scene' && message === 'query-node' && arg === 'child-node-uuid') {
                    return {
                        uuid: { value: 'child-node-uuid', type: 'String', readonly: false },
                        name: { value: 'Child Node', type: 'String', readonly: false },
                        active: { value: false, type: 'Boolean', readonly: false },
                        children: [],
                        components: [
                            { type: { value: 'cc.Label', type: 'String', readonly: false } }
                        ]
                    };
                }

                throw new Error(`Unexpected message ${channel}:${message}:${arg ?? ''}`);
            }
        },
        Project: {
            name: 'test-project',
            path: 'E:/test-project',
            uuid: 'test-project-uuid'
        }
    };

    const debugTools = new DebugTools();
    const result = await debugTools.execute('get_node_tree', {
        maxDepth: 5
    });

    assert.equal(result.success, true);
    assert.equal(Array.isArray(result.data), true);
    assert.equal(result.data[0].uuid, 'root-node-uuid');
    assert.equal(result.data[0].name, 'Root Node');
    assert.equal(result.data[0].active, true);
    assert.deepStrictEqual(result.data[0].components, ['cc.Sprite']);
    assert.equal(result.data[0].childCount, 1);
    assert.equal(result.data[0].children[0].uuid, 'child-node-uuid');
    assert.equal(result.data[0].children[0].name, 'Child Node');
    assert.equal(result.data[0].children[0].active, false);
    assert.deepStrictEqual(result.data[0].children[0].components, ['cc.Label']);
}

async function main() {
    const { DebugTools } = require('../dist/tools/debug-tools');

    await runUnsupportedMessageCase(DebugTools);
    await runMissingAssetsCase(DebugTools);
    await runNodeTreeNormalizationCase(DebugTools);

    console.log('debug tools compatibility tests passed');
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
