// ─── Data layer ───────────────────────────────────────────────────────────────
const STORAGE_KEY = 'spendsmart_expenses';

let expenses = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');

function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(expenses));
}

// ─── Category config ──────────────────────────────────────────────────────────
const CATS = {
  food:          { label: 'Food',          icon: '🍔', color: '#fcb95c', cls: 'cat-food', budget: 3000 },
  transport:     { label: 'Transport',     icon: '🚌', color: '#5cf5c8', cls: 'cat-transport', budget: 1000 },
  entertainment: { label: 'Entertainment', icon: '🎮', color: '#fc5c7d', cls: 'cat-entertainment', budget: 1500 },
  education:     { label: 'Education',     icon: '📚', color: '#7c5cfc', cls: 'cat-education', budget: 2000 },
  health:        { label: 'Health',        icon: '💊', color: '#5cc8fc', cls: 'cat-health', budget: 500 },
  shopping:      { label: 'Shopping',      icon: '🛍️', color: '#c85cfc', cls: 'cat-shopping', budget: 2000 },
  rent:          { label: 'Rent',          icon: '🏠', color: '#fc8c5c', cls: 'cat-rent', budget: 8000 },
  other:         { label: 'Other',         icon: '📦', color: '#8c8ca0', cls: 'cat-other', budget: 1000 },
};

// ─── Add Expense ──────────────────────────────────────────────────────────────
function addExpense() {
  const desc   = document.getElementById('exp-desc').value.trim();
  const amount = parseFloat(document.getElementById('exp-amount').value);
  const cat    = document.getElementById('exp-cat').value;
  const date   = document.getElementById('exp-date').value || new Date().toISOString().slice(0,10);

  if (!desc) { toast('Please enter a description'); return; }
  if (!amount || amount <= 0) { toast('Please enter a valid amount'); return; }

  expenses.push({ id: Date.now(), desc, amount, cat, date });
  save();
  renderAll();

  document.getElementById('exp-desc').value = '';
  document.getElementById('exp-amount').value = '';
  toast(`✓ Added ₹${amount} for ${desc}`);
}

// ─── Delete Expense ───────────────────────────────────────────────────────────
function deleteExpense(id) {
  expenses = expenses.filter(e => e.id !== id);
  save();
  renderAll();
}

// ─── Filter helpers ───────────────────────────────────────────────────────────
function getFilteredExpenses() {
  const cat    = document.getElementById('filter-cat').value;
  const period = document.getElementById('filter-period').value;
  const now    = new Date();
  return expenses.filter(e => {
    if (cat !== 'all' && e.cat !== cat) return false;
    if (period === 'week') {
      const d = new Date(e.date);
      const diff = (now - d) / (1000*60*60*24);
      return diff <= 7;
    }
    if (period === 'month') {
      const d = new Date(e.date);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }
    return true;
  });
}

function getMonthExpenses() {
  const now = new Date();
  return expenses.filter(e => {
    const d = new Date(e.date);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });
}

function sumBy(arr, key) {
  return arr.reduce((s, e) => s + (key ? e[key] : e.amount), 0);
}

function groupBy(arr, fn) {
  const m = {};
  arr.forEach(e => {
    const k = fn(e);
    if (!m[k]) m[k] = [];
    m[k].push(e);
  });
  return m;
}

// ─── Render List ──────────────────────────────────────────────────────────────
function renderList() {
  const filtered = getFilteredExpenses();
  const sorted   = [...filtered].sort((a, b) => new Date(b.date) - new Date(a.date));
  const total    = sumBy(filtered);

  document.getElementById('filter-total').textContent = filtered.length
    ? `${filtered.length} expenses · ₹${total.toLocaleString()}`
    : '';

  const container = document.getElementById('expense-list');
  if (!sorted.length) {
    container.innerHTML = '<div class="empty-state"><span class="icon">📭</span>No expenses match this filter.</div>';
    return;
  }

  container.innerHTML = sorted.map(e => {
    const c = CATS[e.cat] || CATS.other;
    return `
      <div class="expense-item">
        <span class="cat-badge ${c.cls}">${c.icon} ${c.label}</span>
        <span class="expense-desc">${e.desc}</span>
        <span class="expense-date">${formatDate(e.date)}</span>
        <span class="expense-amount">₹${e.amount.toLocaleString()}</span>
        <button class="btn btn-danger" onclick="deleteExpense(${e.id})">✕</button>
      </div>
    `;
  }).join('');
}

function formatDate(d) {
  const date = new Date(d + 'T00:00:00');
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

// ─── Header stats ─────────────────────────────────────────────────────────────
function renderHeaderStats() {
  const me = getMonthExpenses();
  const total = sumBy(me);
  document.getElementById('header-total').textContent = '₹' + total.toLocaleString();
  document.getElementById('header-count').textContent = expenses.length;

  const byCat = groupBy(me, e => e.cat);
  const topCat = Object.entries(byCat).sort((a, b) => sumBy(b[1]) - sumBy(a[1]))[0];
  document.getElementById('header-top-cat').textContent = topCat
    ? CATS[topCat[0]].icon + ' ' + CATS[topCat[0]].label
    : '—';
}

// ─── Charts (stored as instances) ────────────────────────────────────────────
const charts = {};

function destroyChart(id) {
  if (charts[id]) { charts[id].destroy(); delete charts[id]; }
}

const CHART_DEFAULTS = {
  color: 'rgba(240,238,255,0.7)',
  grid: 'rgba(42,42,61,0.8)',
};

// ─── Dashboard ────────────────────────────────────────────────────────────────
function renderDashboard() {
  const me = getMonthExpenses();
  const total = sumBy(me);
  const byCat = groupBy(me, e => e.cat);
  const catTotals = Object.entries(byCat).map(([k, v]) => ({ cat: k, total: sumBy(v) }))
                          .sort((a, b) => b.total - a.total);

  // Metrics
  const avg = me.length ? (total / new Date().getDate()).toFixed(0) : 0;
  const maxDay = (() => {
    const byDay = groupBy(me, e => e.date);
    const entries = Object.entries(byDay).map(([d, v]) => ({ d, t: sumBy(v) }));
    const max = entries.sort((a, b) => b.t - a.t)[0];
    return max ? `₹${max.t.toLocaleString()} on ${formatDate(max.d)}` : '—';
  })();

  document.getElementById('metrics-row').innerHTML = `
    <div class="metric-card accent">
      <div class="metric-label">This Month</div>
      <div class="metric-value">₹${total.toLocaleString()}</div>
      <div class="metric-sub">${me.length} transactions</div>
    </div>
    <div class="metric-card danger">
      <div class="metric-label">Daily Average</div>
      <div class="metric-value">₹${Number(avg).toLocaleString()}</div>
      <div class="metric-sub">per day this month</div>
    </div>
    <div class="metric-card warn">
      <div class="metric-label">Biggest Day</div>
      <div class="metric-value" style="font-size:18px;">${maxDay}</div>
      <div class="metric-sub">highest single-day spend</div>
    </div>
    <div class="metric-card success">
      <div class="metric-label">Categories</div>
      <div class="metric-value">${catTotals.length}</div>
      <div class="metric-sub">spending areas</div>
    </div>
  `;

  // Donut chart
  destroyChart('donut');
  if (catTotals.length) {
    const ctx = document.getElementById('donutChart').getContext('2d');
    charts['donut'] = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: catTotals.map(c => CATS[c.cat].icon + ' ' + CATS[c.cat].label),
        datasets: [{
          data: catTotals.map(c => c.total),
          backgroundColor: catTotals.map(c => CATS[c.cat].color + '99'),
          borderColor: catTotals.map(c => CATS[c.cat].color),
          borderWidth: 2,
          hoverOffset: 8,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'right', labels: { color: CHART_DEFAULTS.color, font: { family: 'DM Mono', size: 11 }, boxWidth: 12 } },
          tooltip: { callbacks: { label: ctx => ` ₹${ctx.raw.toLocaleString()} (${((ctx.raw/total)*100).toFixed(1)}%)` } }
        },
        cutout: '65%',
      }
    });
  }

  // Category breakdown bars
  const breakdown = document.getElementById('cat-breakdown');
  if (!catTotals.length) {
    breakdown.innerHTML = '<div style="color:var(--muted);font-size:13px;padding:20px;">No data yet</div>';
  } else {
    const maxVal = catTotals[0].total;
    breakdown.innerHTML = catTotals.map(({ cat, total: t }) => {
      const c = CATS[cat];
      const pct = ((t / maxVal) * 100).toFixed(0);
      return `
        <div style="margin-bottom:14px;">
          <div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:4px;">
            <span>${c.icon} ${c.label}</span>
            <span style="color:${c.color};font-family:'Syne',sans-serif;font-weight:700;">₹${t.toLocaleString()}</span>
          </div>
          <div class="progress-bar">
            <div class="progress-fill" style="width:${pct}%;background:${c.color};"></div>
          </div>
        </div>
      `;
    }).join('');
  }

  // Category insights
  const insights = document.getElementById('cat-insights');
  if (!catTotals.length) {
    insights.innerHTML = '<div style="color:var(--muted);font-size:13px;">Add expenses to see insights.</div>';
  } else {
    insights.innerHTML = catTotals.slice(0, 4).map(({ cat, total: t }) => {
      const c = CATS[cat];
      const pctOfTotal = ((t / total) * 100).toFixed(1);
      const vsbudget = c.budget ? ((t / c.budget) * 100).toFixed(0) : null;
      const over = vsbudget && vsbudget > 100;
      return `
        <div class="insight-card">
          <div class="insight-icon">${c.icon}</div>
          <div>
            <div class="insight-title">${c.label}</div>
            <div class="insight-body">
              Spent <span class="insight-highlight">₹${t.toLocaleString()}</span> — 
              ${pctOfTotal}% of your total.
              ${vsbudget ? `<br>Budget usage: <span class="${over ? 'insight-highlight' : 'insight-good'}">${vsbudget}%${over ? ' ⚠️ Over!' : ' ✓'}</span>` : ''}
            </div>
          </div>
        </div>
      `;
    }).join('');
  }
}

// ─── Patterns ─────────────────────────────────────────────────────────────────
function renderPatterns() {
  // Line chart — last 30 days
  destroyChart('line');
  const days = [];
  const dayTotals = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    days.push(formatDate(key));
    const total = expenses.filter(e => e.date === key).reduce((s, e) => s + e.amount, 0);
    dayTotals.push(total);
  }

  const ctx1 = document.getElementById('lineChart').getContext('2d');
  charts['line'] = new Chart(ctx1, {
    type: 'line',
    data: {
      labels: days,
      datasets: [{
        label: 'Daily Spend (₹)',
        data: dayTotals,
        borderColor: '#7c5cfc',
        backgroundColor: 'rgba(124,92,252,0.1)',
        borderWidth: 2,
        fill: true,
        tension: 0.4,
        pointBackgroundColor: '#7c5cfc',
        pointRadius: 3,
        pointHoverRadius: 6,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: { ticks: { color: CHART_DEFAULTS.color, font: { size: 10, family: 'DM Mono' }, maxRotation: 45 }, grid: { color: CHART_DEFAULTS.grid } },
        y: { ticks: { color: CHART_DEFAULTS.color, font: { size: 10, family: 'DM Mono' }, callback: v => '₹' + v.toLocaleString() }, grid: { color: CHART_DEFAULTS.grid } }
      },
      plugins: { legend: { display: false } }
    }
  });

  // Bar chart — last 8 weeks
  destroyChart('bar');
  const weeks = [];
  const weekTotals = [];
  for (let w = 7; w >= 0; w--) {
    const end = new Date();
    end.setDate(end.getDate() - w * 7);
    const start = new Date(end);
    start.setDate(start.getDate() - 6);
    const label = `W${8 - w}`;
    weeks.push(label);
    const tot = expenses.filter(e => {
      const d = new Date(e.date);
      return d >= start && d <= end;
    }).reduce((s, e) => s + e.amount, 0);
    weekTotals.push(tot);
  }

  const ctx2 = document.getElementById('barChart').getContext('2d');
  charts['bar'] = new Chart(ctx2, {
    type: 'bar',
    data: {
      labels: weeks,
      datasets: [{
        label: 'Weekly Spend',
        data: weekTotals,
        backgroundColor: weekTotals.map((v, i) => i === weekTotals.length - 1 ? '#7c5cfc' : 'rgba(124,92,252,0.4)'),
        borderRadius: 6,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: { ticks: { color: CHART_DEFAULTS.color, font: { family: 'DM Mono', size: 11 } }, grid: { display: false } },
        y: { ticks: { color: CHART_DEFAULTS.color, font: { family: 'DM Mono', size: 11 }, callback: v => '₹' + v.toLocaleString() }, grid: { color: CHART_DEFAULTS.grid } }
      },
      plugins: { legend: { display: false } }
    }
  });

  // Day of week chart
  destroyChart('dow');
  const dowNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const dowTotals = Array(7).fill(0);
  expenses.forEach(e => {
    const d = new Date(e.date + 'T00:00:00');
    dowTotals[d.getDay()] += e.amount;
  });

  const ctx3 = document.getElementById('dowChart').getContext('2d');
  charts['dow'] = new Chart(ctx3, {
    type: 'bar',
    data: {
      labels: dowNames,
      datasets: [{
        label: 'Total Spend',
        data: dowTotals,
        backgroundColor: dowTotals.map(v => {
          const max = Math.max(...dowTotals);
          const ratio = max ? v / max : 0;
          return `rgba(252,92,125,${0.2 + ratio * 0.7})`;
        }),
        borderRadius: 6,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: { ticks: { color: CHART_DEFAULTS.color, font: { family: 'DM Mono', size: 11 } }, grid: { display: false } },
        y: { ticks: { color: CHART_DEFAULTS.color, font: { family: 'DM Mono', size: 11 }, callback: v => '₹' + v.toLocaleString() }, grid: { color: CHART_DEFAULTS.grid } }
      },
      plugins: { legend: { display: false } }
    }
  });

  // Radar chart
  destroyChart('radar');
  const catKeys = Object.keys(CATS);
  const catRadarData = catKeys.map(k => expenses.filter(e => e.cat === k).reduce((s, e) => s + e.amount, 0));

  const ctx4 = document.getElementById('radarChart').getContext('2d');
  charts['radar'] = new Chart(ctx4, {
    type: 'radar',
    data: {
      labels: catKeys.map(k => CATS[k].icon + ' ' + CATS[k].label),
      datasets: [{
        label: 'All-time spending',
        data: catRadarData,
        backgroundColor: 'rgba(124,92,252,0.2)',
        borderColor: '#7c5cfc',
        borderWidth: 2,
        pointBackgroundColor: catKeys.map(k => CATS[k].color),
        pointRadius: 5,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        r: {
          ticks: { color: CHART_DEFAULTS.color, font: { size: 10 }, callback: v => '₹' + v.toLocaleString(), backdropColor: 'transparent' },
          grid: { color: CHART_DEFAULTS.grid },
          pointLabels: { color: CHART_DEFAULTS.color, font: { family: 'DM Mono', size: 11 } },
          angleLines: { color: CHART_DEFAULTS.grid },
        }
      },
      plugins: { legend: { display: false } }
    }
  });
}

// ─── Waste Report ─────────────────────────────────────────────────────────────
function renderWasteReport() {
  const total = sumBy(expenses);
  const byCat = groupBy(expenses, e => e.cat);

  const WASTE_RULES = {
    entertainment: { threshold: 2000, severity: 'high', tip: 'Subscriptions, gaming, movies — these add up fast. A student could cut 40% by sharing subscriptions or using free alternatives.' },
    food:          { threshold: 4000, severity: 'high', tip: 'Eating out every day is a cash drain. Cooking even 3 days a week can save ₹1000+ monthly.' },
    shopping:      { threshold: 2500, severity: 'medium', tip: 'Impulse purchases? Try the 24-hour rule — wait before buying. Also check for student discounts.' },
    transport:     { threshold: 1500, severity: 'medium', tip: 'Carpooling, monthly passes, or cycling can significantly cut transport costs.' },
    other:         { threshold: 1500, severity: 'low',  tip: '"Other" expenses are often undocumented impulse buys. Tracking them better reveals hidden waste.' },
  };

  const waste = [];
  Object.entries(byCat).forEach(([cat, arr]) => {
    const t = sumBy(arr);
    const rule = WASTE_RULES[cat];
    if (rule && t > rule.threshold) {
      waste.push({ cat, total: t, rule, pct: total ? ((t / total) * 100).toFixed(1) : 0 });
    }
  });

  waste.sort((a, b) => b.total - a.total);

  const container = document.getElementById('waste-report');

  if (!waste.length && expenses.length === 0) {
    container.innerHTML = '<div class="empty-state"><span class="icon">✅</span>Add some expenses first to analyze waste patterns!</div>';
    return;
  }

  if (!waste.length) {
    container.innerHTML = '<div class="empty-state"><span class="icon">🎉</span>Great job! No obvious waste patterns detected. Keep it up!</div>';
    return;
  }

  container.innerHTML = waste.map(({ cat, total: t, rule, pct }) => {
    const c = CATS[cat];
    const excess = t - rule.threshold;
    return `
      <div class="waste-item ${rule.severity === 'medium' ? 'medium' : rule.severity === 'low' ? 'low' : ''}">
        <div class="waste-header">
          <div class="waste-category">${c.icon} ${c.label} — ₹${t.toLocaleString()}</div>
          <div class="waste-pct">${pct}% of total</div>
        </div>
        <div class="waste-desc">
          ₹${excess.toLocaleString()} above recommended threshold. ${rule.tip}
        </div>
      </div>
    `;
  }).join('');

  // Also add general analysis
  const topCat = Object.entries(byCat)
    .map(([k, v]) => ({ cat: k, t: sumBy(v) }))
    .sort((a, b) => b.t - a.t)[0];

  if (topCat) {
    const pct = total ? ((topCat.t / total) * 100).toFixed(1) : 0;
    if (pct > 40) {
      container.innerHTML += `
        <div class="waste-item low" style="margin-top:16px; border-left-color: var(--accent);">
          <div class="waste-header">
            <div class="waste-category">⚠️ Concentration Risk</div>
          </div>
          <div class="waste-desc">
            ${CATS[topCat.cat].label} alone accounts for ${pct}% of your spending. Diversifying your expenses and setting a hard budget for this category could prevent overspending.
          </div>
        </div>
      `;
    }
  }
}

// ─── Savings ──────────────────────────────────────────────────────────────────
function renderSavings() {
  const me = getMonthExpenses();
  const byCat = groupBy(me, e => e.cat);
  const total = sumBy(me);

  const suggestions = [];

  // Rule-based suggestions
  Object.entries(byCat).forEach(([cat, arr]) => {
    const t = sumBy(arr);
    const c = CATS[cat];
    const budget = c.budget;
    const excess = t - budget;

    if (cat === 'food' && t > 2500) {
      const save = Math.round(t * 0.3);
      suggestions.push({ icon: '🍳', title: 'Cook More, Order Less', save, body: `You spent ₹${t.toLocaleString()} on food. Cooking 3-4 meals a week could save ₹${save.toLocaleString()}/month. Meal prepping on Sundays is a game-changer.` });
    }
    if (cat === 'entertainment' && t > 800) {
      const save = Math.round(t * 0.4);
      suggestions.push({ icon: '📱', title: 'Share Subscriptions', save, body: `₹${t.toLocaleString()} on entertainment is high. Split Netflix/Spotify with 2-3 friends. Use free tiers of apps. Attend free campus events.` });
    }
    if (cat === 'transport' && t > 800) {
      const save = Math.round(t * 0.35);
      suggestions.push({ icon: '🚲', title: 'Switch to Monthly Pass / Cycle', save, body: `Transport costs ₹${t.toLocaleString()} this month. A monthly metro/bus pass, carpooling, or cycling for short distances can save up to ₹${save.toLocaleString()}.` });
    }
    if (cat === 'shopping' && t > 1500) {
      const save = Math.round(t * 0.5);
      suggestions.push({ icon: '⏳', title: '24-Hour Purchase Rule', save, body: `₹${t.toLocaleString()} spent shopping. Wait 24 hours before any non-essential purchase. Studies show this eliminates 50% of impulse buys — saving ₹${save.toLocaleString()}.` });
    }
    if (excess > 0 && cat !== 'rent') {
      // generic
    }
  });

  // Generic suggestions
  if (me.length > 5) {
    const dowTotals = Array(7).fill(0);
    me.forEach(e => { const d = new Date(e.date + 'T00:00:00'); dowTotals[d.getDay()] += e.amount; });
    const maxDow = dowTotals.indexOf(Math.max(...dowTotals));
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    if (dowTotals[maxDow] > 0) {
      suggestions.push({ icon: '📅', title: `Watch Out for ${days[maxDow]}s`, save: Math.round(dowTotals[maxDow] * 0.25 * 4), body: `${days[maxDow]} is your biggest spending day. Plan ahead — pack lunch, avoid malls, and set a spending cap for that day.` });
    }
  }

  if (total > 5000) {
    suggestions.push({ icon: '💰', title: 'Pay Yourself First', save: Math.round(total * 0.1), body: `Try the 50/30/20 rule: 50% needs, 30% wants, 20% savings. Even saving ₹${Math.round(total * 0.1).toLocaleString()}/month builds an emergency fund of ₹${(Math.round(total * 0.1) * 12).toLocaleString()} in a year.` });
  }

  suggestions.push({ icon: '🎓', title: 'Leverage Student Discounts', save: 300, body: 'Use ISIC card, GitHub Student Pack, Amazon Prime Student, Spotify Student, Notion free, Figma free. Collectively worth ₹5,000+/year in savings.' });

  const totalSavings = suggestions.reduce((s, sg) => s + sg.save, 0);
  const score = total === 0 ? '—' : total < 3000 ? 'A+' : total < 6000 ? 'B+' : total < 10000 ? 'C' : 'D';

  document.getElementById('potential-savings').textContent = '₹' + totalSavings.toLocaleString();
  document.getElementById('savings-score').textContent = score;

  const container = document.getElementById('saving-suggestions');
  if (!suggestions.length) {
    container.innerHTML = '<div class="empty-state"><span class="icon">🚀</span>Add more expenses to generate personalized saving tips!</div>';
    return;
  }

  container.innerHTML = `<div class="grid-2" style="gap:16px;">` +
    suggestions.map(s => `
      <div class="suggestion-card">
        <div class="suggestion-header">
          <div style="display:flex;gap:10px;align-items:center;">
            <span style="font-size:24px;">${s.icon}</span>
            <div class="suggestion-title">${s.title}</div>
          </div>
          ${s.save ? `<div class="save-badge">Save ₹${s.save.toLocaleString()}</div>` : ''}
        </div>
        <div class="suggestion-body">${s.body}</div>
      </div>
    `).join('') +
  '</div>';
}

// ─── Tab switching ────────────────────────────────────────────────────────────
function switchTab(name) {
  document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('tab-' + name).classList.add('active');
  event.target.classList.add('active');

  if (name === 'dashboard')  renderDashboard();
  if (name === 'patterns')   renderPatterns();
  if (name === 'waste')      renderWasteReport();
  if (name === 'savings')    renderSavings();
}

// ─── Toast ────────────────────────────────────────────────────────────────────
function toast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2500);
}

// ─── Init ─────────────────────────────────────────────────────────────────────
function renderAll() {
  renderList();
  renderHeaderStats();
}

// Set today's date default
document.getElementById('exp-date').value = new Date().toISOString().slice(0, 10);

// Seed demo data if empty
if (expenses.length === 0) {
  const now = new Date();
  const seedData = [
    { id: 1, desc: 'Zomato dinner', amount: 320, cat: 'food', date: offset(0) },
    { id: 2, desc: 'Metro pass top-up', amount: 200, cat: 'transport', date: offset(1) },
    { id: 3, desc: 'Netflix subscription', amount: 499, cat: 'entertainment', date: offset(2) },
    { id: 4, desc: 'College canteen', amount: 80, cat: 'food', date: offset(2) },
    { id: 5, desc: 'Spotify student', amount: 59, cat: 'entertainment', date: offset(3) },
    { id: 6, desc: 'Grocery run', amount: 550, cat: 'food', date: offset(3) },
    { id: 7, desc: 'Coursera course', amount: 1200, cat: 'education', date: offset(5) },
    { id: 8, desc: 'Amazon impulse buy', amount: 890, cat: 'shopping', date: offset(6) },
    { id: 9, desc: 'Ola cab', amount: 250, cat: 'transport', date: offset(7) },
    { id: 10, desc: 'Movie night', amount: 320, cat: 'entertainment', date: offset(8) },
    { id: 11, desc: 'Dominos pizza', amount: 480, cat: 'food', date: offset(9) },
    { id: 12, desc: 'New earphones', amount: 1499, cat: 'shopping', date: offset(10) },
    { id: 13, desc: 'Medical checkup', amount: 200, cat: 'health', date: offset(12) },
    { id: 14, desc: 'Mess fee partial', amount: 2000, cat: 'food', date: offset(14) },
    { id: 15, desc: 'Books for sem', amount: 800, cat: 'education', date: offset(15) },
    { id: 16, desc: 'Late night snacks', amount: 150, cat: 'food', date: offset(16) },
    { id: 17, desc: 'Gym membership', amount: 700, cat: 'health', date: offset(18) },
    { id: 18, desc: 'Steam game', amount: 399, cat: 'entertainment', date: offset(20) },
    { id: 19, desc: 'Auto rickshaw', amount: 100, cat: 'transport', date: offset(21) },
    { id: 20, desc: 'Clothes shopping', amount: 1200, cat: 'shopping', date: offset(22) },
  ];

  function offset(d) {
    const date = new Date();
    date.setDate(date.getDate() - d);
    return date.toISOString().slice(0, 10);
  }

  expenses = seedData;
  save();
}

renderAll();