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
                    return {
                        children: [
                            { children: [] },
                            { children: [{ children: [] }] }
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

async function main() {
    const { DebugTools } = require('../dist/tools/debug-tools');

    await runUnsupportedMessageCase(DebugTools);
    await runMissingAssetsCase(DebugTools);

    console.log('validate_scene compatibility tests passed');
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
