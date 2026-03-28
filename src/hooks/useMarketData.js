import { useState, useEffect } from 'react';

const TICKERS = {

  // Japanese Equities
  '^N225': 'Nikkei 225',
  '7203.T': 'Toyota Motor',
  '9984.T': 'SoftBank Grp',
  '6758.T': 'Sony Group',
  '8306.T': 'Mitsubishi UFJ',
  '6501.T': 'Hitachi',
  // Global Equities
  '^GSPC': 'S&P 500',
  '^DJI': 'Dow Jones',
  '^IXIC': 'NASDAQ',
  '^HSCE': 'Hang Seng',
  'MSFT': 'Microsoft',
  'TSM': 'TSMC',
  // Futures
  'NIY=F': 'Nikkei Futures',
  'ES=F': 'S&P500 Futures',
  'NQ=F': 'NASDAQ Futures',
  'CL=F': 'Crude Oil WTI',
  'BZ=F': 'Brent Crude',
  'NG=F': 'Natural Gas',
  'GC=F': 'Gold Futures',
  'SI=F': 'Silver Futures',
  'HG=F': 'Copper Futures',
  // Government Bonds / Rates
  '^TNX': 'US 10Y Yield',
  '^TYX': 'US 30Y Yield',
  '^IRX': 'US 3M T-Bill',
  'ZB=F': 'US T-Bond Fut',
  'ZN=F': 'US 10Y Fut',
  // FX
  'JPY=X': 'USD/JPY',
  'EURUSD=X': 'EUR/USD',
  'GBPUSD=X': 'GBP/USD',
  'AUDUSD=X': 'AUD/USD',
  // Crypto
  'BTC-USD': 'Bitcoin',
  'ETH-USD': 'Ethereum',
  'SOL-USD': 'Solana',
  // Volatility
  '^VIX': 'VIX (Fear)',
  '^VVIX': 'VIX of VIX',
};

export function useMarketData() {
  const [news, setNews] = useState([]);
  const [quotes, setQuotes] = useState({});
  const [historical, setHistorical] = useState({});
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);

        // The Yahoo API often caps search results at 10 or 15 items regardless of newsCount.
        // We will execute 3 concurrent topic queries to guarantee we fetch enough volume (30+ items) to fill the dashboard.
        const searchTopics = ['business economy', 'finance markets', 'japan technology'];
        const fetchPromises = searchTopics.map(topic => 
           fetch(`/api/ynews/v1/finance/search?q=${encodeURIComponent(topic)}&quotesCount=0`)
        );
        const responses = await Promise.all(fetchPromises);
        
        let allRawNews = [];
        for (const res of responses) {
          const json = await res.json();
          if (json.news) allRawNews = allRawNews.concat(json.news);
        }

        // Deduplicate by UUID
        const seen = new Set();
        const uniqueNews = allRawNews.filter(n => {
           if (seen.has(n.uuid)) return false;
           seen.add(n.uuid);
           return true;
        });
        
        const mappedNews = uniqueNews.map(n => ({
          title: n.title,
          publisher: n.publisher,
          link: n.link,
          time: n.providerPublishTime ? new Date(n.providerPublishTime * 1000).toLocaleTimeString([], {hour: 'numeric', minute:'2-digit'}) : 'Just now'
        }));
        
        setNews(mappedNews);

        const quotesObj = {};
        const histObj = {};

        for (const t of Object.keys(TICKERS)) {
           const res = await fetch(`/api/yfinance/v8/finance/chart/${t}?range=1d&interval=5m`);
           const data = await res.json();
           const result = data.chart?.result?.[0];
           
           if (result && result.meta) {
             const meta = result.meta;
             quotesObj[t] = {
               name: TICKERS[t],
               price: meta.regularMarketPrice,
               prevClose: meta.previousClose || meta.chartPreviousClose,
               change: meta.regularMarketPrice - (meta.previousClose || meta.chartPreviousClose),
               changePercent: ((meta.regularMarketPrice - (meta.previousClose || meta.chartPreviousClose)) / (meta.previousClose || meta.chartPreviousClose)) * 100,
             };
             
             const timestamps = result.timestamp || [];
             const closePrices = result.indicators?.quote?.[0]?.close || [];
             histObj[t] = timestamps.map((ts, i) => {
               const date = new Date(ts * 1000);
               return { 
                 time: date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}), 
                 price: closePrices[i] 
               };
             }).filter(pt => pt.price !== null);
           }
        }
        setQuotes(quotesObj);
        setHistorical(histObj);
        setLastUpdated(new Date());

      } catch (err) {
        console.error("Failed fetching live market data:", err);
      } finally {
        setLoading(false);
      }
    }
    
    fetchData();
    // Refresh every 5 minutes (300,000ms)
    const interval = setInterval(fetchData, 300000);
    return () => clearInterval(interval);
  }, []);

  return { news, quotes, historical, loading, lastUpdated };
}
