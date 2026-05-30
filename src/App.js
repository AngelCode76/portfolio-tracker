import { useState, useMemo } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";

const INITIAL_HOLDINGS = [
  { id: 1, ticker: "XRP", name: "XRP", type: "crypto", shares: 500, avgCost: 0.52, currentPrice: 2.31, fees: 4.20, notes: "Institutional DeFi infrastructure play. Long horizon.", wallet: "Tangem" },
  { id: 2, ticker: "SOL", name: "Solana", type: "crypto", shares: 3.5, avgCost: 142.00, currentPrice: 168.00, fees: 2.10, notes: "High-throughput L1. Monitor ecosystem growth.", wallet: "Coinbase" },
  { id: 3, ticker: "HBAR", name: "Hedera", type: "crypto", shares: 8000, avgCost: 0.071, currentPrice: 0.089, fees: 3.50, notes: "Enterprise-grade DLT. SWIFT integration potential.", wallet: "Trust Wallet" },
  { id: 4, ticker: "BTC", name: "Bitcoin", type: "crypto", shares: 0.12, avgCost: 41200, currentPrice: 68500, fees: 8.00, notes: "Core hard asset position. Hold.", wallet: "Tangem" },
  { id: 5, ticker: "XLM", name: "Stellar", type: "crypto", shares: 2000, avgCost: 0.12, currentPrice: 0.108, fees: 1.80, notes: "Cross-border payments. Watching adoption.", wallet: "Trust Wallet" },
  { id: 6, ticker: "COPX", name: "Copper ETF", type: "stock", shares: 25, avgCost: 38.40, currentPrice: 41.20, fees: 0, notes: "Commodity/hard asset hedge. Energy transition play.", wallet: "Brokerage" },
  { id: 7, ticker: "REMX", name: "Rare Earth ETF", type: "stock", shares: 18, avgCost: 29.10, currentPrice: 34.80, fees: 0, notes: "Strong run recently. Evaluate trimming.", wallet: "Brokerage" },
];

const ACCENT = "#f0c040";
const GAIN_COLOR = "#4ade80";
const LOSS_COLOR = "#f87171";
const CHART_COLORS = ["#f0c040","#60a5fa","#a78bfa","#34d399","#fb923c","#e879f9","#38bdf8","#f472b6"];

function fmt(n, d = 2) {
  return n?.toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d }) ?? "—";
}
function fmtUSD(n) {
  if (Math.abs(n) >= 1000) return "$" + fmt(n, 0);
  return "$" + fmt(n, 2);
}
function fmtPct(n) {
  const sign = n >= 0 ? "+" : "";
  return sign + fmt(n, 2) + "%";
}

function calcHolding(h) {
  const totalCost = h.shares * h.avgCost + (h.fees || 0);
  const marketValue = h.shares * h.currentPrice;
  const gainLoss = marketValue - totalCost;
  const gainLossPct = totalCost > 0 ? (gainLoss / totalCost) * 100 : 0;
  return { ...h, totalCost, marketValue, gainLoss, gainLossPct };
}

const EMPTY_FORM = { ticker: "", name: "", type: "crypto", shares: "", avgCost: "", currentPrice: "", fees: "", notes: "", wallet: "" };

export default function PortfolioTracker() {
  const [holdings, setHoldings] = useState(INITIAL_HOLDINGS);
  const [activeTab, setActiveTab] = useState("holdings");
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [scenarioTicker, setScenarioTicker] = useState("");
  const [scenarioBuySell, setScenarioBuySell] = useState("buy");
  const [scenarioQty, setScenarioQty] = useState("");
  const [scenarioPrice, setScenarioPrice] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [sortKey, setSortKey] = useState("marketValue");
  const [limitOrders, setLimitOrders] = useState([
    { id: 1, ticker: "XRP", type: "buy", targetPrice: 1.80, qty: 250, note: "DCA entry if dips" },
    { id: 2, ticker: "REMX", type: "sell", targetPrice: 38.00, qty: 18, note: "Take profit at resistance" },
  ]);
  const [loForm, setLoForm] = useState({ ticker: "", type: "buy", targetPrice: "", qty: "", note: "" });

  const computed = useMemo(() => holdings.map(calcHolding), [holdings]);
  const filtered = useMemo(() => {
    let h = filterType === "all" ? computed : computed.filter(x => x.type === filterType);
    return [...h].sort((a, b) => {
      if (sortKey === "ticker") return a.ticker.localeCompare(b.ticker);
      return b[sortKey] - a[sortKey];
    });
  }, [computed, filterType, sortKey]);

  const totals = useMemo(() => {
    const totalCost = computed.reduce((s, h) => s + h.totalCost, 0);
    const totalValue = computed.reduce((s, h) => s + h.marketValue, 0);
    const totalGL = totalValue - totalCost;
    const totalGLPct = totalCost > 0 ? (totalGL / totalCost) * 100 : 0;
    return { totalCost, totalValue, totalGL, totalGLPct };
  }, [computed]);

  const pieData = useMemo(() =>
    computed.map(h => ({ name: h.ticker, value: parseFloat(h.marketValue.toFixed(2)) })),
    [computed]
  );

  const barData = useMemo(() =>
    [...computed].sort((a, b) => b.gainLossPct - a.gainLossPct).map(h => ({
      ticker: h.ticker, gainLossPct: parseFloat(h.gainLossPct.toFixed(2))
    })),
    [computed]
  );

  function openAdd() { setForm(EMPTY_FORM); setEditId(null); setShowForm(true); }
  function openEdit(h) { setForm({ ...h, shares: String(h.shares), avgCost: String(h.avgCost), currentPrice: String(h.currentPrice), fees: String(h.fees || 0) }); setEditId(h.id); setShowForm(true); }
  function saveForm() {
    const entry = { ...form, shares: parseFloat(form.shares), avgCost: parseFloat(form.avgCost), currentPrice: parseFloat(form.currentPrice), fees: parseFloat(form.fees) || 0 };
    if (!entry.ticker || isNaN(entry.shares) || isNaN(entry.avgCost) || isNaN(entry.currentPrice)) return;
    if (editId !== null) {
      setHoldings(h => h.map(x => x.id === editId ? { ...entry, id: editId } : x));
    } else {
      setHoldings(h => [...h, { ...entry, id: Date.now() }]);
    }
    setShowForm(false);
  }
  function deleteHolding(id) { setHoldings(h => h.filter(x => x.id !== id)); }

  const scenario = useMemo(() => {
    if (!scenarioTicker || !scenarioQty || !scenarioPrice) return null;
    const h = computed.find(x => x.ticker.toUpperCase() === scenarioTicker.toUpperCase());
    const qty = parseFloat(scenarioQty);
    const price = parseFloat(scenarioPrice);
    if (isNaN(qty) || isNaN(price)) return null;

    if (scenarioBuySell === "buy") {
      if (!h) {
        return { type: "new", newAvgCost: price, newShares: qty, newValue: qty * price, newTotalCost: qty * price };
      }
      const newShares = h.shares + qty;
      const newTotalCost = h.totalCost + qty * price;
      const newAvgCost = newTotalCost / newShares;
      const newValue = newShares * h.currentPrice;
      const newGL = newValue - newTotalCost;
      return { type: "buy", ...h, newShares, newTotalCost, newAvgCost, newValue, newGL };
    } else {
      if (!h) return null;
      if (qty > h.shares) return { error: `You only hold ${h.shares} ${h.ticker}` };
      const proceeds = qty * price;
      const costBasisSold = (h.totalCost / h.shares) * qty;
      const realizedGL = proceeds - costBasisSold;
      const newShares = h.shares - qty;
      const newTotalCost = h.totalCost - costBasisSold;
      const newValue = newShares * h.currentPrice;
      return { type: "sell", ...h, proceeds, realizedGL, newShares, newTotalCost, newValue };
    }
  }, [scenarioTicker, scenarioBuySell, scenarioQty, scenarioPrice, computed]);

  function addLimitOrder() {
    if (!loForm.ticker || !loForm.targetPrice || !loForm.qty) return;
    setLimitOrders(l => [...l, { ...loForm, id: Date.now(), targetPrice: parseFloat(loForm.targetPrice), qty: parseFloat(loForm.qty) }]);
    setLoForm({ ticker: "", type: "buy", targetPrice: "", qty: "", note: "" });
  }
  function deleteLO(id) { setLimitOrders(l => l.filter(x => x.id !== id)); }

  const analysis = useMemo(() => {
    const totalVal = totals.totalValue;
    return computed.map(h => {
      const alloc = totalVal > 0 ? (h.marketValue / totalVal) * 100 : 0;
      let signal = "HOLD";
      if (h.gainLossPct > 40 && alloc > 15) signal = "CONSIDER TRIM";
      else if (h.gainLossPct < -20) signal = "REVIEW";
      else if (alloc > 30) signal = "OVERWEIGHT";
      else if (h.gainLossPct > 50) signal = "TAKE PROFIT?";
      return { ...h, alloc, signal };
    });
  }, [computed, totals]);

  const tabs = [
    { id: "holdings", label: "Holdings" },
    { id: "charts", label: "Charts" },
    { id: "scenario", label: "Scenario Calc" },
    { id: "limits", label: "Limit Orders" },
    { id: "analysis", label: "Analysis" },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "#0d0f14", color: "#e8e6df", fontFamily: "'DM Mono', 'Courier New', monospace", fontSize: 13 }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400;500&family=Syne:wght@700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: #0d0f14; }
        ::-webkit-scrollbar-thumb { background: #2a2d35; border-radius: 3px; }
        .tab-btn { background: none; border: none; color: #666; cursor: pointer; font-family: inherit; font-size: 12px; letter-spacing: 0.08em; padding: 10px 18px; text-transform: uppercase; transition: color 0.2s; border-bottom: 2px solid transparent; }
        .tab-btn:hover { color: #e8e6df; }
        .tab-btn.active { color: #f0c040; border-bottom-color: #f0c040; }
        .btn { border: none; cursor: pointer; font-family: inherit; font-size: 12px; letter-spacing: 0.06em; padding: 8px 16px; border-radius: 4px; transition: all 0.15s; text-transform: uppercase; }
        .btn-gold { background: #f0c040; color: #0d0f14; font-weight: 500; }
        .btn-gold:hover { background: #f7d060; }
        .btn-ghost { background: transparent; color: #888; border: 1px solid #2a2d35; }
        .btn-ghost:hover { border-color: #f0c040; color: #f0c040; }
        .btn-danger { background: transparent; color: #f87171; border: 1px solid #3a2020; font-size: 11px; padding: 4px 10px; }
        .btn-danger:hover { background: #3a2020; }
        .btn-edit { background: transparent; color: #60a5fa; border: 1px solid #1e2a3a; font-size: 11px; padding: 4px 10px; }
        .btn-edit:hover { background: #1e2a3a; }
        input, select, textarea { background: #141720; border: 1px solid #2a2d35; color: #e8e6df; font-family: inherit; font-size: 13px; border-radius: 4px; padding: 8px 10px; outline: none; width: 100%; }
        input:focus, select:focus, textarea:focus { border-color: #f0c040; }
        select option { background: #141720; }
        table { width: 100%; border-collapse: collapse; }
        th { color: #666; font-size: 11px; letter-spacing: 0.1em; text-transform: uppercase; padding: 10px 12px; text-align: left; border-bottom: 1px solid #1e2127; font-weight: 400; white-space: nowrap; }
        td { padding: 10px 12px; border-bottom: 1px solid #181b21; vertical-align: top; }
        tr:hover td { background: #13161c; }
        .gain { color: #4ade80; }
        .loss { color: #f87171; }
        .badge { display: inline-block; font-size: 10px; padding: 2px 7px; border-radius: 3px; letter-spacing: 0.06em; text-transform: uppercase; }
        .badge-crypto { background: #1a1f35; color: #60a5fa; }
        .badge-stock { background: #1a2a1a; color: #4ade80; }
        .card { background: #13161c; border: 1px solid #1e2127; border-radius: 8px; padding: 20px; }
        .modal-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.75); z-index: 100; display: flex; align-items: center; justify-content: center; padding: 20px; }
        .modal { background: #13161c; border: 1px solid #2a2d35; border-radius: 10px; padding: 24px; width: 100%; max-width: 520px; max-height: 90vh; overflow-y: auto; }
        .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .form-group label { display: block; font-size: 11px; color: #666; letter-spacing: 0.08em; text-transform: uppercase; margin-bottom: 5px; }
        .signal-hold { color: #888; }
        .signal-trim { color: #fb923c; }
        .signal-review { color: #f87171; }
        .signal-overweight { color: #e879f9; }
        .signal-profit { color: #f0c040; }
        .scenario-result { background: #0d1117; border: 1px solid #f0c040; border-radius: 8px; padding: 20px; margin-top: 16px; }
        .wallet-tag { font-size: 10px; color: #555; }
      `}</style>

      {/* Header */}
      <div style={{ borderBottom: "1px solid #1e2127", padding: "16px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
        <div>
          <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 20, fontWeight: 800, letterSpacing: "-0.02em", color: "#f0c040" }}>PORTFOLIO TRACKER</div>
          <div style={{ fontSize: 11, color: "#444", letterSpacing: "0.1em", marginTop: 2 }}>STOCKS · CRYPTO · HARD ASSETS</div>
        </div>
        {/* Summary bar */}
        <div style={{ display: "flex", gap: 28, flexWrap: "wrap" }}>
          {[
            { label: "Total Value", val: fmtUSD(totals.totalValue), color: "#e8e6df" },
            { label: "Total Cost", val: fmtUSD(totals.totalCost), color: "#888" },
            { label: "Unrealized P&L", val: fmtUSD(totals.totalGL), color: totals.totalGL >= 0 ? GAIN_COLOR : LOSS_COLOR },
            { label: "Return", val: fmtPct(totals.totalGLPct), color: totals.totalGL >= 0 ? GAIN_COLOR : LOSS_COLOR },
          ].map(s => (
            <div key={s.label}>
              <div style={{ fontSize: 10, color: "#555", letterSpacing: "0.1em", textTransform: "uppercase" }}>{s.label}</div>
              <div style={{ fontSize: 16, color: s.color, fontWeight: 500, marginTop: 2 }}>{s.val}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ borderBottom: "1px solid #1e2127", padding: "0 24px", display: "flex", gap: 4 }}>
        {tabs.map(t => (
          <button key={t.id} className={`tab-btn ${activeTab === t.id ? "active" : ""}`} onClick={() => setActiveTab(t.id)}>{t.label}</button>
        ))}
      </div>

      <div style={{ padding: "24px" }}>

        {/* === HOLDINGS === */}
        {activeTab === "holdings" && (
          <div>
            <div style={{ display: "flex", gap: 10, marginBottom: 16, alignItems: "center", flexWrap: "wrap" }}>
              <button className="btn btn-gold" onClick={openAdd}>+ Add Position</button>
              <div style={{ display: "flex", gap: 6 }}>
                {["all","crypto","stock"].map(t => (
                  <button key={t} className={`btn btn-ghost`} style={filterType===t?{borderColor:"#f0c040",color:"#f0c040"}:{}} onClick={() => setFilterType(t)}>{t}</button>
                ))}
              </div>
              <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 11, color: "#555" }}>SORT BY</span>
                <select style={{ width: 140 }} value={sortKey} onChange={e => setSortKey(e.target.value)}>
                  <option value="marketValue">Market Value</option>
                  <option value="gainLoss">Gain / Loss $</option>
                  <option value="gainLossPct">Gain / Loss %</option>
                  <option value="ticker">Ticker</option>
                </select>
              </div>
            </div>

            <div style={{ overflowX: "auto" }}>
              <table>
                <thead>
                  <tr>
                    <th>Ticker</th><th>Type</th><th>Qty / Shares</th><th>Avg Cost</th>
                    <th>Current Price</th><th>Total Cost</th><th>Market Value</th>
                    <th>Gain / Loss</th><th>Return %</th><th>Notes</th><th></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(h => (
                    <tr key={h.id}>
                      <td><strong style={{ color: "#f0c040" }}>{h.ticker}</strong><div className="wallet-tag">{h.wallet}</div></td>
                      <td><span className={`badge badge-${h.type}`}>{h.type}</span></td>
                      <td>{fmt(h.shares, h.shares < 10 ? 4 : 0)}</td>
                      <td>{fmtUSD(h.avgCost)}</td>
                      <td>{fmtUSD(h.currentPrice)}</td>
                      <td style={{ color: "#888" }}>{fmtUSD(h.totalCost)}</td>
                      <td>{fmtUSD(h.marketValue)}</td>
                      <td className={h.gainLoss >= 0 ? "gain" : "loss"}>{fmtUSD(h.gainLoss)}</td>
                      <td className={h.gainLossPct >= 0 ? "gain" : "loss"}>{fmtPct(h.gainLossPct)}</td>
                      <td style={{ maxWidth: 180, fontSize: 11, color: "#666", lineHeight: 1.5 }}>{h.notes}</td>
                      <td>
                        <div style={{ display: "flex", gap: 6 }}>
                          <button className="btn btn-edit" onClick={() => openEdit(h)}>Edit</button>
                          <button className="btn btn-danger" onClick={() => deleteHolding(h.id)}>✕</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* === CHARTS === */}
        {activeTab === "charts" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
            <div className="card">
              <div style={{ fontSize: 11, color: "#555", letterSpacing: "0.1em", marginBottom: 16, textTransform: "uppercase" }}>Allocation by Market Value</div>
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" outerRadius={100} dataKey="value" nameKey="name" label={({ name, percent }) => `${name} ${(percent*100).toFixed(0)}%`} labelLine={false} fontSize={11}>
                    {pieData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={v => fmtUSD(v)} contentStyle={{ background: "#13161c", border: "1px solid #2a2d35", borderRadius: 6, fontFamily: "DM Mono" }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="card">
              <div style={{ fontSize: 11, color: "#555", letterSpacing: "0.1em", marginBottom: 16, textTransform: "uppercase" }}>Return % by Position</div>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={barData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e2127" />
                  <XAxis dataKey="ticker" tick={{ fill: "#666", fontSize: 11 }} />
                  <YAxis tick={{ fill: "#666", fontSize: 11 }} unit="%" />
                  <Tooltip formatter={v => fmtPct(v)} contentStyle={{ background: "#13161c", border: "1px solid #2a2d35", borderRadius: 6, fontFamily: "DM Mono" }} />
                  <Bar dataKey="gainLossPct" radius={[3,3,0,0]}>
                    {barData.map((d, i) => <Cell key={i} fill={d.gainLossPct >= 0 ? GAIN_COLOR : LOSS_COLOR} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="card" style={{ gridColumn: "1 / -1" }}>
              <div style={{ fontSize: 11, color: "#555", letterSpacing: "0.1em", marginBottom: 16, textTransform: "uppercase" }}>Position Summary</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 12 }}>
                {computed.map(h => (
                  <div key={h.id} style={{ background: "#0d0f14", border: "1px solid #1e2127", borderRadius: 6, padding: "12px 14px" }}>
                    <div style={{ color: "#f0c040", fontWeight: 500, marginBottom: 4 }}>{h.ticker}</div>
                    <div style={{ color: "#888", fontSize: 11, marginBottom: 6 }}>{fmtUSD(h.marketValue)}</div>
                    <div className={h.gainLossPct >= 0 ? "gain" : "loss"} style={{ fontSize: 12 }}>{fmtPct(h.gainLossPct)}</div>
                    <div style={{ marginTop: 4, height: 3, background: "#1e2127", borderRadius: 2 }}>
                      <div style={{ height: "100%", width: `${Math.min(Math.abs(h.gainLossPct), 100)}%`, background: h.gainLossPct >= 0 ? GAIN_COLOR : LOSS_COLOR, borderRadius: 2 }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* === SCENARIO === */}
        {activeTab === "scenario" && (
          <div style={{ maxWidth: 600 }}>
            <div className="card">
              <div style={{ fontSize: 11, color: "#555", letterSpacing: "0.1em", marginBottom: 20, textTransform: "uppercase" }}>Scenario Buy / Sell Calculator</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
                <div className="form-group">
                  <label>Ticker / Symbol</label>
                  <input placeholder="e.g. SOL" value={scenarioTicker} onChange={e => setScenarioTicker(e.target.value.toUpperCase())} />
                </div>
                <div className="form-group">
                  <label>Action</label>
                  <select value={scenarioBuySell} onChange={e => setScenarioBuySell(e.target.value)}>
                    <option value="buy">Buy More</option>
                    <option value="sell">Sell</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Quantity</label>
                  <input type="number" placeholder="0.00" value={scenarioQty} onChange={e => setScenarioQty(e.target.value)} />
                </div>
                <div className="form-group">
                  <label>{scenarioBuySell === "buy" ? "Buy Price" : "Sell Price"}</label>
                  <input type="number" placeholder="0.00" value={scenarioPrice} onChange={e => setScenarioPrice(e.target.value)} />
                </div>
              </div>

              {scenario?.error && <div style={{ color: LOSS_COLOR, fontSize: 12, padding: "10px 0" }}>{scenario.error}</div>}

              {scenario && !scenario.error && (
                <div className="scenario-result">
                  <div style={{ fontSize: 11, color: "#f0c040", letterSpacing: "0.1em", marginBottom: 14, textTransform: "uppercase" }}>
                    Scenario: {scenarioBuySell === "buy" ? `Buy ${scenarioQty} ${scenarioTicker} @ ${fmtUSD(parseFloat(scenarioPrice))}` : `Sell ${scenarioQty} ${scenarioTicker} @ ${fmtUSD(parseFloat(scenarioPrice))}`}
                  </div>
                  {scenario.type === "buy" && (
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                      {[
                        { label: "New Avg Cost", val: fmtUSD(scenario.newAvgCost), note: scenario.type !== "new" ? `was ${fmtUSD(scenario.avgCost)}` : "new position" },
                        { label: "New Total Shares", val: fmt(scenario.newShares, 4), note: scenario.type !== "new" ? `was ${fmt(scenario.shares, 4)}` : "" },
                        { label: "New Total Cost", val: fmtUSD(scenario.newTotalCost), color: "#888" },
                        { label: "New Market Value", val: fmtUSD(scenario.newValue), color: "#e8e6df" },
                        { label: "New Unrealized P&L", val: fmtUSD(scenario.newGL ?? 0), color: (scenario.newGL ?? 0) >= 0 ? GAIN_COLOR : LOSS_COLOR },
                      ].map(r => (
                        <div key={r.label} style={{ background: "#13161c", borderRadius: 6, padding: "10px 14px" }}>
                          <div style={{ fontSize: 10, color: "#555", textTransform: "uppercase", letterSpacing: "0.08em" }}>{r.label}</div>
                          <div style={{ fontSize: 15, color: r.color || "#e8e6df", marginTop: 4 }}>{r.val}</div>
                          {r.note && <div style={{ fontSize: 10, color: "#555", marginTop: 2 }}>{r.note}</div>}
                        </div>
                      ))}
                    </div>
                  )}
                  {scenario.type === "sell" && (
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                      {[
                        { label: "Proceeds", val: fmtUSD(scenario.proceeds) },
                        { label: "Realized P&L", val: fmtUSD(scenario.realizedGL), color: scenario.realizedGL >= 0 ? GAIN_COLOR : LOSS_COLOR },
                        { label: "Remaining Shares", val: fmt(scenario.newShares, 4) },
                        { label: "Remaining Cost Basis", val: fmtUSD(scenario.newTotalCost), color: "#888" },
                        { label: "Remaining Mkt Value", val: fmtUSD(scenario.newValue) },
                      ].map(r => (
                        <div key={r.label} style={{ background: "#13161c", borderRadius: 6, padding: "10px 14px" }}>
                          <div style={{ fontSize: 10, color: "#555", textTransform: "uppercase", letterSpacing: "0.08em" }}>{r.label}</div>
                          <div style={{ fontSize: 15, color: r.color || "#e8e6df", marginTop: 4 }}>{r.val}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* === LIMIT ORDERS === */}
        {activeTab === "limits" && (
          <div style={{ maxWidth: 700 }}>
            <div className="card" style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 11, color: "#555", letterSpacing: "0.1em", marginBottom: 16, textTransform: "uppercase" }}>Add Limit / Target Order</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 10, marginBottom: 10 }}>
                <div className="form-group"><label>Ticker</label><input placeholder="XRP" value={loForm.ticker} onChange={e => setLoForm(f => ({...f, ticker: e.target.value.toUpperCase()}))} /></div>
                <div className="form-group"><label>Type</label><select value={loForm.type} onChange={e => setLoForm(f => ({...f, type: e.target.value}))}><option value="buy">Buy</option><option value="sell">Sell</option></select></div>
                <div className="form-group"><label>Target Price</label><input type="number" placeholder="0.00" value={loForm.targetPrice} onChange={e => setLoForm(f => ({...f, targetPrice: e.target.value}))} /></div>
                <div className="form-group"><label>Qty</label><input type="number" placeholder="0" value={loForm.qty} onChange={e => setLoForm(f => ({...f, qty: e.target.value}))} /></div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 10 }}>
                <div className="form-group"><label>Note</label><input placeholder="Optional reminder note" value={loForm.note} onChange={e => setLoForm(f => ({...f, note: e.target.value}))} /></div>
                <div style={{ display: "flex", alignItems: "flex-end" }}><button className="btn btn-gold" onClick={addLimitOrder}>Add</button></div>
              </div>
            </div>
            <table>
              <thead><tr><th>Ticker</th><th>Action</th><th>Target Price</th><th>Qty</th><th>Est. Value</th><th>Current Price</th><th>Distance</th><th>Note</th><th></th></tr></thead>
              <tbody>
                {limitOrders.map(lo => {
                  const holding = computed.find(h => h.ticker === lo.ticker);
                  const curr = holding?.currentPrice;
                  const dist = curr ? ((lo.targetPrice - curr) / curr * 100) : null;
                  const estVal = lo.qty * lo.targetPrice;
                  return (
                    <tr key={lo.id}>
                      <td style={{ color: "#f0c040" }}>{lo.ticker}</td>
                      <td><span className={`badge`} style={{ background: lo.type === "buy" ? "#1a2a1a" : "#2a1a1a", color: lo.type === "buy" ? GAIN_COLOR : LOSS_COLOR }}>{lo.type.toUpperCase()}</span></td>
                      <td>{fmtUSD(lo.targetPrice)}</td>
                      <td>{fmt(lo.qty, 2)}</td>
                      <td>{fmtUSD(estVal)}</td>
                      <td style={{ color: "#888" }}>{curr ? fmtUSD(curr) : "—"}</td>
                      <td className={dist !== null ? (dist >= 0 ? "gain" : "loss") : ""}>{dist !== null ? fmtPct(dist) : "—"}</td>
                      <td style={{ fontSize: 11, color: "#666" }}>{lo.note}</td>
                      <td><button className="btn btn-danger" onClick={() => deleteLO(lo.id)}>✕</button></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* === ANALYSIS === */}
        {activeTab === "analysis" && (
          <div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 14, marginBottom: 24 }}>
              {[
                { label: "Positions", val: holdings.length },
                { label: "Crypto Holdings", val: holdings.filter(h=>h.type==="crypto").length },
                { label: "Stock / ETF", val: holdings.filter(h=>h.type==="stock").length },
                { label: "Best Performer", val: analysis.length ? analysis.reduce((a,b) => a.gainLossPct > b.gainLossPct ? a : b).ticker : "—", color: GAIN_COLOR },
                { label: "Worst Performer", val: analysis.length ? analysis.reduce((a,b) => a.gainLossPct < b.gainLossPct ? a : b).ticker : "—", color: LOSS_COLOR },
              ].map(s => (
                <div key={s.label} className="card" style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 10, color: "#555", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 8 }}>{s.label}</div>
                  <div style={{ fontSize: 22, color: s.color || "#f0c040", fontFamily: "'Syne', sans-serif", fontWeight: 800 }}>{s.val}</div>
                </div>
              ))}
            </div>
            <table>
              <thead><tr><th>Ticker</th><th>Type</th><th>Market Value</th><th>Allocation %</th><th>Return %</th><th>Alloc Bar</th><th>Signal</th><th>Notes</th></tr></thead>
              <tbody>
                {[...analysis].sort((a,b) => b.alloc - a.alloc).map(h => {
                  const sigClass = h.signal === "HOLD" ? "signal-hold" : h.signal.includes("TRIM") ? "signal-trim" : h.signal === "REVIEW" ? "signal-review" : h.signal === "OVERWEIGHT" ? "signal-overweight" : "signal-profit";
                  return (
                    <tr key={h.id}>
                      <td style={{ color: "#f0c040" }}>{h.ticker}</td>
                      <td><span className={`badge badge-${h.type}`}>{h.type}</span></td>
                      <td>{fmtUSD(h.marketValue)}</td>
                      <td>{fmt(h.alloc, 1)}%</td>
                      <td className={h.gainLossPct >= 0 ? "gain" : "loss"}>{fmtPct(h.gainLossPct)}</td>
                      <td style={{ width: 120 }}>
                        <div style={{ height: 6, background: "#1e2127", borderRadius: 3 }}>
                          <div style={{ height: "100%", width: `${Math.min(h.alloc, 100)}%`, background: h.alloc > 30 ? "#e879f9" : h.alloc > 15 ? "#f0c040" : "#60a5fa", borderRadius: 3 }} />
                        </div>
                        <div style={{ fontSize: 10, color: "#444", marginTop: 2 }}>{fmt(h.alloc, 1)}% of portfolio</div>
                      </td>
                      <td className={sigClass} style={{ fontWeight: 500, fontSize: 11, letterSpacing: "0.06em" }}>{h.signal}</td>
                      <td style={{ fontSize: 11, color: "#666", maxWidth: 200 }}>{h.notes}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <div style={{ marginTop: 20, padding: "14px 18px", background: "#13161c", border: "1px solid #1e2127", borderRadius: 8, fontSize: 11, color: "#555", lineHeight: 1.8 }}>
              <span style={{ color: "#888" }}>Signal logic: </span>
              CONSIDER TRIM = return &gt;40% and alloc &gt;15% · OVERWEIGHT = alloc &gt;30% · REVIEW = return &lt;-20% · TAKE PROFIT? = return &gt;50% · HOLD = everything else
            </div>
          </div>
        )}

      </div>

      {/* Add / Edit Modal */}
      {showForm && (
        <div className="modal-backdrop" onClick={e => { if(e.target === e.currentTarget) setShowForm(false); }}>
          <div className="modal">
            <div style={{ fontSize: 14, color: "#f0c040", letterSpacing: "0.06em", marginBottom: 20, fontFamily: "'Syne', sans-serif", fontWeight: 700 }}>
              {editId ? "EDIT POSITION" : "ADD POSITION"}
            </div>
            <div className="form-grid">
              {[
                { label: "Ticker / Symbol", key: "ticker", placeholder: "BTC" },
                { label: "Full Name", key: "name", placeholder: "Bitcoin" },
                { label: "Quantity / Shares", key: "shares", placeholder: "0.5", type: "number" },
                { label: "Avg Cost / Share", key: "avgCost", placeholder: "0.00", type: "number" },
                { label: "Current Price", key: "currentPrice", placeholder: "0.00", type: "number" },
                { label: "Total Fees Paid", key: "fees", placeholder: "0.00", type: "number" },
                { label: "Wallet / Exchange", key: "wallet", placeholder: "Coinbase" },
              ].map(f => (
                <div key={f.key} className="form-group">
                  <label>{f.label}</label>
                  <input type={f.type || "text"} placeholder={f.placeholder} value={form[f.key]} onChange={e => setForm(fm => ({...fm, [f.key]: e.target.value}))} />
                </div>
              ))}
              <div className="form-group">
                <label>Type</label>
                <select value={form.type} onChange={e => setForm(fm => ({...fm, type: e.target.value}))}>
                  <option value="crypto">Crypto</option>
                  <option value="stock">Stock / ETF</option>
                </select>
              </div>
            </div>
            <div className="form-group" style={{ marginTop: 12 }}>
              <label>Investment Thesis / Notes</label>
              <textarea rows={3} placeholder="Why you hold this, conviction level, exit conditions..." value={form.notes} onChange={e => setForm(fm => ({...fm, notes: e.target.value}))} />
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 20, justifyContent: "flex-end" }}>
              <button className="btn btn-ghost" onClick={() => setShowForm(false)}>Cancel</button>
              <button className="btn btn-gold" onClick={saveForm}>{editId ? "Save Changes" : "Add Position"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
