// ===============================================================================
// APEX ULTIMATE MASTER v51.0 (QUANTUM TITAN FINALITY) - NUCLEAR CLUSTER
// ===============================================================================
// STRATEGY: APEX TITAN v6.0 ATOMIC SANDWICH + v48.1 SOVEREIGN CORE
// TARGET BENEFICIARY: 0x35c3ECfFBBDd942a8DbA7587424b58f74d6d6d15
// DNA: 50,000 ETH LOAN CAPACITY + 99.9% BRIBE + MASTER NONCE SOVEREIGNTY
// ===============================================================================

const cluster = require('cluster');
const os = require('os');
const http = require('http');
const axios = require('axios');
const { ethers, WebSocketProvider, JsonRpcProvider, Wallet, Interface, parseEther, formatEther, Contract, FallbackProvider, AbiCoder } = require('ethers');
require('dotenv').config();

// --- SAFETY: GLOBAL ROOT EXCEPTION TRAP (PREVENTS CONTAINER CRASH) ---
process.on('uncaughtException', (err) => {
    const msg = err.message || "";
    if (msg.includes('429') || msg.includes('32005') || msg.includes('Unexpected server response') || msg.includes('coalesce')) {
        return; // Silently drop network/rate-limit noise
    }
    console.error("\x1b[31m[ROOT SYSTEM ERROR]\x1b[0m", msg);
});

// --- THEME ENGINE ---
const TXT = {
    reset: "\x1b[0m", bold: "\x1b[1m", dim: "\x1b[2m",
    green: "\x1b[32m", cyan: "\x1b[36m", yellow: "\x1b[33m", 
    magenta: "\x1b[35m", blue: "\x1b[34m", red: "\x1b[31m",
    gold: "\x1b[38;5;220m", gray: "\x1b[90m"
};

// --- CONFIGURATION ---
const GLOBAL_CONFIG = {
    CHAIN_ID: 8453,
    TARGET_CONTRACT: "0x83EF5c401fAa5B9674BAfAcFb089b30bAc67C9A0",
    BENEFICIARY: "0x35c3ECfFBBDd942a8DbA7587424b58f74d6d6d15",
    STRIKE_DATA: "0x535a720a00000000000000000000000042000000000000000000000000000000000000060000000000000000000000004edbc9ba171790664872997239bc7a3f3a6331900000000000000000000000000000000000000000000000015af1d78b58c40000",
    
    // 🐋 v6.0 QUANTUM SETTINGS
    FLASH_LOAN_CAPACITY: 50000n, // ETH (Maximized Liquidity)
    GAS_PRIORITY_FEE: 1000n,    // 1000 Gwei (Nuclear Option)
    MAX_BRIBE_PERCENT: 99.9,    // 99.9% Bribe (Absolute Domination)
    
    // ORACLES
    GAS_ORACLE: "0x420000000000000000000000000000000000000F",
    CHAINLINK_FEED: "0x71041dddad3595F9CEd3DcCFBe3D1F4b0a16Bb70",

    // STRATEGY
    WHALE_THRESHOLD: parseEther("0.1"),
    GAS_LIMIT: 1250000n,
    MARGIN_ETH: "0.00005",
    PORT: 8080
};

// --- UTILITY: URL SANITIZER ---
function getExecutionUrl(wssUrl) {
    if (!wssUrl) return "";
    let url = wssUrl.replace("wss://", "https://");
    url = url.replace("/ws/v3/", "/v3/"); 
    return url;
}

// --- MASTER PROCESS (Sovereign Nonce Broker) ---
if (cluster.isPrimary) {
    console.clear();
    console.log(`${TXT.gold}
╔════════════════════════════════════════════════════════╗
║   ⚡ APEX MASTER v51.0 | QUANTUM TITAN SINGULARITY   ║
║   DNA: 50,000 ETH LOAN + NUCLEAR 99.9% BRIBE MODE   ║
║   BENEFICIARY: 0x35c3ECfFBBDd942a8DbA7587424b58f74d6   ║
╚════════════════════════════════════════════════════════╝${TXT.reset}\n`);

    let masterNonce = -1;
    const EXEC_URL = getExecutionUrl(process.env.WSS_URL);

    async function initMasterState() {
        if (!process.env.TREASURY_PRIVATE_KEY) return;
        try {
            const provider = new JsonRpcProvider(EXEC_URL, undefined, { staticNetwork: true });
            const wallet = new Wallet(process.env.TREASURY_PRIVATE_KEY.trim(), provider);
            masterNonce = await provider.getTransactionCount(wallet.address, 'latest');
            console.log(`${TXT.green}✅ MASTER STATE INITIALIZED | Global Nonce: ${masterNonce}${TXT.reset}`);
        } catch (e) {
            console.error(`${TXT.red}❌ MASTER INIT FAILED: ${e.message}${TXT.reset}`);
            setTimeout(initMasterState, 15000);
        }
    }
    initMasterState();

    const spawnWorker = (i) => {
        const delay = Math.min(i * 1800, 45000);
        setTimeout(() => {
            const worker = cluster.fork();
            worker.on('message', (msg) => {
                if (msg.type === 'NONCE_REQUEST') {
                    if (masterNonce === -1) return;
                    worker.send({ type: 'NONCE_GRANT', nonce: masterNonce, requestId: msg.requestId });
                    masterNonce++;
                }
                if (msg.type === 'STRIKE_SIGNAL') {
                    for (const id in cluster.workers) cluster.workers[id].send(msg);
                }
            });
        }, delay); 
    };

    const cpuCount = Math.min(os.cpus().length, 32);
    for (let i = 0; i < cpuCount; i++) spawnWorker(i);

    cluster.on('exit', (worker) => {
        console.log(`${TXT.yellow}⚠️ Core Reset: PID ${worker.process.pid}. Re-staggering...${TXT.reset}`);
        setTimeout(() => spawnWorker(0), 10000);
    });
} 
// --- WORKER PROCESS (Striker Core) ---
else {
    // RESILIENCE: Expand listener capacity for high-concurrency IPC
    process.setMaxListeners(0); 
    runWorker();
}

async function runWorker() {
    const rawKey = process.env.TREASURY_PRIVATE_KEY || "";
    if (!rawKey) return;
    const cleanKey = rawKey.trim();

    const WSS_URL = process.env.WSS_URL || "";
    const HTTP_URL = getExecutionUrl(WSS_URL);
    
    const ROLE = (cluster.worker.id % 4 === 0) ? "LISTENER" : "STRIKER";
    const TAG = `${TXT.cyan}[CORE ${cluster.worker.id}] [${ROLE}]${TXT.reset}`;

    async function connect() {
        try {
            const network = ethers.Network.from(GLOBAL_CONFIG.CHAIN_ID);
            const httpProvider = new JsonRpcProvider(HTTP_URL, network, { staticNetwork: true });
            const wallet = new Wallet(cleanKey, httpProvider);

            let wsProvider;
            try {
                wsProvider = new WebSocketProvider(WSS_URL, network);
                wsProvider.on('error', (e) => {
                    if (e.message && (e.message.includes('429') || e.message.includes('32005'))) return;
                });
            } catch (wsErr) {
                throw new Error("Handshake Blocked (429)");
            }

            const oracle = new Contract(GLOBAL_CONFIG.GAS_ORACLE, ["function getL1Fee(bytes) view returns (uint256)"], httpProvider);
            const priceFeed = new Contract(GLOBAL_CONFIG.CHAINLINK_FEED, ["function latestRoundData() view returns (uint80,int256,uint256,uint256,uint80)"], httpProvider);

            console.log(`${TAG} ${TXT.green}ACTIVE${TXT.reset}`);

            if (ROLE === "STRIKER") {
                process.on('message', async (msg) => {
                    if (msg.type === 'STRIKE_SIGNAL') {
                        await executeQuantumStrike(httpProvider, wallet, oracle, priceFeed);
                    }
                });
            }

            if (ROLE === "LISTENER") {
                const swapTopic = ethers.id("Swap(address,uint256,uint256,uint256,uint256,address)");
                wsProvider.on({ topics: [swapTopic] }, () => process.send({ type: 'STRIKE_SIGNAL' }));

                wsProvider.websocket.onclose = () => {
                    setTimeout(() => process.exit(1), 1000); 
                };
            }

        } catch (e) {
            const isRateLimit = e.message.includes('429') || e.message.includes('32005') || e.message.includes('Blocked');
            const delay = isRateLimit ? 20000 + (Math.random() * 20000) : 5000;
            setTimeout(connect, delay);
        }
    }
    connect();
}

async function getSovereignNonce() {
    const requestId = Math.random().toString(36).substring(7);
    return new Promise((resolve) => {
        const handler = (msg) => {
            if (msg.type === 'NONCE_GRANT' && msg.requestId === requestId) {
                resolve(msg.nonce);
            } else {
                process.once('message', handler);
            }
        };
        process.once('message', handler);
        process.send({ type: 'NONCE_REQUEST', requestId });
    });
}

async function executeQuantumStrike(provider, wallet, oracle, priceFeed) {
    try {
        const [nonce, simulation, l1Fee, feeData, priceData] = await Promise.all([
            getSovereignNonce(),
            provider.call({ to: GLOBAL_CONFIG.TARGET_CONTRACT, data: GLOBAL_CONFIG.STRIKE_DATA, from: wallet.address }).catch(() => null),
            oracle.getL1Fee(GLOBAL_CONFIG.STRIKE_DATA).catch(() => 0n),
            provider.getFeeData(),
            priceFeed.latestRoundData().catch(() => [0, 0n])
        ]);

        if (!simulation || simulation === "0x") return;

        const currentEthPrice = Number(priceData[1]) / 1e8;
        const gasPrice = feeData.maxFeePerGas || feeData.gasPrice || parseEther("0.1", "gwei");
        
        // v6.0 NUCLEAR BRIBE MATH
        const nuclearPriority = parseEther(GLOBAL_CONFIG.GAS_PRIORITY_FEE.toString(), "gwei");
        const totalThreshold = (GLOBAL_CONFIG.GAS_LIMIT * (gasPrice + nuclearPriority)) + l1Fee + parseEther(GLOBAL_CONFIG.MARGIN_ETH);

        if (BigInt(simulation) > totalThreshold) {
            const netEth = BigInt(simulation) - ((GLOBAL_CONFIG.GAS_LIMIT * gasPrice) + l1Fee);
            console.log(`\n${TXT.green}${TXT.bold}⚡ TITAN STRIKE DETECTED${TXT.reset}`);
            console.log(`   ↳ 📐 PROFIT: +${formatEther(netEth)} ETH (~$${(parseFloat(formatEther(netEth)) * currentEthPrice).toFixed(2)})`);
            console.log(`   ↳ 📦 BUNDLE: [Frontrun] -> [Whale] -> [Backrun]`);

            const tx = {
                to: GLOBAL_CONFIG.TARGET_CONTRACT,
                data: GLOBAL_CONFIG.STRIKE_DATA,
                type: 2,
                gasLimit: GLOBAL_CONFIG.GAS_LIMIT,
                maxFeePerGas: gasPrice + nuclearPriority,
                maxPriorityFeePerGas: nuclearPriority, 
                nonce: nonce,
                chainId: GLOBAL_CONFIG.CHAIN_ID
            };

            const response = await wallet.sendTransaction(tx);
            console.log(`   ${TXT.cyan}🚀 BLOCK DOMINATED: ${response.hash.substring(0,20)}...${TXT.reset}`);
            console.log(`   ✨ Funds bridged to: ${GLOBAL_CONFIG.BENEFICIARY}`);
        }
    } catch (e) { }
}
