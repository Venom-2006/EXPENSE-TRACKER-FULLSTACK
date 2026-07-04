import React, { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  LineChart, Line,
} from "recharts";
import "./Dashboard2.css";

const ACCENT = "#e8b75e";
const INCOME = "#57c785";
const EXPENSE = "#f0654e";
const CATEGORY_PALETTE = ["#e8b75e", "#57c785", "#f0654e", "#7dd3fc", "#c4b5fd", "#f4a8c4", "#a3e635", "#fbbf24"];

function colorForCategory(name = "") {
  let normalizedName = name.toLowerCase().trim();
  let hash = 0;
  for (let i = 0; i < normalizedName.length; i++) hash = normalizedName.charCodeAt(i) + ((hash << 5) - hash);
  return CATEGORY_PALETTE[Math.abs(hash) % CATEGORY_PALETTE.length];
}

function ArrowUpIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="19" x2="12" y2="5"></line><polyline points="5 12 12 5 19 12"></polyline>
    </svg>
  );
}

function ArrowDownIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19"></line><polyline points="19 12 12 19 5 12"></polyline>
    </svg>
  );
}

function ChevronIcon() {
  return (
    <svg className="chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9"></polyline>
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg className="check" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"></polyline>
    </svg>
  );
}

function CashIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="6" width="20" height="12" rx="2"></rect><circle cx="12" cy="12" r="2.5"></circle>
    </svg>
  );
}

function CardIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="5" width="20" height="14" rx="2"></rect><line x1="2" y1="10" x2="22" y2="10"></line>
    </svg>
  );
}

function OnlineIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line>
      <path d="M12 2a15.3 15.3 0 0 1 0 20a15.3 15.3 0 0 1 0-20z"></path>
    </svg>
  );
}

const PAYMENT_METHODS = [
  { value: "Cash", label: "Cash", Icon: CashIcon },
  { value: "Credit Card", label: "Credit card", Icon: CardIcon },
  { value: "Online", label: "Online", Icon: OnlineIcon },
];

function TypeToggle({ value, onChange }) {
  return (
    <div className="type-toggle" data-active={value}>
      <button type="button" className="is-income" onClick={() => onChange("income")}>
        <ArrowUpIcon /> Income
      </button>
      <button type="button" className="is-expense" onClick={() => onChange("expense")}>
        <ArrowDownIcon /> Expense
      </button>
    </div>
  );
}

function Dropdown({ value, options, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const current = options.find((o) => o.value === value) || options[0];
  const CurrentIcon = current.Icon;

  return (
    <div className={`dropdown ${open ? "open" : ""}`} ref={ref}>
      <button type="button" className="dropdown-trigger" onClick={() => setOpen((o) => !o)}>
        <span className="label">{CurrentIcon && <CurrentIcon />}{current.label}</span>
        <ChevronIcon />
      </button>
      <div className="dropdown-panel">
        {options.map((opt) => {
          const OptIcon = opt.Icon;
          return (
            <div
              key={opt.value}
              className={`dropdown-option ${opt.value === value ? "selected" : ""}`}
              onClick={() => { onChange(opt.value); setOpen(false); }}
            >
              {OptIcon && <OptIcon />}
              {opt.label}
              <CheckIcon />
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ChartTooltip({ active, payload, label, currency = "" }) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="chart-tooltip">
      {label && <p className="tooltip-label">{label}</p>}
      {payload.map((p) => (
        <p key={p.dataKey || p.name} style={{ color: p.color || p.payload.color || "#ffffff" }}>
          {p.name}: {Number(p.value).toFixed(2)} {currency}
        </p>
      ))}
    </div>
  );
}

function getCurrencySymbol(pref) {
  if (pref === "INR") return "₹";
  if (pref === "EUR") return "€";
  return "$";
}

document.title = "Ledger Workspace";

function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    title: "", amount: "", type: "expense", category: "", paymentMethod: "Cash", notes: "",
  });

  const currencySymbol = useMemo(() => {
    return getCurrencySymbol(user?.currency);
  }, [user]);

  const getAuthConfig = () => {
    const userInfo = localStorage.getItem("userInfo");
    if (!userInfo) return null;
    const parsed = JSON.parse(userInfo);
    return {
      headers: { Authorization: `Bearer ${parsed.token}` },
    };
  };

  useEffect(() => {
    const userInfo = localStorage.getItem("userInfo");
    if (!userInfo) {
      navigate("/login");
    } else {
      setUser(JSON.parse(userInfo));
      fetchTransactions();
    }
  }, [navigate]);

  const fetchTransactions = async () => {
    const config = getAuthConfig();
    if (!config) return;
    try {
      const response = await axios.get("http://localhost:5000/api/transactions", config);
      if (response.data.success) setTransactions(response.data.data);
    } catch (err) {
      setError("Failed to load secure transaction rows.");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    const config = getAuthConfig();
    try {
      const response = await axios.post("http://localhost:5000/api/transactions", {
        ...formData,
        amount: parseFloat(formData.amount),
        category: formData.category.toLowerCase().trim()
      }, config);

      if (response.data.success) {
        setTransactions([response.data.data, ...transactions]);
        setFormData({ title: "", amount: "", type: "expense", category: "", paymentMethod: "Cash", notes: "" });
      }
    } catch (err) {
      setError("Failed to post secure card record.");
    }
  };

  const handleDelete = async (id) => {
    const config = getAuthConfig();
    try {
      const response = await axios.delete(`http://localhost:5000/api/transactions/${id}`, config);
      if (response.data.success) setTransactions(transactions.filter((t) => t._id !== id));
    } catch (err) {
      setError("Failed to delete record.");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("userInfo");
    navigate("/login");
  };

  const income = transactions.filter((t) => t.type === "income").reduce((acc, t) => acc + t.amount, 0);
  const expenses = transactions.filter((t) => t.type === "expense").reduce((acc, t) => acc + t.amount, 0);
  const balance = income - expenses;

  const categoryData = useMemo(() => {
    const map = {};
    transactions.filter((t) => t.type === "expense").forEach((t) => {
      const key = t.category ? t.category.toLowerCase().trim() : "uncategorized";
      map[key] = (map[key] || 0) + t.amount;
    });
    return Object.entries(map)
      .map(([name, value]) => {
        const formattedName = name.charAt(0).toUpperCase() + name.slice(1);
        return { name: formattedName, value, color: colorForCategory(name) };
      })
      .sort((a, b) => b.value - a.value);
  }, [transactions]);

  const categoryTotal = categoryData.reduce((sum, c) => sum + c.value, 0);

  const dailyData = useMemo(() => {
    const map = {};
    const order = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      map[key] = { key, label: d.toLocaleDateString(undefined, { month: "short", day: "numeric" }), expense: 0 };
      order.push(key);
    }
    transactions.forEach((t) => {
      if (t.type !== "expense") return;
      const rawDate = t.createdAt || t.date || new Date().toISOString();
      const d = new Date(rawDate);
      const key = d.toISOString().slice(0, 10);
      if (map[key]) map[key].expense += t.amount;
    });
    return order.map((k) => map[k]);
  }, [transactions]);

  const monthlyData = useMemo(() => {
    const map = {};
    const order = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      map[key] = { key, label: d.toLocaleDateString(undefined, { month: "short" }), income: 0, expense: 0 };
      order.push(key);
    }
    transactions.forEach((t) => {
      const rawDate = t.createdAt || t.date || new Date().toISOString();
      const d = new Date(rawDate);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      if (map[key]) {
        if (t.type === "income") map[key].income += t.amount;
        else map[key].expense += t.amount;
      }
    });
    return order.map((k) => map[k]);
  }, [transactions]);

  if (loading) return <div className="loading-screen">Verifying session...</div>;

  return (
    <div className="dashboard-wrapper">
      <header className="dashboard-header">
        <h1>Welcome, {user?.name}</h1>
        <button onClick={handleLogout} className="btn-logout">Logout</button>
      </header>
      {error && <div className="error-banner">{error}</div>}

      <div className="metrics-grid">
        <div className="card balance-card"><h3>Net Balance</h3><p className={balance >= 0 ? "positive" : "negative"}>{balance.toFixed(2)} {currencySymbol}</p></div>
        <div className="card income-card"><h3>Total Income</h3><p className="positive">+{income.toFixed(2)} {currencySymbol}</p></div>
        <div className="card expense-card"><h3>Total Expenses</h3><p className="negative">-{expenses.toFixed(2)} {currencySymbol}</p></div>
      </div>

      <div className="charts-grid">
        <div className="chart-card">
          <h3>Spending by category</h3>
          <p className="chart-sub">Where expenses are going</p>
          {categoryData.length === 0 ? (
            <p className="empty-state">No expenses yet.</p>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={categoryData} dataKey="value" nameKey="name" innerRadius={45} outerRadius={70} paddingAngle={2}>
                    {categoryData.map((entry) => <Cell key={entry.name} fill={entry.color} stroke="none" />)}
                  </Pie>
                  <Tooltip content={<ChartTooltip currency={currencySymbol} />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="chart-legend">
                {categoryData.map((c) => (
                  <div className="chart-legend-row" key={c.name}>
                    <span className="dot" style={{ background: c.color }}></span>
                    <span className="name">{c.name}</span>
                    <span className="value">{categoryTotal ? Math.round((c.value / categoryTotal) * 100) : 0}%</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="chart-card">
          <h3>Daily spending</h3>
          <p className="chart-sub">Last 14 days</p>
          <ResponsiveContainer width="100%" height={230}>
            <BarChart data={dailyData}>
              <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
              <XAxis dataKey="label" tick={{ fill: "#545b6b", fontSize: 10 }} axisLine={false} tickLine={false} interval={2} />
              <YAxis tick={{ fill: "#545b6b", fontSize: 10 }} axisLine={false} tickLine={false} width={30} />
              <Tooltip content={<ChartTooltip currency={currencySymbol} />} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
              <Bar dataKey="expense" name="Expense" fill={EXPENSE} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <h3>Monthly overview</h3>
          <p className="chart-sub">Income vs expense, last 6 months</p>
          <ResponsiveContainer width="100%" height={230}>
            <LineChart data={monthlyData}>
              <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
              <XAxis dataKey="label" tick={{ fill: "#545b6b", fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#545b6b", fontSize: 10 }} axisLine={false} tickLine={false} width={30} />
              <Tooltip content={<ChartTooltip currency={currencySymbol} />} />
              <Line type="monotone" dataKey="income" name="Income" stroke={INCOME} strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="expense" name="Expense" stroke={EXPENSE} strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="dashboard-content">
        <section className="form-section">
          <h3>Add New Transaction</h3>
          <form onSubmit={handleFormSubmit}>
            <div>
              <label>Type</label>
              <TypeToggle value={formData.type} onChange={(val) => setFormData({ ...formData, type: val })} />
            </div>
            <input type="text" name="title" placeholder="Title" value={formData.title} onChange={handleInputChange} required />
            <input type="number" name="amount" placeholder="Amount" step="0.01" value={formData.amount} onChange={handleInputChange} required />
            <input type="text" name="category" placeholder="Category" value={formData.category} onChange={handleInputChange} required />
            <div>
              <label>Payment method</label>
              <Dropdown
                value={formData.paymentMethod}
                options={PAYMENT_METHODS}
                onChange={(val) => setFormData({ ...formData, paymentMethod: val })}
              />
            </div>
            <textarea name="notes" placeholder="Notes (optional)" value={formData.notes} onChange={handleInputChange} />
            <button type="submit" className="btn-submit">Add Record</button>
          </form>
        </section>

        <section className="history-section">
          <h3>Recent Transactions</h3>
          <div className="transaction-list">
            {transactions.length === 0 ? <p className="empty-state">No transactions recorded yet.</p> : (
              transactions.map((t) => (
                <div key={t._id} className={`transaction-item ${t.type}`}>
                  <div className="item-info">
                    <h4>{t.title}</h4>
                    <span>
                      {t.category ? t.category.charAt(0).toUpperCase() + t.category.slice(1) : "Uncategorized"} • {t.paymentMethod}
                    </span>
                  </div>
                  <div className="item-actions">
                    <span className={`item-amount ${t.type === "income" ? "positive" : "negative"}`}>{t.type === "income" ? "+" : "-"} {t.amount.toFixed(2)} {currencySymbol}</span>
                    <button onClick={() => handleDelete(t._id)} className="btn-delete">×</button>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

export default Dashboard;