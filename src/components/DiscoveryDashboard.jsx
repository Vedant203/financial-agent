import React, { useState, useEffect } from 'react';
import { useMarketData } from '../hooks/useMarketData';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine } from 'recharts';

function RowSparkline({ data, isPositive }) {
  if (!data || data.length === 0) return <span style={{ color: 'var(--text-muted)', fontSize: '10px' }}>WAIT</span>;
  return (
    <div style={{ height: '24px', width: '60px', marginLeft: 'auto' }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
           <YAxis domain={['auto', 'auto']} hide />
           <Line type="monotone" dataKey="price" stroke={isPositive ? 'var(--accent-green)' : 'var(--accent-red)'} strokeWidth={1.5} dot={false} isAnimationActive={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

const getSentimentBadge = (titleText) => {
  const t = titleText.toLowerCase();
  if (t.match(/bullish|buy|surge|jump|record|soar|high|profit|beat|rally/)) return { cls: 'bullish', txt: 'BULLISH' };
  if (t.match(/bearish|sell|drop|fall|slump|low|loss|miss|fear|crash|risk/)) return { cls: 'bearish', txt: 'BEARISH' };
  if (t.match(/rate|fed|boj|yield|bond|economy|data|gdp|inflation|cpi|bank/)) return { cls: 'macro', txt: 'MACRO' };
  return null;
}

const EQUITIES_JP = ['^N225', '7203.T', '9984.T', '6758.T', '8306.T', '6501.T'];
const EQUITIES_GL = ['^GSPC', '^DJI', '^IXIC', '^HSCE', 'MSFT', 'TSM'];
const FUTURES     = ['NIY=F', 'ES=F', 'NQ=F', 'CL=F', 'BZ=F', 'NG=F', 'GC=F', 'SI=F', 'HG=F'];
const BONDS       = ['^TNX', '^TYX', '^IRX', 'ZB=F', 'ZN=F'];
const FX          = ['JPY=X', 'EURUSD=X', 'GBPUSD=X', 'AUDUSD=X'];
const CRYPTO      = ['BTC-USD', 'ETH-USD', 'SOL-USD'];
const VOLATILITY  = ['^VIX', '^VVIX'];


export default function DiscoveryDashboard() {
  const { news, quotes, historical, fetchChartData, loading, lastUpdated } = useMarketData();
  const [activeTicker, setActiveTicker] = useState('^N225');
  const [range, setRange] = useState('1d');
  const [activeHistory, setActiveHistory] = useState([]);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [chartLoading, setChartLoading] = useState(false);

  // Fetch specific range data when ticker or range toggle occurs
  useEffect(() => {
    async function updateChart() {
      setChartLoading(true);
      const data = await fetchChartData(activeTicker, range);
      setActiveHistory(data);
      setChartLoading(false);
    }
    updateChart();
  }, [activeTicker, range]);


  // Live elapsed timer for data freshness
  useEffect(() => {
    if (!lastUpdated) return;
    setElapsedMs(Date.now() - lastUpdated.getTime());
    const interval = setInterval(() => {
      setElapsedMs(Date.now() - lastUpdated.getTime());
    }, 1000);
    return () => clearInterval(interval);
  }, [lastUpdated]);

  const formatElapsed = (ms) => {
    const totalSecs = Math.floor(ms / 1000);
    const m = Math.floor(totalSecs / 60);
    const s = (totalSecs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const activeQuote = quotes[activeTicker];
  const activeHistory = historical[activeTicker] || [];
  const isPos = activeQuote?.change >= 0;

  const renderTableRows = (tickersArray) => {
    return tickersArray.map(ticker => {
       const q = quotes[ticker];
       if(!q) return null;
       const pos = q.change >= 0;
       return (
         <tr key={ticker} className={activeTicker === ticker ? 'active' : ''} onClick={() => setActiveTicker(ticker)}>
           <td style={{ color: activeTicker === ticker ? '#fff' : 'var(--text-primary)', fontWeight: 600 }}>{ticker.replace('=F', '').replace('=X', '')}</td>
           <td>{ticker.includes('=X') ? q.price.toFixed(4) : q.price.toFixed(2)}</td>
           <td className={pos ? "data-green" : "data-red"}>{(pos?'+':'')+q.change.toFixed(2)}</td>
           <td className={pos ? "data-green" : "data-red"} style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px' }}>
             {(pos?'+':'')+q.changePercent.toFixed(2)}%
             <RowSparkline data={historical[ticker]} isPositive={pos} />
           </td>
         </tr>
       )
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', width: '100vw' }}>
      
      {/* Top Ticker Tape */}
      <div className="top-ticker">
        {loading && <span style={{ color: 'var(--text-muted)' }}>SYS: CONNECTING DATA FEEDS...</span>}
        {!loading && Object.values(quotes).map(q => (
          <div key={q.name} className="ticker-item">
            <span style={{ color: 'var(--text-secondary)' }}>{q.name}</span>
            <span style={{ fontWeight: 600 }}>{q.price.toFixed(2)}</span>
            <span className={q.change >= 0 ? "data-green" : "data-red"}>
              {q.change >= 0 ? '▲' : '▼'}{Math.abs(q.changePercent).toFixed(2)}%
            </span>
          </div>
        ))}
      </div>

      <div className="terminal-grid">
        
        {/* Left Panel: Watchlist Segmented */}
        <div className="terminal-panel panel-left">
          <div className="panel-header" style={{ borderBottom: 'none' }}>
            <span>Watchlist</span>
            <div style={{ display: 'flex', gap: '8px' }}>
              <span className={elapsedMs > 60000 ? 'data-red' : 'data-green'}>
                AGE: {lastUpdated ? formatElapsed(elapsedMs) : '--:--'}
              </span>
              <span>{lastUpdated ? lastUpdated.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second:'2-digit'}) : '...'}</span>
            </div>
          </div>
          <div className="panel-content" style={{ padding: 0 }}>
            <table className="data-table mono">
              <thead>
                <tr>
                  <th>SYMBOL</th>
                  <th>LAST</th>
                  <th>CHG</th>
                  <th style={{ textAlign: 'right', paddingRight: '20px' }}>%CHG / 1H</th>
                </tr>
              </thead>
              <tbody>
                <tr><td colSpan="4" className="table-group-header">JP EQUITIES</td></tr>
                {renderTableRows(EQUITIES_JP)}
                <tr><td colSpan="4" className="table-group-header">GLOBAL EQUITIES</td></tr>
                {renderTableRows(EQUITIES_GL)}
                <tr><td colSpan="4" className="table-group-header">FUTURES</td></tr>
                {renderTableRows(FUTURES)}
                <tr><td colSpan="4" className="table-group-header">GOV BONDS & RATES</td></tr>
                {renderTableRows(BONDS)}
                <tr><td colSpan="4" className="table-group-header">FOREX</td></tr>
                {renderTableRows(FX)}
                <tr><td colSpan="4" className="table-group-header">CRYPTO</td></tr>
                {renderTableRows(CRYPTO)}
                <tr><td colSpan="4" className="table-group-header">VOLATILITY / VIX</td></tr>
                {renderTableRows(VOLATILITY)}
              </tbody>
            </table>
          </div>
        </div>


        {/* Center Panel: Advanced Chart */}
        <div className="terminal-panel panel-center">
          <div className="panel-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ color: 'var(--text-primary)' }}>{activeQuote ? `${activeQuote.name}` : 'CHART VIEW'}</span>
              <div className="range-selector">
                {['1d', '5d', '1mo', '6mo', '1y', 'ytd'].map(r => (
                  <button 
                    key={r} 
                    className={range === r ? 'active' : ''} 
                    onClick={() => setRange(r)}
                  >
                    {r.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ display: 'flex', gap: '16px' }}>
              <span className="mono">O: <span style={{ color: 'var(--text-primary)' }}>{activeQuote?.prevClose?.toFixed(2) || '---'}</span></span>
              <span className="mono">L: <span className={isPos ? "data-green" : "data-red"}>{activeQuote?.price?.toFixed(2) || '---'}</span></span>
              {chartLoading && <span className="data-blue" style={{ fontSize: '0.6rem' }}>SYNC...</span>}
            </div>
          </div>
          <div className="panel-content" style={{ position: 'relative', padding: '16px', overflow: 'hidden' }}>

             
             {activeQuote && (
               <div style={{ position: 'absolute', top: 30, left: 30, zIndex: 0, opacity: 0.1, fontFamily: 'var(--font-mono)', fontSize: '3.5rem', fontWeight: 700, pointerEvents: 'none', letterSpacing: '0.05em' }}>
                 {activeTicker} <br/> {activeQuote.price.toFixed(2)}
               </div>
             )}
             
             {activeHistory.length > 0 && (
               <ResponsiveContainer width="100%" height="100%" style={{ zIndex: 1, position: 'relative' }}>
                 <LineChart data={activeHistory} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                   <CartesianGrid strokeDasharray="2 4" stroke="rgba(255,255,255,0.05)" vertical={false} />
                   <XAxis dataKey="time" stroke="#444" tick={{ fill: '#777', fontSize: 10, fontFamily: 'var(--font-mono)' }} minTickGap={50} />
                   <YAxis domain={['auto', 'auto']} stroke="#444" tick={{ fill: '#777', fontSize: 10, fontFamily: 'var(--font-mono)' }} orientation="right" />
                   <Tooltip 
                     contentStyle={{ backgroundColor: 'rgba(9,9,11,0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '4px', backdropFilter: 'blur(8px)' }}
                     itemStyle={{ color: '#fff', fontSize: '12px', fontFamily: 'var(--font-mono)' }}
                     labelStyle={{ color: '#a1a1aa', fontSize: '10px', fontFamily: 'var(--font-mono)' }}
                   />
                   <ReferenceLine y={activeQuote?.prevClose} stroke="rgba(255,255,255,0.2)" strokeDasharray="3 3" />
                   <Line 
                     type="stepAfter" 
                     dataKey="price" 
                     stroke={isPos ? 'var(--accent-green)' : 'var(--accent-red)'} 
                     strokeWidth={2} 
                     dot={false} 
                     isAnimationActive={false}
                   />
                 </LineChart>
               </ResponsiveContainer>
             )}
          </div>
        </div>

        {/* Center Bottom: Agent Log & Yahoo Finance Style Metrics */}
        <div className="terminal-panel panel-center-bottom">
          <div className="panel-header">
            <span>SYS.EVENTS // MARKET METRICS</span>
            <span style={{ color: 'var(--accent-green)', display: 'flex', alignItems: 'center', gap: '6px' }}><span style={{ display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent-green)' }}></span> LIVE HUD</span>
          </div>
          <div className="panel-content" style={{ display: 'flex', flexDirection: 'column', padding: 0 }}>
             
             {/* TOP PORTION: System & Movers */}
             <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                 {/* Box 1: Sys Log */}
                 <div className="mono" style={{ flex: 1.2, padding: '8px 12px', borderRight: '1px solid rgba(255,255,255,0.05)', fontSize: '0.65rem', lineHeight: '1.6', color: 'var(--text-secondary)' }}>
                     <div style={{ color: '#888', marginBottom: '4px', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '2px' }}>SERVER HEARTBEAT</div>
                     <span style={{ color: '#52525b' }}>[SYS] {lastUpdated?.toLocaleTimeString()}</span> - <span style={{ color: 'var(--text-primary)' }}>HEARTBEAT OK. DATA SYNCED.</span><br/>
                     <span style={{ color: '#52525b' }}>[SYS] {lastUpdated?.toLocaleTimeString()}</span> - {activeTicker} SELECTED V2 RENDER PROFILE. <br/>
                     {Math.abs(activeQuote?.changePercent || 0) > 1 && <><span style={{ color: 'var(--accent-yellow)' }}>[WARN]</span> - {activeTicker} EXCEEDS 1% VOLATILITY. <br/></>}
                     <span style={{ color: 'var(--accent-blue)' }}>[INFO]</span> - AGENT PARSED {news.length} ARTICLES; {news.filter(n => getSentimentBadge(n.title)).length} TRIGGERS FOUND.
                 </div>

                 {/* Box 2: Top Gainers */}
                 <div style={{ flex: 1, padding: '8px 12px', borderRight: '1px solid rgba(255,255,255,0.05)' }}>
                    <div className="mono" style={{ color: '#888', fontSize: '0.65rem', marginBottom: '4px', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '2px' }}>DAY'S TOP GAINERS</div>
                    <table className="data-table mono" style={{ width: '100%', fontSize: '0.70rem' }}>
                      <tbody>
                        {Object.values(quotes)
                            .filter(q => q.changePercent > 0)
                            .sort((a,b) => b.changePercent - a.changePercent)
                            .slice(0,3)
                            .map(q => {
                               const tk = Object.keys(quotes).find(k => quotes[k].name === q.name);
                               return (
                                 <tr key={tk} onClick={() => setActiveTicker(tk)} style={{ cursor: 'pointer' }}>
                                   <td style={{ textAlign: 'left', color: 'var(--text-primary)', padding: '4px 0' }}>{q.name.substring(0, 12)}</td>
                                   <td style={{ padding: '4px 0' }}>{q.price.toFixed(2)}</td>
                                   <td className="data-green" style={{ padding: '4px 0' }}>+{q.changePercent.toFixed(2)}%</td>
                                 </tr>
                               )
                            })
                        }
                      </tbody>
                    </table>
                 </div>

                 {/* Box 3: Top Losers */}
                 <div style={{ flex: 1, padding: '8px 12px' }}>
                    <div className="mono" style={{ color: '#888', fontSize: '0.65rem', marginBottom: '4px', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '2px' }}>DAY'S BIGGEST LOSERS</div>
                    <table className="data-table mono" style={{ width: '100%', fontSize: '0.70rem' }}>
                      <tbody>
                        {Object.values(quotes)
                            .filter(q => q.changePercent < 0)
                            .sort((a,b) => a.changePercent - b.changePercent)
                            .slice(0,3)
                            .map(q => {
                               const tk = Object.keys(quotes).find(k => quotes[k].name === q.name);
                               return (
                                 <tr key={tk} onClick={() => setActiveTicker(tk)} style={{ cursor: 'pointer' }}>
                                   <td style={{ textAlign: 'left', color: 'var(--text-primary)', padding: '4px 0' }}>{q.name.substring(0, 12)}</td>
                                   <td style={{ padding: '4px 0' }}>{q.price.toFixed(2)}</td>
                                   <td className="data-red" style={{ padding: '4px 0' }}>{q.changePercent.toFixed(2)}%</td>
                                 </tr>
                               )
                            })
                        }
                      </tbody>
                    </table>
                 </div>
             </div>

             {/* BOTTOM PORTION: More headlines - uses all news from start since API caps at ~10 anyway */}
             <div style={{ flex: 1, padding: '8px 12px', background: 'rgba(0,0,0,0.2)', overflowY: 'auto', minHeight: 0 }}>
                 <div className="mono" style={{ color: '#888', fontSize: '0.65rem', marginBottom: '8px', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '2px' }}>BREAKING HEADLINES</div>
                 {news.length === 0 && <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>LOADING FEEDS...</div>}
                 <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                     {news.slice(0, 9).map((n, i) => (
                         <a key={i} href={n.link} target="_blank" rel="noreferrer" style={{ textDecoration: 'none' }}>
                           <div style={{ padding: '6px 8px', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.02)', transition: 'background 0.15s', display: 'flex', flexDirection: 'column', gap: '3px', cursor: 'pointer' }}
                                onMouseEnter={e => e.currentTarget.style.background='rgba(255,255,255,0.06)'}
                                onMouseLeave={e => e.currentTarget.style.background='rgba(255,255,255,0.02)'}
                           >
                              <div style={{ fontSize: '0.58rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', display: 'flex', justifyContent: 'space-between' }}>
                                <span>{n.time}</span><span>{n.publisher.substring(0, 16).toUpperCase()}</span>
                              </div>
                              <div style={{ fontSize: '0.72rem', color: 'var(--text-primary)', lineHeight: '1.3', fontWeight: 500 }}>
                                {getSentimentBadge(n.title) && <span className={`badge ${getSentimentBadge(n.title).cls}`} style={{ marginRight: '5px', fontSize: '0.55rem' }}>{getSentimentBadge(n.title).txt}</span>}
                                {n.title.length > 65 ? n.title.substring(0, 65) + '…' : n.title}
                              </div>
                           </div>
                         </a>
                     ))}
                 </div>
             </div>

          </div>
        </div>

        {/* Right Panel: News Wire with Sentiment */}
        <div className="terminal-panel panel-right">
           <div className="panel-header">
             <span>Live Wire Analysis</span>
             <span className="mono">COUNT: {news.length}</span>
           </div>
           <div className="panel-content" style={{ padding: 0 }}>
             {news.length === 0 && <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>WAITING FOR FEEDS...</div>}
             {news.map((n, i) => {
               const badge = getSentimentBadge(n.title);
               return (
                 <a key={i} href={n.link} target="_blank" rel="noreferrer" style={{ textDecoration: 'none' }}>
                   <div className="news-item">
                      <div className="news-meta">
                        <span style={{ color: 'var(--accent-blue)' }}>{n.time}</span>
                        <span>{n.publisher.toUpperCase()}</span>
                      </div>
                      <div className="news-headline">
                        {badge && <span className={`badge ${badge.cls}`} style={{ marginRight: '6px' }}>{badge.txt}</span>}
                        {n.title}
                      </div>
                   </div>
                 </a>
               )
             })}
           </div>
        </div>

      </div>
    </div>
  );
}
