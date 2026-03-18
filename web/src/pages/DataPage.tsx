import React, { useState, useEffect } from 'react'
import { Target, TrendingUp, TrendingDown } from 'lucide-react'

// Define data types
interface NetflowData {
  amount: number;
  price: number;
  price_delta_percent: number;
  rank: number;
  symbol: string;
}

interface AI500Data {
  pair: string;
  score: number;
  start_time: number;
  start_price: number;
  last_score: number;
  max_score: number;
  max_price: number;
  increase_percent: number;
}

interface QueryRankData {
  rank: number;
  symbol: string;
  query_count: number;
  future_flow: number;
}

interface AI300Data {
  rank: number;
  symbol: string;
  future_flow: number;
  spot_flow: number;
  level: string;
}

interface OIData {
  rank: number;
  symbol: string;
  price: number;
  price_delta_percent: number;
  oi_delta_value: number;
  oi_delta_percent: number;
  current_oi: number;
}

function formatCurrency(num: number) {
  if (Math.abs(num) >= 1e9) {
    return (num / 1e9).toFixed(2) + 'B'
  }
  if (Math.abs(num) >= 1e6) {
    return (num / 1e6).toFixed(2) + 'M'
  }
  if (Math.abs(num) >= 1e3) {
    return (num / 1e3).toFixed(2) + 'K'
  }
  return num.toFixed(2)
}

function formatPercent(num: number) {
  return `${num > 0 ? '+' : ''}${num.toFixed(2)}%`
}

function Panel({ title, badge, children, className = "", headerRight }: { title: string, badge?: string, children: React.ReactNode, className?: string, headerRight?: React.ReactNode }) {
  return (
    <div className={`flex flex-col bg-nofx-bg border border-white/10 rounded-sm overflow-hidden ${className}`}>
      <div className="flex items-center justify-between px-3 py-2 border-b border-white/10 bg-nofx-bg-lighter">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-nofx-text tracking-wider">{title}</span>
          {badge && <span className="text-nofx-success text-[10px] animate-pulse">{badge}</span>}
        </div>
        {headerRight}
      </div>
      <div className="flex-1 overflow-auto p-3 scrollbar-hide">
        {children}
      </div>
    </div>
  )
}

function SkeletonBox({ className = "" }: { className?: string }) {
  return <div className={`bg-white/5 animate-pulse rounded-sm ${className}`}></div>
}

export function DataPage() {
  const [activeTab, setActiveTab] = useState('netflow')

  const tabs = [
    { id: 'netflow', label: 'NETFLOW' },
    { id: 'oi', label: 'OI' },
    { id: 'depth', label: 'DEPTH' },
    { id: 'price', label: 'PRICE' },
    { id: 'funding', label: 'FUNDING' }
  ]

  const timeframes = ['5M', '15M', '30M', '1H', '4H', '8H', '24H']
  const [activeTimeframe, setActiveTimeframe] = useState('1H')

  const [topNetflow, setTopNetflow] = useState<NetflowData[]>([])
  const [lowNetflow, setLowNetflow] = useState<NetflowData[]>([])
  const [topOI, setTopOI] = useState<OIData[]>([])
  const [lowOI, setLowOI] = useState<OIData[]>([])
  const [ai500Data, setAi500Data] = useState<AI500Data[]>([])
  const [ai300Data, setAi300Data] = useState<AI300Data[]>([])
  const [queryRankData, setQueryRankData] = useState<QueryRankData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isAi500Loading, setIsAi500Loading] = useState(true)
  const [isAi300Loading, setIsAi300Loading] = useState(true)
  const [isQueryRankLoading, setIsQueryRankLoading] = useState(true)

  // Fetch AI300 Data
  useEffect(() => {
    const fetchAi300 = async () => {
      setIsAi300Loading(true)
      try {
        const auth = 'cm_568c67eae410d912c54c'
        const res = await fetch(`https://nofxos.ai/api/ai300/list?limit=15&auth=${auth}`).then(r => r.json())
        if (res.success && res.data?.coins) {
          setAi300Data(res.data.coins)
        }
      } catch (error) {
        console.error('Failed to fetch AI300 data:', error)
      } finally {
        setIsAi300Loading(false)
      }
    }
    fetchAi300()
  }, [])

  // Fetch Query Rank Data
  useEffect(() => {
    const fetchQueryRank = async () => {
      setIsQueryRankLoading(true)
      try {
        const auth = 'cm_568c67eae410d912c54c'
        const res = await fetch(`https://nofxos.ai/api/query-rank/list?limit=8&auth=${auth}`).then(r => r.json())
        if (res.success && res.data?.rankings) {
          setQueryRankData(res.data.rankings)
        }
      } catch (error) {
        console.error('Failed to fetch query rank data:', error)
      } finally {
        setIsQueryRankLoading(false)
      }
    }
    fetchQueryRank()
  }, [])

  // Fetch AI500 Data
  useEffect(() => {
    const fetchAi500 = async () => {
      setIsAi500Loading(true)
      try {
        const auth = 'cm_568c67eae410d912c54c'
        const res = await fetch(`https://nofxos.ai/api/ai500/list?limit=15&auth=${auth}`).then(r => r.json())
        if (res.success && res.data?.coins) {
          setAi500Data(res.data.coins)
        }
      } catch (error) {
        console.error('Failed to fetch AI500 data:', error)
      } finally {
        setIsAi500Loading(false)
      }
    }
    fetchAi500()
  }, [])

  // Fetch Netflow Data
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      try {
        const tfMap: Record<string, string> = {
          '5M': '5m', '15M': '15m', '30M': '30m', '1H': '1h', '4H': '4h', '8H': '8h', '24H': '24h'
        }
        const duration = tfMap[activeTimeframe] || '1h'
        const auth = 'cm_568c67eae410d912c54c'
        
        const [topRes, lowRes] = await Promise.all([
          fetch(`https://nofxos.ai/api/netflow/top-ranking?limit=20&duration=${duration}&auth=${auth}`).then(res => res.json()),
          fetch(`https://nofxos.ai/api/netflow/low-ranking?limit=20&duration=${duration}&auth=${auth}`).then(res => res.json())
        ])

        if (topRes.success && topRes.data?.netflows) {
          setTopNetflow(topRes.data.netflows)
        }
        if (lowRes.success && lowRes.data?.netflows) {
          setLowNetflow(lowRes.data.netflows)
        }
      } catch (error) {
        console.error('Failed to fetch netflow data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    if (activeTab === 'netflow') {
      fetchData()
    } else if (activeTab === 'oi') {
      const fetchOIData = async () => {
        setIsLoading(true)
        try {
          const tfMap: Record<string, string> = {
            '5M': '5m', '15M': '15m', '30M': '30m', '1H': '1h', '4H': '4h', '8H': '8h', '24H': '24h'
          }
          const duration = tfMap[activeTimeframe] || '1h'
          const auth = 'cm_568c67eae410d912c54c'
          
          const [topRes, lowRes] = await Promise.all([
            fetch(`https://nofxos.ai/api/oi/top-ranking?limit=20&duration=${duration}&auth=${auth}`).then(res => res.json()),
            fetch(`https://nofxos.ai/api/oi/low-ranking?limit=20&duration=${duration}&auth=${auth}`).then(res => res.json())
          ])

          if (topRes.success && topRes.data?.positions) {
            setTopOI(topRes.data.positions)
          }
          if (lowRes.success && lowRes.data?.positions) {
            setLowOI(lowRes.data.positions)
          }
        } catch (error) {
          console.error('Failed to fetch OI data:', error)
        } finally {
          setIsLoading(false)
        }
      }
      fetchOIData()
    }
  }, [activeTab, activeTimeframe])

  return (
    <div className="w-full h-[calc(100vh-64px)] bg-nofx-bg-deeper text-nofx-text font-mono flex flex-col relative overflow-hidden">
      {/* Background scanlines */}
      <div className="absolute inset-0 pointer-events-none crt-overlay z-0"></div>

      {/* Header */}
      <header className="flex items-center justify-between px-4 py-2 border-b border-white/10 bg-nofx-bg z-10">
        <div className="flex items-center gap-6">
          <div className="text-xl font-bold tracking-tighter">NOFX<span className="text-nofx-gold">.TERMINAL</span></div>
          <div className="flex items-center gap-1 text-xs bg-nofx-bg-lighter border border-white/10 px-2 py-1 rounded-sm">
            <span className="text-nofx-accent w-6">15</span>
            <div className="flex gap-2 ml-1 border-l border-white/10 pl-2">
              <span className="text-nofx-text-muted hover:text-nofx-gold cursor-pointer transition-colors">3s</span>
              <span className="text-nofx-text-muted hover:text-nofx-gold cursor-pointer transition-colors">5s</span>
              <span className="text-nofx-gold cursor-pointer">15s</span>
            </div>
          </div>
        </div>
        
        <div className="flex gap-4 text-xs">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1 border border-white/10 rounded-sm transition-all ${
                activeTab === tab.id 
                  ? 'bg-nofx-gold/20 text-nofx-gold border-nofx-gold/50' 
                  : 'bg-nofx-bg-lighter text-nofx-text-muted hover:text-nofx-text'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </header>

      {/* Main Grid */}
      <div className="flex-1 grid grid-cols-12 gap-2 p-2 overflow-hidden z-10">
        
        {/* Column 1: AI SIGNALS */}
        <Panel title="AI_SIGNALS" badge="● LIVE" className="col-span-2 h-full">
          <div className="space-y-6 flex flex-col h-full">
            <div className="flex-1 flex flex-col min-h-0">
              <div className="text-[10px] text-nofx-text-muted mb-2 px-1 shrink-0">AI500 MODEL &gt; 80</div>
              <div className="space-y-1.5 overflow-y-auto pr-1 scrollbar-hide flex-1">
                {isAi500Loading ? (
                  <>
                    <SkeletonBox className="h-12 w-full" />
                    <SkeletonBox className="h-12 w-full" />
                    <SkeletonBox className="h-12 w-full" />
                  </>
                ) : (
                  ai500Data.map((item) => (
                    <div key={item.pair} className="flex flex-col p-2 bg-nofx-bg-lighter/50 border border-white/5 rounded-sm hover:border-nofx-gold/30 transition-colors">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-nofx-gold">{item.pair.replace('USDT', '')}</span>
                        <span className="text-[10px] bg-nofx-gold/10 text-nofx-gold px-1 rounded">
                          {item.score.toFixed(1)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="text-nofx-text-muted">${item.start_price}</span>
                        <div className={`flex items-center gap-0.5 ${item.increase_percent >= 0 ? 'text-nofx-success' : 'text-nofx-danger'}`}>
                          {item.increase_percent >= 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                          {formatPercent(item.increase_percent)}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
            <div className="shrink-0 flex flex-col min-h-0 h-1/2 mt-4">
              <div className="text-[10px] text-nofx-text-muted mb-2 px-1 shrink-0">FLOW_ALGO</div>
              <div className="space-y-1.5 overflow-y-auto pr-1 scrollbar-hide flex-1">
                {isAi300Loading ? (
                  <>
                    <SkeletonBox className="h-8 w-full" />
                    <SkeletonBox className="h-8 w-full" />
                    <SkeletonBox className="h-8 w-full" />
                  </>
                ) : (
                  ai300Data.map((item) => (
                    <div key={item.symbol} className="flex items-center justify-between p-2 bg-nofx-bg-lighter/50 border border-white/5 rounded-sm hover:border-nofx-accent/30 transition-colors">
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-bold px-1.5 rounded-sm ${
                          item.level === 'S' ? 'bg-nofx-danger/20 text-nofx-danger' : 
                          item.level === 'A' ? 'bg-nofx-gold/20 text-nofx-gold' : 
                          'bg-nofx-success/20 text-nofx-success'
                        }`}>
                          {item.level}
                        </span>
                        <span className="text-xs font-bold text-nofx-text">{item.symbol}</span>
                      </div>
                      <div className="text-right">
                        <div className={`text-[10px] font-mono ${item.future_flow >= 0 ? 'text-nofx-success' : 'text-nofx-danger'}`}>
                          {item.future_flow >= 0 ? '+' : ''}{formatCurrency(item.future_flow)}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </Panel>

        {/* Column 2: Main Content Area */}
        <Panel 
          title={`${activeTab.toUpperCase()}_MONITOR`} 
          className="col-span-6 h-full"
          headerRight={
            <div className="flex gap-1">
              {timeframes.map(tf => (
                <button 
                  key={tf}
                  onClick={() => setActiveTimeframe(tf)}
                  className={`text-[10px] px-1.5 py-0.5 rounded-sm transition-colors ${
                    activeTimeframe === tf 
                      ? 'bg-nofx-gold/20 text-nofx-gold' 
                      : 'text-nofx-text-muted hover:text-nofx-text'
                  }`}
                >
                  {tf}
                </button>
              ))}
            </div>
          }
        >
          <div className="h-full flex flex-col gap-4">
            <div className="flex-1 border border-white/5 bg-black/20 p-3 rounded-sm flex flex-col overflow-hidden">
              <div className="text-xs text-nofx-success mb-3 flex justify-between items-center shrink-0">
                <span>{activeTab === 'oi' ? 'OI INCREASE' : 'TOP INFLOW'}</span>
                <span className="px-1.5 py-0.5 bg-nofx-bg-lighter rounded-sm border border-white/10 text-[10px] text-nofx-text">{activeTimeframe}</span>
              </div>
              <div className="space-y-1.5 flex-1 overflow-y-auto pr-1 scrollbar-hide">
                {isLoading ? (
                  <>
                    <SkeletonBox className="h-10 w-full" />
                    <SkeletonBox className="h-10 w-full" />
                    <SkeletonBox className="h-10 w-full" />
                  </>
                ) : activeTab === 'netflow' ? (
                  topNetflow.map((item, idx) => (
                    <div key={item.symbol} className="flex items-center justify-between p-2 bg-nofx-bg-lighter/50 border border-white/5 rounded-sm hover:border-nofx-success/30 transition-colors">
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] text-nofx-text-muted w-4">{idx + 1}</span>
                        <div>
                          <div className="text-xs font-bold">{item.symbol.replace('USDT', '')}</div>
                          <div className="text-[10px] text-nofx-text-muted">${item.price}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-nofx-success font-mono">+{formatCurrency(item.amount)}</div>
                        <div className={`text-[10px] ${item.price_delta_percent >= 0 ? 'text-nofx-success' : 'text-nofx-danger'} flex items-center justify-end gap-0.5`}>
                          {item.price_delta_percent >= 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                          {formatPercent(item.price_delta_percent)}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  topOI.map((item, idx) => (
                    <div key={item.symbol} className="flex items-center justify-between p-2 bg-nofx-bg-lighter/50 border border-white/5 rounded-sm hover:border-nofx-success/30 transition-colors">
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] text-nofx-text-muted w-4">{idx + 1}</span>
                        <div>
                          <div className="text-xs font-bold">{item.symbol.replace('USDT', '')}</div>
                          <div className="text-[10px] text-nofx-text-muted">${item.price}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-nofx-success font-mono">+{formatCurrency(item.oi_delta_value)}</div>
                        <div className="text-[10px] text-nofx-text-muted flex items-center justify-end gap-0.5">
                          OI: +{formatPercent(item.oi_delta_percent)}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
            <div className="flex-1 border border-white/5 bg-black/20 p-3 rounded-sm flex flex-col overflow-hidden">
              <div className="text-xs text-nofx-danger mb-3 shrink-0">{activeTab === 'oi' ? 'OI DECREASE' : 'TOP OUTFLOW'}</div>
              <div className="space-y-1.5 flex-1 overflow-y-auto pr-1 scrollbar-hide">
                {isLoading ? (
                  <>
                    <SkeletonBox className="h-10 w-full" />
                    <SkeletonBox className="h-10 w-full" />
                  </>
                ) : activeTab === 'netflow' ? (
                  lowNetflow.map((item, idx) => (
                    <div key={item.symbol} className="flex items-center justify-between p-2 bg-nofx-bg-lighter/50 border border-white/5 rounded-sm hover:border-nofx-danger/30 transition-colors">
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] text-nofx-text-muted w-4">{idx + 1}</span>
                        <div>
                          <div className="text-xs font-bold">{item.symbol.replace('USDT', '')}</div>
                          <div className="text-[10px] text-nofx-text-muted">${item.price}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-nofx-danger font-mono">{formatCurrency(item.amount)}</div>
                        <div className={`text-[10px] ${item.price_delta_percent >= 0 ? 'text-nofx-success' : 'text-nofx-danger'} flex items-center justify-end gap-0.5`}>
                          {item.price_delta_percent >= 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                          {formatPercent(item.price_delta_percent)}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  lowOI.map((item, idx) => (
                    <div key={item.symbol} className="flex items-center justify-between p-2 bg-nofx-bg-lighter/50 border border-white/5 rounded-sm hover:border-nofx-danger/30 transition-colors">
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] text-nofx-text-muted w-4">{idx + 1}</span>
                        <div>
                          <div className="text-xs font-bold">{item.symbol.replace('USDT', '')}</div>
                          <div className="text-[10px] text-nofx-text-muted">${item.price}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-nofx-danger font-mono">{formatCurrency(item.oi_delta_value)}</div>
                        <div className="text-[10px] text-nofx-text-muted flex items-center justify-end gap-0.5">
                          OI: {formatPercent(item.oi_delta_percent)}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </Panel>

        {/* Column 3: Detail Column */}
        <Panel title="ASSET_DETAIL" className="col-span-2 h-full">
          <div className="flex flex-col items-center justify-center h-full text-center p-4 opacity-70">
            <Target className="w-8 h-8 text-nofx-text-muted mb-4 opacity-50" />
            <div className="text-nofx-text-muted text-xs mb-2">SELECT AN ASSET</div>
            <div className="text-[10px] text-nofx-text-muted/60">Click any coin to view details</div>
          </div>
        </Panel>

        {/* Column 4: Market Pulse */}
        <Panel title="MARKET_PULSE" className="col-span-2 h-full flex flex-col">
          <div className="flex-1 space-y-4 flex flex-col min-h-0">
            <div className="flex-1 flex flex-col min-h-0">
              <div className="text-[10px] text-nofx-text-muted mb-2 px-1 shrink-0">COMMUNITY HITS</div>
              <div className="space-y-1.5 overflow-y-auto pr-1 scrollbar-hide flex-1">
                {isQueryRankLoading ? (
                  <>
                    <SkeletonBox className="h-8 w-full" />
                    <SkeletonBox className="h-8 w-full" />
                    <SkeletonBox className="h-8 w-full" />
                    <SkeletonBox className="h-8 w-full" />
                    <SkeletonBox className="h-8 w-full" />
                  </>
                ) : (
                  queryRankData.map((item, idx) => (
                    <div key={item.symbol} className="flex items-center justify-between p-2 bg-nofx-bg-lighter/50 border border-white/5 rounded-sm hover:border-nofx-accent/30 transition-colors">
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] w-4 ${idx < 3 ? 'text-nofx-accent font-bold' : 'text-nofx-text-muted'}`}>{idx + 1}</span>
                        <span className="text-xs font-bold text-nofx-text">{item.symbol}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] text-nofx-text-muted bg-white/5 px-1.5 py-0.5 rounded-sm">
                          {item.query_count}
                        </span>
                        <span className={`text-[10px] font-mono w-16 text-right ${item.future_flow >= 0 ? 'text-nofx-success' : 'text-nofx-danger'}`}>
                          {item.future_flow >= 0 ? '+' : ''}{formatCurrency(item.future_flow)}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
          <div className="mt-auto pt-3 border-t border-white/10 shrink-0">
            <div className="flex items-center justify-between">
              <div className="text-[10px] text-nofx-text-muted animate-pulse">AUTHENTICATING...</div>
            </div>
          </div>
        </Panel>

      </div>
    </div>
  )
}
