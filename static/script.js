const CAT_ICONS = {
  Food: "🍔", Transport: "🚗", Shopping: "🛍️",
  Bills: "📄", Health: "💊", Entertainment: "🎬", Other: "📦"
};

const CAT_COLORS = {
  Food: "#4ade80", Transport: "#60a5fa", Shopping: "#c084fc",
  Bills: "#fbbf24", Health: "#34d399", Entertainment: "#f87171", Other: "#94a3b8"
};

let chart = null;

// ── Date header ──
const now = new Date();
document.getElementById("headerDate").textContent =
  now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

// ── Category pills ──
document.querySelectorAll(".cat-pill").forEach(pill => {
  pill.addEventListener("click", () => {
    document.querySelectorAll(".cat-pill").forEach(p => p.classList.remove("active"));
    pill.classList.add("active");
    document.getElementById("category").value = pill.dataset.cat;
  });
});

// ── Data ──
async function loadData() {
  const res = await fetch("/api/data");
  return res.json();
}

// ── Render ──
function renderCards(data) {
  const total = data.expenses.reduce((s, e) => s + e.amount, 0);
  const left  = data.budget - total;
  const pct   = data.budget > 0 ? Math.min((total / data.budget) * 100, 100) : 0;

  document.getElementById("totalSpent").textContent  = fmt(total);
  document.getElementById("budgetLeft").textContent  = fmt(Math.max(left, 0));
  document.getElementById("txCount").textContent     = data.expenses.length;
  document.getElementById("budgetSub").textContent   = `of ${fmt(data.budget)} budget`;
  document.getElementById("spentSub").textContent    = `across ${data.expenses.length} transaction${data.expenses.length !== 1 ? "s" : ""}`;

  // top category
  if (data.expenses.length) {
    const totals = {};
    data.expenses.forEach(e => totals[e.category] = (totals[e.category] || 0) + e.amount);
    const top = Object.entries(totals).sort((a,b) => b[1]-a[1])[0];
    document.getElementById("topCat").textContent = `${CAT_ICONS[top[0]]} ${top[0]} is top category`;
  } else {
    document.getElementById("topCat").textContent = "no data yet";
  }

  const fill = document.getElementById("progressFill");
  fill.style.width = pct + "%";
  fill.classList.toggle("danger", pct >= 85);
}

function renderChart(expenses) {
  const canvas   = document.getElementById("donutChart");
  const noChart  = document.getElementById("noChart");
  const centerLbl = document.getElementById("centerLabel");
  const centerAmt = document.getElementById("centerAmount");

  if (!expenses.length) {
    canvas.style.display  = "none";
    noChart.style.display = "block";
    centerLbl.style.display = "none";
    if (chart) { chart.destroy(); chart = null; }
    return;
  }

  canvas.style.display  = "block";
  noChart.style.display = "none";
  centerLbl.style.display = "block";

  const totals = {};
  expenses.forEach(e => totals[e.category] = (totals[e.category] || 0) + e.amount);
  const labels = Object.keys(totals);
  const values = labels.map(l => totals[l]);
  const colors = labels.map(l => CAT_COLORS[l] || "#94a3b8");
  const total  = expenses.reduce((s, e) => s + e.amount, 0);

  centerAmt.textContent = fmt(total);

  if (chart) chart.destroy();
  chart = new Chart(canvas, {
    type: "doughnut",
    data: {
      labels,
      datasets: [{
        data: values,
        backgroundColor: colors.map(c => c + "33"),
        borderColor: colors,
        borderWidth: 2,
        hoverBackgroundColor: colors.map(c => c + "55"),
        hoverBorderWidth: 3
      }]
    },
    options: {
      cutout: "72%",
      animation: { animateRotate: true, duration: 600 },
      plugins: {
        legend: {
          position: "bottom",
          labels: {
            color: "rgba(255,255,255,0.4)",
            font: { size: 11, family: "Inter", weight: "600" },
            padding: 16,
            boxWidth: 10,
            boxHeight: 10,
            usePointStyle: true,
            pointStyle: "circle"
          }
        },
        tooltip: {
          backgroundColor: "rgba(10,10,20,0.9)",
          borderColor: "rgba(255,255,255,0.08)",
          borderWidth: 1,
          padding: 12,
          titleFont: { size: 13, family: "Inter", weight: "600" },
          bodyFont: { size: 12, family: "Inter" },
          callbacks: {
            label: ctx => `  ${fmt(ctx.parsed)}  (${Math.round(ctx.parsed/total*100)}%)`
          }
        }
      }
    }
  });
}

function renderTransactions(expenses) {
  const list = document.getElementById("txList");
  const noTx = document.getElementById("noTx");

  if (!expenses.length) {
    list.innerHTML = "";
    noTx.style.display = "block";
    return;
  }

  noTx.style.display = "none";
  list.innerHTML = expenses.map(e => `
    <div class="tx-item">
      <div class="tx-icon cat-${e.category.toLowerCase()}">${CAT_ICONS[e.category] || "📦"}</div>
      <div class="tx-info">
        <div class="tx-name">${e.note || e.category}</div>
        <div class="tx-meta">
          <span class="tx-date">${e.date}</span>
          <span class="tx-badge badge-${e.category.toLowerCase()}">${e.category}</span>
        </div>
      </div>
      <div class="tx-right">
        <div class="tx-amount">−${fmt(e.amount)}</div>
        <button class="tx-delete" onclick="deleteExpense(${e.id})" title="Remove">✕</button>
      </div>
    </div>
  `).join("");
}

async function refresh() {
  const data = await loadData();
  renderCards(data);
  renderChart(data.expenses);
  renderTransactions(data.expenses);
}

// ── Modal ──
function openModal() {
  document.getElementById("overlay").classList.add("active");
  // tiny delay so display:block triggers transition
  requestAnimationFrame(() => {
    document.getElementById("modal").classList.add("active");
  });
  setTimeout(() => document.getElementById("amount").focus(), 50);
}

function closeModal() {
  document.getElementById("modal").classList.remove("active");
  document.getElementById("overlay").classList.remove("active");
  document.getElementById("expenseForm").reset();
  // reset pills
  document.querySelectorAll(".cat-pill").forEach(p => p.classList.remove("active"));
  document.querySelector(".cat-pill[data-cat='Food']").classList.add("active");
  document.getElementById("category").value = "Food";
}

async function submitExpense(e) {
  e.preventDefault();
  const amount   = parseFloat(document.getElementById("amount").value);
  const category = document.getElementById("category").value;
  const note     = document.getElementById("note").value.trim();

  const btn = e.submitter;
  btn.textContent = "Adding…";
  btn.disabled = true;

  await fetch("/api/expense", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ amount, category, note })
  });

  closeModal();
  await refresh();
  showToast(`✓ Added ${fmt(amount)} to ${category}`);
}

async function deleteExpense(id) {
  await fetch(`/api/expense/${id}`, { method: "DELETE" });
  refresh();
  showToast("Expense removed");
}

async function editBudget() {
  const data = await loadData();
  const val  = prompt("Set monthly budget ($):", data.budget);
  if (val === null) return;
  const num  = parseFloat(val);
  if (isNaN(num) || num <= 0) return;
  await fetch("/api/budget", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ budget: num })
  });
  refresh();
  showToast(`Budget updated to ${fmt(num)}`);
}

// ── Toast ──
let toastTimer;
function showToast(msg) {
  const t = document.getElementById("toast");
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove("show"), 2800);
}

// ── Helpers ──
function fmt(n) {
  return "₹" + n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

// ── Keyboard shortcut ──
document.addEventListener("keydown", e => {
  if (e.key === "Escape") closeModal();
  if (e.key === "n" && !e.target.matches("input,select,textarea")) openModal();
});

refresh();
