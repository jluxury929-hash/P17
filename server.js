import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  TrendingUp, 
  DollarSign, 
  Users, 
  Rocket, 
  Briefcase, 
  Target, 
  Lock, 
  Unlock,
  RefreshCw,
  ChevronRight,
  PieChart,
  Zap,
  Terminal,
  Cpu,
  Activity,
  Server
} from 'lucide-react';

const Card = ({ children, className = "" }) => (
  <div className={`bg-gray-900 border border-gray-800 rounded-xl p-6 shadow-xl ${className}`}>
    {children}
  </div>
);

const Button = ({ children, onClick, variant = "primary", className = "" }) => {
  const baseStyle = "px-4 py-2 rounded-lg font-bold transition-all duration-200 flex items-center justify-center gap-2";
  const variants = {
    primary: "bg-gradient-to-r from-emerald-500 to-emerald-700 hover:from-emerald-400 hover:to-emerald-600 text-white shadow-lg shadow-emerald-900/50",
    secondary: "bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-700",
    gold: "bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-400 hover:to-amber-500 text-black shadow-lg shadow-amber-900/50",
    danger: "bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 text-white shadow-lg shadow-rose-900/50"
  };

  return (
    <button onClick={onClick} className={`${baseStyle} ${variants[variant]} ${className}`}>
      {children}
    </button>
  );
};

const Slider = ({ label, value, min, max, onChange, prefix = "", suffix = "", step = 1, color = "emerald" }) => (
  <div className="mb-6">
    <div className="flex justify-between mb-2">
      <span className="text-gray-400 text-sm font-medium">{label}</span>
      <span className={`text-${color}-400 font-mono font-bold`}>
        {prefix}{value.toLocaleString()}{suffix}
      </span>
    </div>
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      className={`w-full h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-${color}-500 hover:accent-${color}-400`}
    />
  </div>
);

// --- MEV Simulator Component ---

const MevSimulator = () => {
  const [capital, setCapital] = useState(100); // ETH - Default higher
  const [gasPriority, setGasPriority] = useState(150); // Gwei - Default higher
  const [competitors, setCompetitors] = useState(3);
  const [logs, setLogs] = useState([]);
  const logsEndRef = useRef(null);

  // Simulation Logic - WHALE MODE
  const ethPrice = 3500; 
  // Adjusted win rate formula to be "guaranteed" at high gas
  const winRate = Math.min(99.9, (gasPriority / (gasPriority + competitors)) * 100);
  
  // "Whale trades" logic: significantly higher base profit
  const avgArbProfit = 0.85; // ETH per win (Was 0.05)
  const blocksPerDay = 7200;
  
  // Daily Profit Calculation
  const capitalMultiplier = Math.log10(capital) * 2.0; // Stronger capital leverage
  const opportunitiesPerDay = Math.floor(blocksPerDay * 0.15); // 15% of blocks (High freq)
  const dailyWins = Math.floor(opportunitiesPerDay * (winRate / 100));
  const dailyProfitETH = dailyWins * avgArbProfit * capitalMultiplier;
  const dailyProfitUSD = dailyProfitETH * ethPrice;
  const daysToMillion = dailyProfitUSD > 0 ? Math.ceil(1000000 / dailyProfitUSD) : "∞";

  // Terminal Effect
  useEffect(() => {
    const interval = setInterval(() => {
      const actions = [
        "Scanning Mempool (High Velocity)...",
        "WHALE DETECTED: 500 ETH Swap Pending...",
        "Executing Sandwich Attack v3...",
        `Gas War: Bumping priority to ${gasPriority + 50} Gwei`,
        "Flashbots Bundle: BLOCK SECURED",
        "Sniper Bot: Target Acquired",
        "Frontrunning large DEX trade...",
        "Liquidation: 100% Probability"
      ];
      
      const randomAction = actions[Math.floor(Math.random() * actions.length)];
      const isProfit = Math.random() < (winRate / 100);
      // Massive profit ranges for "Plenty" of ETH
      const profitAmt = (Math.random() * 2.5 * capitalMultiplier).toFixed(4);
      
      let newLog = { text: randomAction, type: 'info' };
      
      if ((randomAction.includes("Bundle") || randomAction.includes("WHALE") || randomAction.includes("Liquidation")) && isProfit) {
        newLog = { text: `SUCCESS: Whale Trade Captured +${profitAmt} ETH`, type: 'success' };
      } else if (!isProfit) {
         newLog = { text: `MISSED: Slippage Exceeded`, type: 'error' };
      }

      setLogs(prev => [...prev.slice(-6), newLog]);
    }, 400); // Super fast 400ms interval

    return () => clearInterval(interval);
  }, [winRate, capitalMultiplier, gasPriority]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <div className="p-4 bg-rose-900/10 border border-rose-900/30 rounded-lg mb-6 relative overflow-hidden">
             <div className="absolute top-0 right-0 p-2 opacity-20">
                <Zap className="w-16 h-16 text-rose-500" />
             </div>
             <div className="flex items-center gap-2 text-rose-400 font-bold mb-1 relative z-10">
               <Zap className="w-4 h-4 animate-pulse" /> WHALE HUNTER MODE ACTIVE
             </div>
             <p className="text-xs text-rose-300/70 relative z-10">
               Ultra-low latency execution enabled. Targeting large volume trades with atomic execution guarantees.
             </p>
          </div>

          <Slider 
            label="Operating Capital (ETH)" 
            value={capital} 
            min={10} 
            max={5000} 
            step={10}
            suffix=" ETH" 
            color="rose"
          />
          <Slider 
            label="Gas Priority Fee (Aggression)" 
            value={gasPriority} 
            min={50} 
            max={2000} 
            suffix=" Gwei" 
            color="rose"
          />
          <Slider 
            label="Active Competitors" 
            value={competitors} 
            min={1} 
            max={50} 
            color="rose"
          />
        </div>

        <div className="flex flex-col gap-4">
           {/* Terminal Window */}
           <div className="bg-black border border-rose-900/50 rounded-lg p-4 font-mono text-xs h-48 overflow-hidden flex flex-col relative shadow-[0_0_30px_rgba(225,29,72,0.15)]">
             <div className="absolute top-2 right-2 flex gap-1">
               <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
               <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
               <div className="w-2 h-2 rounded-full bg-green-500"></div>
             </div>
             <div className="text-rose-500 mb-2 border-b border-rose-900/30 pb-2 font-bold">root@whale-hunter:~/ultra_fast# ./execute_all.sh --force</div>
             <div className="flex-1 flex flex-col justify-end space-y-1">
               {logs.map((log, i) => (
                 <div key={i} className={`${log.type === 'success' ? 'text-green-400 font-bold' : log.type === 'error' ? 'text-red-400' : 'text-gray-400'}`}>
                   <span className="opacity-50">[{new Date().toLocaleTimeString()}:{new Date().getMilliseconds()}]</span> {log.text}
                 </div>
               ))}
             </div>
           </div>

          <div className="grid grid-cols-2 gap-4">
            <Card className="flex flex-col justify-center items-center bg-gray-800/50 border-rose-900/30">
              <h3 className="text-gray-400 text-xs uppercase tracking-wider mb-2">Est. Daily Profit</h3>
              <div className="text-2xl font-bold text-white flex items-center gap-2">
                <DollarSign className="text-rose-500 w-5 h-5" />
                {Math.floor(dailyProfitUSD).toLocaleString()}
              </div>
            </Card>
            
            <Card className="flex flex-col justify-center items-center bg-gray-800/50 border-rose-900/30">
              <h3 className="text-gray-400 text-xs uppercase tracking-wider mb-2">Time to $1M</h3>
              <div className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-rose-400 to-amber-400 flex items-center gap-2">
                <Target className="text-rose-500 w-6 h-6" />
                {daysToMillion} <span className="text-sm font-normal text-gray-500 text-white">Days</span>
              </div>
            </Card>
          </div>
        </div>
      </div>
      
      <div className="p-4 bg-gray-900 border border-gray-800 rounded-lg flex items-center justify-between">
         <div className="flex items-center gap-4">
           <div className="p-2 bg-rose-500/10 rounded-lg">
             <Activity className="text-rose-500 w-6 h-6" />
           </div>
           <div>
             <div className="text-sm text-gray-400">Win Rate Probability</div>
             <div className="text-xl font-bold text-white">{winRate.toFixed(1)}%</div>
           </div>
         </div>
         <div className="h-10 w-px bg-gray-800 mx-4"></div>
         <div className="flex items-center gap-4">
           <div className="p-2 bg-rose-500/10 rounded-lg">
             <Server className="text-rose-500 w-6 h-6" />
           </div>
           <div>
             <div className="text-sm text-gray-400">Network Latency</div>
             <div className="text-xl font-bold text-emerald-400">0.01ms</div>
           </div>
         </div>
      </div>
    </div>
  );
};

// --- Existing Sub-Components ---

const SaasSimulator = () => {
  const [price, setPrice] = useState(49);
  const [churn, setChurn] = useState(5);
  const [growth, setGrowth] = useState(10);
  
  // Calculate requirements to hit $1M ARR ($83,333 MRR)
  const targetMRR = 83333;
  const customersNeeded = Math.ceil(targetMRR / price);
  const estimatedMonths = useMemo(() => {
    let users = 10; // Start with 10 users
    let months = 0;
    // Safety break loop
    while (users * price < targetMRR && months < 120) {
      const netGrowth = users * (growth / 100);
      const netChurn = users * (churn / 100);
      users = users + netGrowth - netChurn;
      months++;
    }
    return months >= 120 ? "10+ Years" : `${months} Months`;
  }, [price, churn, growth]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-6">
          <Slider 
            label="Product Price (Monthly)" 
            value={price} 
            min={5} 
            max={500} 
            prefix="$" 
          />
          <Slider 
            label="Monthly Growth Rate" 
            value={growth} 
            min={1} 
            max={50} 
            suffix="%" 
          />
          <Slider 
            label="Monthly Churn Rate" 
            value={churn} 
            min={0} 
            max={20} 
            step={0.1}
            suffix="%" 
          />
        </div>

        <div className="flex flex-col gap-4">
          <Card className="flex-1 flex flex-col justify-center items-center bg-gray-800/50 border-emerald-900/30">
            <h3 className="text-gray-400 text-sm uppercase tracking-wider mb-2">Customers Needed</h3>
            <div className="text-4xl font-bold text-white flex items-center gap-2">
              <Users className="text-emerald-500 w-8 h-8" />
              {customersNeeded.toLocaleString()}
            </div>
            <p className="text-xs text-gray-500 mt-2">To reach $1M Annual Recurring Revenue</p>
          </Card>
          
          <Card className="flex-1 flex flex-col justify-center items-center bg-gray-800/50 border-emerald-900/30">
            <h3 className="text-gray-400 text-sm uppercase tracking-wider mb-2">Time to $1M ARR</h3>
            <div className="text-4xl font-bold text-white flex items-center gap-2">
              <Rocket className="text-amber-500 w-8 h-8" />
              {estimatedMonths}
            </div>
            <p className="text-xs text-gray-500 mt-2">Based on current growth vs churn</p>
          </Card>
        </div>
      </div>
      
      <div className="p-4 bg-emerald-900/20 border border-emerald-900/50 rounded-lg text-sm text-emerald-200">
        <strong>Strategy Tip:</strong> Selling a 
        <span className="font-bold text-white"> ${price}</span> product requires finding 
        <span className="font-bold text-white"> {Math.ceil(customersNeeded / 12)}</span> new customers every month (avg) to hit your goal in a year.
      </div>
    </div>
  );
};

const CompoundSimulator = () => {
  const [initial, setInitial] = useState(10000);
  const [monthly, setMonthly] = useState(2000);
  const [rate, setRate] = useState(8);
  const [years, setYears] = useState(10);

  const futureValue = useMemo(() => {
    let balance = initial;
    for (let i = 0; i < years * 12; i++) {
      balance = balance * (1 + (rate / 100) / 12) + monthly;
    }
    return balance;
  }, [initial, monthly, rate, years]);

  const isMillionaire = futureValue >= 1000000;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-6">
          <Slider label="Initial Investment" value={initial} min={0} max={100000} step={1000} prefix="$" />
          <Slider label="Monthly Contribution" value={monthly} min={0} max={10000} step={100} prefix="$" />
          <Slider label="Annual Return Rate" value={rate} min={1} max={30} suffix="%" />
          <Slider label="Time Horizon" value={years} min={1} max={40} suffix=" Years" />
        </div>

        <div className="flex flex-col justify-center">
          <Card className={`flex flex-col justify-center items-center h-full transition-colors duration-500 ${isMillionaire ? 'bg-emerald-900/20 border-emerald-500/50' : 'bg-gray-800/50'}`}>
            <h3 className="text-gray-400 text-sm uppercase tracking-wider mb-2">Projected Net Worth</h3>
            <div className={`text-4xl md:text-5xl font-bold flex items-center gap-2 ${isMillionaire ? 'text-emerald-400' : 'text-white'}`}>
              <DollarSign className="w-8 h-8 md:w-10 md:h-10" />
              {Math.floor(futureValue).toLocaleString()}
            </div>
            
            <div className="mt-8 w-full bg-gray-700 h-4 rounded-full overflow-hidden relative">
              <div 
                className={`h-full transition-all duration-500 ${isMillionaire ? 'bg-amber-400 shadow-[0_0_15px_rgba(251,191,36,0.6)]' : 'bg-emerald-500'}`}
                style={{ width: `${Math.min((futureValue / 1000000) * 100, 100)}%` }}
              ></div>
            </div>
            <div className="flex justify-between w-full mt-2 text-xs text-gray-500 font-mono">
              <span>$0</span>
              <span>TARGET: $1,000,000</span>
            </div>
            
            {isMillionaire && (
              <div className="mt-6 flex items-center gap-2 text-amber-400 animate-pulse font-bold">
                <Unlock className="w-5 h-5" />
                <span>MILLIONAIRE STATUS UNLOCKED</span>
              </div>
            )}
            {!isMillionaire && (
               <div className="mt-6 flex items-center gap-2 text-gray-500">
               <Lock className="w-5 h-5" />
               <span>{(1000000 - futureValue).toLocaleString()} to go</span>
             </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

export default function MillionaireBlueprint() {
  const [activeTab, setActiveTab] = useState('mev'); // Defaulted to MEV

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-gray-100 font-sans selection:bg-emerald-500/30">
      <div className="max-w-5xl mx-auto px-4 py-8">
        
        {/* Header */}
        <header className="mb-12 text-center">
          <div className="inline-flex items-center justify-center p-3 bg-gray-900 rounded-full border border-gray-800 mb-4 shadow-2xl">
            <TrendingUp className="w-6 h-6 text-emerald-500 mr-2" />
            <span className="text-emerald-500 font-bold tracking-wider text-sm">WEALTH SIMULATOR v2.1</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-black text-white mb-4 tracking-tight">
            The <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">Millionaire</span> Blueprint
          </h1>
          <p className="text-gray-400 max-w-xl mx-auto text-lg">
            Simulate your path to $1M via Business, Investing, or High-Frequency MEV.
          </p>
        </header>

        {/* Navigation */}
        <div className="flex flex-wrap justify-center gap-2 mb-8 bg-gray-900/50 p-2 rounded-xl border border-gray-800 w-fit mx-auto">
          <button 
            onClick={() => setActiveTab('mev')}
            className={`px-6 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'mev' ? 'bg-rose-900/50 text-white shadow-lg border border-rose-800' : 'text-gray-500 hover:text-gray-300'}`}
          >
            <Zap className="w-4 h-4" /> MEV Bot
          </button>
          <button 
            onClick={() => setActiveTab('saas')}
            className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'saas' ? 'bg-gray-800 text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}
          >
            Business Scaler
          </button>
          <button 
            onClick={() => setActiveTab('compound')}
            className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'compound' ? 'bg-gray-800 text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}
          >
            Compound Growth
          </button>
        </div>

        {/* Content Area */}
        <main className="max-w-4xl mx-auto">
          {activeTab === 'mev' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
               <div className="flex items-center justify-between mb-6">
                 <h2 className="text-2xl font-bold flex items-center gap-2 text-rose-500">
                   <Cpu className="text-rose-500" />
                   High-Frequency MEV Bot
                 </h2>
                 <span className="text-xs font-mono text-rose-500 bg-rose-900/20 px-2 py-1 rounded border border-rose-900/50 animate-pulse">LIVE SIMULATION</span>
              </div>
              <Card className="border-rose-900/20">
                <MevSimulator />
              </Card>
            </div>
          )}

          {activeTab === 'saas' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center justify-between mb-6">
                 <h2 className="text-2xl font-bold flex items-center gap-2">
                   <Briefcase className="text-emerald-400" />
                   SaaS & Business Model
                 </h2>
                 <span className="text-xs font-mono text-gray-500 bg-gray-900 px-2 py-1 rounded border border-gray-800">TARGET: $1M ARR</span>
              </div>
              <Card>
                <SaasSimulator />
              </Card>
            </div>
          )}

          {activeTab === 'compound' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
               <div className="flex items-center justify-between mb-6">
                 <h2 className="text-2xl font-bold flex items-center gap-2">
                   <PieChart className="text-emerald-400" />
                   Investment Strategy
                 </h2>
                 <span className="text-xs font-mono text-gray-500 bg-gray-900 px-2 py-1 rounded border border-gray-800">TARGET: NET WORTH</span>
              </div>
              <Card>
                <CompoundSimulator />
              </Card>
            </div>
          )}
        </main>

        <footer className="mt-16 text-center text-gray-600 text-xs">
          <p>This tool is for educational and visualization purposes only. <br/>Results strictly dependent on execution, market conditions, and relentless drive.</p>
        </footer>

      </div>
    </div>
  );
}
