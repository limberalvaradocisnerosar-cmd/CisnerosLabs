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
    // Show loading state
    totalClicksEl.textContent = "Loading...";
    clicksTodayEl.textContent = "Loading...";
    clicksWeekEl.textContent = "Loading...";
    topProductEl.textContent = "Loading...";
    tableBody.innerHTML = "<tr><td colspan='4' class='text-center py-4 text-slate-400'>Loading...</td></tr>";

    try {
      // 1) Load products
      const { data: products, error: productsError } = await supabase
        .from("products")
        .select("id, name");

      if (productsError) {
        console.error("Error loading products:", productsError);
        totalClicksEl.textContent = "Error";
        tableBody.innerHTML = `<tr><td colspan='4' class='text-center py-4 text-red-400'>Error loading products: ${productsError.message}</td></tr>`;
        return;
      }

      if (!products || products.length === 0) {
        totalClicksEl.textContent = "0";
        clicksTodayEl.textContent = "0";
        clicksWeekEl.textContent = "0";
        topProductEl.textContent = "No products";
        tableBody.innerHTML = "<tr><td colspan='4' class='text-center py-4 text-slate-400'>No products found</td></tr>";
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
        totalClicksEl.textContent = "Error";
        tableBody.innerHTML = `<tr><td colspan='4' class='text-center py-4 text-red-400'>Error loading clicks: ${clicksError.message}</td></tr>`;
        return;
      }

      if (!clicks || clicks.length === 0) {
        totalClicksEl.textContent = "0";
        clicksTodayEl.textContent = "0";
        clicksWeekEl.textContent = "0";
        topProductEl.textContent = "No clicks yet";
        tableBody.innerHTML = "<tr><td colspan='4' class='text-center py-4 text-slate-400'>No clicks registered yet</td></tr>";
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
        const sortedClicks = productClicks.sort((a, b) => 
          new Date(b.created_at) - new Date(a.created_at)
        );
        const total = productClicks.length;
        const today = productClicks.filter((c) => c.created_at >= todayStart).length;
        const lastClick = sortedClicks.length > 0
          ? sortedClicks[0].created_at
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

      // 8) Clicks per product chart (with unique colors per product)
      const ctx = document.getElementById("clicks-chart");
      if (ctx) {
        const sortedProducts = Array.from(productStats.values())
          .sort((a, b) => b.total - a.total);

        // Generate unique colors for each product
        const colors = [
          { bg: "rgba(248, 113, 22, 0.7)", border: "rgba(248, 113, 22, 1)" }, // Orange
          { bg: "rgba(34, 197, 94, 0.7)", border: "rgba(34, 197, 94, 1)" }, // Green
          { bg: "rgba(59, 130, 246, 0.7)", border: "rgba(59, 130, 246, 1)" }, // Blue
          { bg: "rgba(168, 85, 247, 0.7)", border: "rgba(168, 85, 247, 1)" }, // Purple
          { bg: "rgba(236, 72, 153, 0.7)", border: "rgba(236, 72, 153, 1)" }, // Pink
          { bg: "rgba(251, 146, 60, 0.7)", border: "rgba(251, 146, 60, 1)" }, // Amber
        ];

        // Prepare data: one dataset with array of colors for each bar
        const productData = sortedProducts.map(p => p.total);
        const productBgColors = sortedProducts.map((p, index) => colors[index % colors.length].bg);
        const productBorderColors = sortedProducts.map((p, index) => colors[index % colors.length].border);

        if (clicksChartInstance) {
          clicksChartInstance.destroy();
        }

        // Create one dataset per product for legend (hidden bars, only for legend)
        const legendDatasets = sortedProducts.map((product, index) => ({
          label: product.name,
          data: Array(sortedProducts.length).fill(0),
          backgroundColor: colors[index % colors.length].bg,
          borderColor: colors[index % colors.length].border,
          borderWidth: 1.5,
          borderRadius: 6,
          hidden: true, // Hide these bars, only show in legend
        }));

        // Main dataset with all data and colors
        const mainDataset = {
          label: "Clicks",
          data: productData,
          backgroundColor: productBgColors,
          borderColor: productBorderColors,
          borderWidth: 1.5,
          borderRadius: 6,
        };

        // Detect mobile
        const isMobile = window.innerWidth <= 640;
        
        clicksChartInstance = new Chart(ctx, {
          type: "bar",
          data: {
            labels: Array(sortedProducts.length).fill(""), // Empty labels to hide Y-axis
            datasets: [mainDataset, ...legendDatasets],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            indexAxis: "y", // Horizontal bars
            plugins: {
              legend: {
                display: true,
                position: isMobile ? "bottom" : "right",
                labels: {
                  color: "#e5e7eb",
                  font: { size: isMobile ? 10 : 11 },
                  usePointStyle: true,
                  padding: isMobile ? 8 : 12,
                  boxWidth: isMobile ? 10 : 12,
                  filter: function(legendItem, chartData) {
                    // Show only legend items (skip first dataset, show the rest)
                    return legendItem.datasetIndex > 0;
                  },
                },
              },
              tooltip: {
                callbacks: {
                  title: function() {
                    return '';
                  },
                  label: function(context) {
                    if (context.datasetIndex === 0) {
                      const index = context.dataIndex;
                      const product = sortedProducts[index];
                      return product.name + ': ' + context.parsed.x + ' clicks';
                    }
                    return '';
                  }
                }
              }
            },
            scales: {
              x: {
                ticks: { 
                  color: "#9ca3af", 
                  stepSize: 1, 
                  precision: 0,
                  display: true,
                },
                grid: { color: "rgba(148, 163, 184, 0.2)" },
                beginAtZero: true,
              },
              y: {
                ticks: { 
                  color: "#e5e7eb", 
                  font: { size: 10 },
                  display: false, // Hide Y-axis labels
                },
                grid: { display: false },
              },
            },
          },
        });
      }

      // 9) Daily clicks chart (last 7 days) - Show only day numbers
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

        // Show only day numbers (12, 13, 14, etc.)
        const dailyLabels = last7Days.map((d) => {
          const date = new Date(d);
          return date.getDate().toString(); // Just the day number
        });

        // Get current month name for display
        const currentMonth = new Date().toLocaleDateString("en-US", { month: "long" });

        if (dailyChartInstance) {
          dailyChartInstance.destroy();
        }

        // Update chart title with current month
        const dailyChartTitle = document.getElementById("daily-chart-title");
        if (dailyChartTitle) {
          dailyChartTitle.textContent = `Clicks per Day (Last 7 Days) - ${currentMonth}`;
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
                ticks: { 
                  color: "#e5e7eb", 
                  font: { size: window.innerWidth <= 640 ? 12 : 11 } 
                },
                grid: { display: false },
              },
              y: {
                ticks: { 
                  color: "#9ca3af", 
                  stepSize: 1, 
                  precision: 0,
                  font: { size: window.innerWidth <= 640 ? 11 : 10 }
                },
                grid: { color: "rgba(148, 163, 184, 0.2)" },
                beginAtZero: true,
              },
            },
          },
        });
      }
    } catch (err) {
      console.error("Unexpected error loading dashboard:", err);
      totalClicksEl.textContent = "Error";
      tableBody.innerHTML = `<tr><td colspan='4' class='text-center py-4 text-red-400'>Unexpected error: ${err.message}</td></tr>`;
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
