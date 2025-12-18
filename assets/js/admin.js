// admin.js
// Complete admin dashboard with click tracking analytics

document.addEventListener("DOMContentLoaded", () => {
  const supabase = window.supabaseClient;
  const allowedEmail = window.SUPABASE_ADMIN_EMAIL;

  if (!supabase) {
    console.error("Supabase client not initialized");
    return;
  }

  const loginView = document.getElementById("login-view");
  const dashboardView = document.getElementById("dashboard-view");
  const loginForm = document.getElementById("login-form");
  const emailInput = document.getElementById("email");
  const passwordInput = document.getElementById("password");
  const loginError = document.getElementById("login-error");

  const totalClicksEl = document.getElementById("total-clicks");
  const clicksTodayEl = document.getElementById("clicks-today");
  const clicksWeekEl = document.getElementById("clicks-week");
  const topProductEl = document.getElementById("top-product");
  const tableBody = document.getElementById("clicks-table-body");
  const logoutBtn = document.getElementById("logout-btn");
  const adminEmailBadge = document.getElementById("admin-email-badge");

  let clicksChartInstance = null;
  let dailyChartInstance = null;

  function showLogin() {
    loginView.classList.remove("hidden");
    dashboardView.classList.add("hidden");
  }

  function showDashboard() {
    loginView.classList.add("hidden");
    dashboardView.classList.remove("hidden");
  }

  async function checkSessionOnLoad() {
    const { data } = await supabase.auth.getSession();
    const session = data.session;

    if (!session || !session.user) {
      showLogin();
      return;
    }

    const userEmail = session.user.email;
    if (!userEmail || userEmail !== allowedEmail) {
      await supabase.auth.signOut();
      showLogin();
      return;
    }

    adminEmailBadge.textContent = userEmail;
    showDashboard();
    await loadDashboardData();
  }

  function formatDate(date) {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function getTodayStart() {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return now.toISOString();
  }

  function getWeekStart() {
    const now = new Date();
    now.setDate(now.getDate() - 7);
    now.setHours(0, 0, 0, 0);
    return now.toISOString();
  }

  async function loadDashboardData() {
    // 1) Load products
    const { data: products, error: productsError } = await supabase
      .from("products")
      .select("id, name");

    if (productsError) {
      console.error("Error loading products:", productsError);
      return;
    }

    const productMap = new Map();
    products.forEach((p) => {
      productMap.set(p.id, p.name);
    });

    // 2) Load all clicks with timestamps
    const { data: clicks, error: clicksError } = await supabase
      .from("clicks")
      .select("product_id, created_at")
      .order("created_at", { ascending: false });

    if (clicksError) {
      console.error("Error loading clicks:", clicksError);
      return;
    }

    if (!clicks || clicks.length === 0) {
      totalClicksEl.textContent = "0";
      clicksTodayEl.textContent = "0";
      clicksWeekEl.textContent = "0";
      topProductEl.textContent = "No clicks yet";
      tableBody.innerHTML = "<tr><td colspan='4' class='text-center py-4 text-slate-400'>No data available</td></tr>";
      return;
    }

    // 3) Calculate metrics
    const totalClicks = clicks.length;
    const todayStart = getTodayStart();
    const weekStart = getWeekStart();

    const clicksToday = clicks.filter(
      (c) => c.created_at >= todayStart
    ).length;

    const clicksWeek = clicks.filter(
      (c) => c.created_at >= weekStart
    ).length;

    // 4) Calculate clicks per product
    const productStats = new Map();

    products.forEach((product) => {
      const productClicks = clicks.filter((c) => c.product_id === product.id);
      const total = productClicks.length;
      const today = productClicks.filter((c) => c.created_at >= todayStart).length;
      const lastClick = productClicks.length > 0
        ? productClicks[0].created_at
        : null;

      productStats.set(product.id, {
        name: product.name,
        total,
        today,
        lastClick,
      });
    });

    // 5) Find top product
    let topProduct = { name: "None", count: 0 };
    productStats.forEach((stats, id) => {
      if (stats.total > topProduct.count) {
        topProduct = { name: stats.name, count: stats.total };
      }
    });

    // 6) Update overview cards
    totalClicksEl.textContent = totalClicks.toLocaleString();
    clicksTodayEl.textContent = clicksToday.toLocaleString();
    clicksWeekEl.textContent = clicksWeek.toLocaleString();
    topProductEl.textContent = `${topProduct.name} (${topProduct.count})`;

    // 7) Build table
    const tableRows = Array.from(productStats.values())
      .sort((a, b) => b.total - a.total)
      .map(
        (stats) => `
      <tr class="border-b border-slate-800/60 last:border-0">
        <td class="py-2 pr-4 text-left">${stats.name}</td>
        <td class="py-2 px-2 text-right font-semibold">${stats.total}</td>
        <td class="py-2 px-2 text-right">${stats.today}</td>
        <td class="py-2 pl-2 text-right text-slate-400 text-xs">${
          stats.lastClick ? formatDate(stats.lastClick) : "—"
        }</td>
      </tr>
    `
      )
      .join("");

    tableBody.innerHTML = tableRows || "<tr><td colspan='4' class='text-center py-4 text-slate-400'>No data</td></tr>";

    // 8) Clicks per product chart
    const ctx = document.getElementById("clicks-chart");
    if (ctx) {
      const labels = Array.from(productStats.values())
        .sort((a, b) => b.total - a.total)
        .map((s) => s.name);
      const dataValues = Array.from(productStats.values())
        .sort((a, b) => b.total - a.total)
        .map((s) => s.total);

      if (clicksChartInstance) {
        clicksChartInstance.destroy();
      }

      clicksChartInstance = new Chart(ctx, {
        type: "bar",
        data: {
          labels,
          datasets: [
            {
              label: "Clicks",
              data: dataValues,
              backgroundColor: "rgba(248, 113, 22, 0.7)",
              borderColor: "rgba(248, 113, 22, 1)",
              borderWidth: 1.5,
              borderRadius: 6,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
          },
          scales: {
            x: {
              ticks: { color: "#e5e7eb", font: { size: 10 } },
              grid: { display: false },
            },
            y: {
              ticks: { color: "#9ca3af", stepSize: 1, precision: 0 },
              grid: { color: "rgba(148, 163, 184, 0.2)" },
            },
          },
        },
      });
    }

    // 9) Daily clicks chart (last 7 days)
    const dailyCtx = document.getElementById("daily-chart");
    if (dailyCtx) {
      const last7Days = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        date.setHours(0, 0, 0, 0);
        last7Days.push(date.toISOString());
      }

      const dailyCounts = last7Days.map((dayStart) => {
        const dayEnd = new Date(dayStart);
        dayEnd.setHours(23, 59, 59, 999);
        return clicks.filter(
          (c) => c.created_at >= dayStart && c.created_at <= dayEnd.toISOString()
        ).length;
      });

      const dailyLabels = last7Days.map((d) => {
        const date = new Date(d);
        return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      });

      if (dailyChartInstance) {
        dailyChartInstance.destroy();
      }

      dailyChartInstance = new Chart(dailyCtx, {
        type: "bar",
        data: {
          labels: dailyLabels,
          datasets: [
            {
              label: "Clicks",
              data: dailyCounts,
              backgroundColor: "rgba(34, 197, 94, 0.7)",
              borderColor: "rgba(34, 197, 94, 1)",
              borderWidth: 1.5,
              borderRadius: 6,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
          },
          scales: {
            x: {
              ticks: { color: "#e5e7eb", font: { size: 10 } },
              grid: { display: false },
            },
            y: {
              ticks: { color: "#9ca3af", stepSize: 1, precision: 0 },
              grid: { color: "rgba(148, 163, 184, 0.2)" },
              beginAtZero: true,
            },
          },
        },
      });
    }
  }

  // Login handler
  if (loginForm) {
    loginForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      loginError.textContent = "";

      const email = emailInput.value.trim();
      const password = passwordInput.value;

      if (!email || !password) {
        loginError.textContent = "Introduce tu email y contraseña.";
        return;
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error || !data.session || !data.session.user) {
        loginError.textContent = "Credenciales no válidas.";
        return;
      }

      const userEmail = data.session.user.email;
      if (!userEmail || userEmail !== allowedEmail) {
        await supabase.auth.signOut();
        loginError.textContent = "Este email no está autorizado para ver el panel.";
        return;
      }

      adminEmailBadge.textContent = userEmail;
      showDashboard();
      await loadDashboardData();
    });
  }

  // Logout handler
  if (logoutBtn) {
    logoutBtn.addEventListener("click", async () => {
      await supabase.auth.signOut();
      showLogin();
    });
  }

  // Check session on load
  checkSessionOnLoad();
});
