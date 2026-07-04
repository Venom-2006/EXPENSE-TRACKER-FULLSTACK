import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./Dashboard2.css";

function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    title: "", amount: "", type: "expense", category: "", paymentMethod: "Cash", notes: "",
  });

  // Helper function to extract auth configurations from client database cache
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
        ...formData, amount: parseFloat(formData.amount)
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

  if (loading) return <div className="loading-screen">Verifying session...</div>;

  return (
    <div className="dashboard-wrapper">
      <header className="dashboard-header">
        <h1>Welcome, {user?.name}</h1>
        <button onClick={handleLogout} className="btn-logout">Logout</button>
      </header>
      {error && <div className="error-banner">{error}</div>}

      <div className="metrics-grid">
        <div className="card balance-card"><h3>Net Balance</h3><p className={balance >= 0 ? "positive" : "negative"}>{balance.toFixed(2)} {user?.currency}</p></div>
        <div className="card income-card"><h3>Total Income</h3><p className="positive">+{income.toFixed(2)} {user?.currency}</p></div>
        <div className="card expense-card"><h3>Total Expenses</h3><p className="negative">-{expenses.toFixed(2)} {user?.currency}</p></div>
      </div>

      <div className="dashboard-content">
        <section className="form-section">
          <h3>Add New Transaction</h3>
          <form onSubmit={handleFormSubmit}>
            <input type="text" name="title" placeholder="Title" value={formData.title} onChange={handleInputChange} required />
            <input type="number" name="amount" placeholder="Amount" step="0.01" value={formData.amount} onChange={handleInputChange} required />
            <select name="type" value={formData.type} onChange={handleInputChange}>
              <option value="expense">Expense</option>
              <option value="income">Income</option>
            </select>
            <input type="text" name="category" placeholder="Category" value={formData.category} onChange={handleInputChange} required />
            <select name="paymentMethod" value={formData.paymentMethod} onChange={handleInputChange}>
              <option value="Cash">Cash</option>
              <option value="Credit Card">Credit Card</option>
              <option value="Online">Online</option>
            </select>
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
                  <div className="item-info"><h4>{t.title}</h4><span>{t.category} • {t.paymentMethod}</span></div>
                  <div className="item-actions">
                    <span className="item-amount">{t.type === "income" ? "+" : "-"} {t.amount.toFixed(2)}</span>
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