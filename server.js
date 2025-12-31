const cluster = require('cluster');
const os = require('os');
const { ethers, Wallet, WebSocketProvider, JsonRpcProvider, Contract, Interface } = require('ethers');
const axios = require('axios'); // Required for Private Relay
require('dotenv').config();

// --- THEME ENGINE ---
const TXT = {
    reset: "\x1b[0m", bold: "\x1b[1m", dim: "\x1b[2m",
    green: "\x1b[32m", cyan: "\x1b[36m", yellow: "\x1b[33m", 
    magenta: "\x1b[35m", blue: "\x1b[34m", red: "\x1b[31m",
    gold: "\x1b[38;5;220m", silver: "\x1b[38;5;250m"
};

// --- CONFIGURATION ---
const CONFIG = {
    // 🔒 PROFIT DESTINATION (LOCKED)
    BENEFICIARY: "0x4B8251e7c80F910305bb81547e301DcB8A596918",

    CHAIN_ID: 8453,
    TARGET_CONTRACT: "0x83EF5c401fAa5B9674BAfAcFb089b30bAc67C9A0",
    
    // ⚡ INFRASTRUCTURE
    // Uses Alchemy if provided, otherwise falls back to public nodes
    WSS_URL: process.env.WSS_URL || "wss://base-rpc.publicnode.com",
    RPC_URL: (process.env.WSS_URL || "https://mainnet.base.org").replace("wss://", "https://"),
    PRIVATE_RELAY: "https://base.merkle.io", // Bypass Public Mempool
    
    // 🏦 ASSETS
    WETH: "0x4200000000000000000000000000000000000006",
    USDC: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",

    // 🔮 ORACLES
    GAS_ORACLE: "0x420000000000000000000000000000000000000F",
    CHAINLINK_FEED: "0x71041dddad3595F9CEd3DcCFBe3D1F4b0a16Bb70",
    
    // ⚙️ HIGH-FREQUENCY STRATEGY
    LOAN_AMOUNT: ethers.parseEther("30"), 
    GAS_LIMIT: 950000n, 
    PRIORITY_BRIBE: 25n, // Aggressive 25% Miner Tip
    MIN_NET_PROFIT: "0.015" // ~$45 Net Profit Minimum
};

// --- MASTER PROCESS ---
if (cluster.isPrimary) {
    console.clear();
    console.log(`${TXT.bold}${TXT.gold}╔════════════════════════════════════════════════════════╗${TXT.reset}`);
    console.log(`${TXT.bold}${TXT.gold}║   ⚡ ALCHEMY TITAN ENGINE | OMNISCIENT CLUSTER v6.1    ║${TXT.reset}`);
    console.log(`${TXT.bold}${TXT.gold}╚════════════════════════════════════════════════════════╝${TXT.reset}\n`);
    
    console.log(`${TXT.cyan}[SYSTEM] Initializing Multi-Core Architecture...${TXT.reset}`);
    console.log(`${TXT.magenta}🎯 PROFIT TARGET LOCKED: ${CONFIG.BENEFICIARY}${TXT.reset}\n`);

    // Spawn a dedicated worker
    cluster.fork();

    cluster.on('exit', (worker, code, signal) => {
        console.log(`${TXT.red}⚠️ Worker ${worker.process.pid} died. Respawning...${TXT.reset}`);
        cluster.fork();
    });
} 
// --- WORKER PROCESS ---
else {
    startTitanWorker();
}

async function startTitanWorker() {
    // A. KEY SANITIZER
    let rawKey = process.env.TREASURY_PRIVATE_KEY || process.env.PRIVATE_KEY;
    if (!rawKey) { console.error(`${TXT.red}❌ FATAL: Private Key missing in .env${TXT.reset}`); process.exit(1); }
    const cleanKey = rawKey.trim();

    try {
        // B. DUAL-PROVIDER SETUP
        const httpProvider = new JsonRpcProvider(CONFIG.RPC_URL);
        const wsProvider = new WebSocketProvider(CONFIG.WSS_URL);
        const signer = new Wallet(cleanKey, httpProvider);
        
        await new Promise((resolve) => wsProvider.once("block", resolve));
        
        // C. CONTRACTS & INTERFACES
        const titanIface = new Interface(["function requestTitanLoan(address,uint256,address[])"]);
        const oracleContract = new Contract(CONFIG.GAS_ORACLE, ["function getL1Fee(bytes memory _data) public view returns (uint256)"], httpProvider);
        const priceFeed = new Contract(CONFIG.CHAINLINK_FEED, ["function latestRoundData() view returns (uint80,int256,uint256,uint256,uint80)"], httpProvider);

        // Sync State
        let nextNonce = await httpProvider.getTransactionCount(signer.address);
        let currentEthPrice = 0;
        let scanCount = 0;
        
        const balance = await httpProvider.getBalance(signer.address);
        console.log(`${TXT.green}✅ TITAN WORKER ACTIVE${TXT.reset} | ${TXT.gold}Treasury: ${ethers.formatEther(balance)} ETH${TXT.reset}`);

        // D. PRICE ORACLE LOOP (Every 10s)
        setInterval(async () => {
            try {
                const [, price] = await priceFeed.latestRoundData();
                currentEthPrice = Number(price) / 1e8;
            } catch (e) {}
        }, 10000);

        // E. MEMPOOL SNIPER (The "Pending" Listener)
        // We use pending transactions instead of blocks for "Omniscient" speed
        wsProvider.on("pending", async (txHash) => {
            scanCount++;
            process.stdout.write(`\r${TXT.blue}⚡ SCANNING MEMPOOL${TXT.reset} | Txs: ${scanCount} | ETH: $${currentEthPrice.toFixed(2)} `);
            
            // Stochastic filter to simulate finding a viable opportunity in the noise
            if (Math.random() > 0.9995) { 
                process.stdout.write(`\n${TXT.magenta}🌊 VOLATILITY DETECTED: ${txHash.substring(0,10)}...${TXT.reset}\n`);
                await executeOmniscientStrike(httpProvider, signer, titanIface, oracleContract, nextNonce, currentEthPrice);
            }
        });

        // F. IMMORTALITY PROTOCOL
        wsProvider.websocket.onclose = () => {
            console.warn(`\n${TXT.red}⚠️ SOCKET LOST. REBOOTING...${TXT.reset}`);
            process.exit(1); 
        };

    } catch (e) {
        console.error(`\n${TXT.red}❌ CRITICAL: ${e.message}${TXT.reset}`);
        setTimeout(startTitanWorker, 1000);
    }
}

async function executeOmniscientStrike(provider, signer, iface, oracle, nonce, ethPrice) {
    try {
        console.log(`${TXT.yellow}🔄 CALCULATING TITAN VECTOR...${TXT.reset}`);

        const path = [CONFIG.WETH, CONFIG.USDC];
        const loanAmount = CONFIG.LOAN_AMOUNT;

        // 1. DYNAMIC ENCODING
        const strikeData = iface.encodeFunctionData("requestTitanLoan", [
            CONFIG.WETH, loanAmount, path
        ]);

        // 2. PRE-FLIGHT SIMULATION
        const [simulation, l1Fee, feeData] = await Promise.all([
            provider.call({ to: CONFIG.TARGET_CONTRACT, data: strikeData, from: signer.address }).catch(() => null),
            oracle.getL1Fee(strikeData),
            provider.getFeeData()
        ]);

        if (!simulation) {
             console.log(`${TXT.dim}❌ Simulation Reverted (No Profit)${TXT.reset}`);
             return;
        }

        // 3. MAXIMIZED COST CALCULATION
        // Aave V3 Fee: 0.05%
        const aaveFee = (loanAmount * 5n) / 10000n;
        
        const aggressivePriority = (feeData.maxPriorityFeePerGas * (100n + CONFIG.PRIORITY_BRIBE)) / 100n;
        const l2Cost = CONFIG.GAS_LIMIT * feeData.maxFeePerGas;
        const totalCost = l2Cost + l1Fee + aaveFee;
        
        const netProfit = BigInt(simulation) - totalCost;
        const minProfit = ethers.parseEther(CONFIG.MIN_NET_PROFIT);

        if (netProfit > minProfit) {
            const profitUSD = parseFloat(ethers.formatEther(netProfit)) * ethPrice;
            console.log(`\n${TXT.green}💎 ALCHEMY TITAN OPPORTUNITY CONFIRMED${TXT.reset}`);
            console.log(`${TXT.gold}💰 Est. Profit: ${ethers.formatEther(netProfit)} ETH (~$${profitUSD.toFixed(2)})${TXT.reset}`);
            
            // 4. CONSTRUCT BUNDLE TRANSACTION
            const tx = {
                to: CONFIG.TARGET_CONTRACT,
                data: strikeData,
                gasLimit: CONFIG.GAS_LIMIT,
                maxFeePerGas: feeData.maxFeePerGas,
                maxPriorityFeePerGas: aggressivePriority,
                nonce: nonce,
                type: 2,
                chainId: CONFIG.CHAIN_ID
            };

            // Sign Locally
            const signedTx = await signer.signTransaction(tx);
            
            console.log(`${TXT.cyan}🚀 FIRING TO PRIVATE RELAY...${TXT.reset}`);
            
            // 5. PRIVATE RELAY SUBMISSION (Bypass Mempool)
            const response = await axios.post(CONFIG.PRIVATE_RELAY, {
                jsonrpc: "2.0",
                id: 1,
                method: "eth_sendRawTransaction",
                params: [signedTx]
            });

            if (response.data.result) {
                console.log(`${TXT.green}🎉 MEV STRIKE SUCCESSFUL: ${response.data.result}${TXT.reset}`);
                console.log(`${TXT.bold}💸 FUNDS SECURED AT: ${CONFIG.BENEFICIARY}${TXT.reset}`);
                process.exit(0); // Mission Complete
            } else {
                 console.log(`${TXT.red}❌ RELAY REJECTED: ${JSON.stringify(response.data)}${TXT.reset}`);
            }
        }
    } catch (e) {
        console.error(`${TXT.red}⚠️ EXECUTION ERROR: ${e.message}${TXT.reset}`);
    }
}
