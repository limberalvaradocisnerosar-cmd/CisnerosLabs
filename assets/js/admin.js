// admin.js
// Dashboard privado con login via Supabase Auth y visualización
// de clics totales y por producto usando Chart.js.

document.addEventListener("DOMContentLoaded", () => {
  const supabase = window.supabaseClient;
  const allowedEmail = window.SUPABASE_ADMIN_EMAIL;

  if (!supabase) {
    console.error("Supabase client no inicializado");
    return;
  }

  const loginView = document.getElementById("login-view");
  const dashboardView = document.getElementById("dashboard-view");
  const loginForm = document.getElementById("login-form");
  const emailInput = document.getElementById("email");
  const passwordInput = document.getElementById("password");
  const loginError = document.getElementById("login-error");

  const totalClicksEl = document.getElementById("total-clicks");
  const tableBody = document.getElementById("clicks-table-body");
  const logoutBtn = document.getElementById("logout-btn");
  const adminEmailBadge = document.getElementById("admin-email-badge");

  let chartInstance = null;

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

  async function loadDashboardData() {
    // 1) Cargamos productos (id, name) para mapear nombres
    const { data: products, error: productsError } = await supabase
      .from("products")
      .select("id, name");

    if (productsError) {
      console.error(productsError);
      return;
    }

    const productMap = new Map();
    products.forEach((p) => {
      productMap.set(p.id, p.name);
    });

    // 2) Cargamos clics
    const { data: clicks, error: clicksError } = await supabase
      .from("clicks")
      .select("product_id");

    if (clicksError) {
      console.error(clicksError);
      return;
    }

    const totalClicks = clicks ? clicks.length : 0;
    totalClicksEl.textContent = totalClicks;

    // 3) Agregamos clics por producto
    const countsByProduct = new Map();
    clicks.forEach((c) => {
      if (!c.product_id) return;
      countsByProduct.set(c.product_id, (countsByProduct.get(c.product_id) || 0) + 1);
    });

    // 4) Construimos tabla
    const rows = [];
    countsByProduct.forEach((count, productId) => {
      const name = productMap.get(productId) || "Producto sin nombre";
      rows.push({ name, count });
    });

    // Ordenamos por más clics
    rows.sort((a, b) => b.count - a.count);

    tableBody.innerHTML = rows
      .map(
        (row) => `
      <tr class="border-b border-slate-800/60 last:border-0">
        <td class="py-1 pr-2 text-left">${row.name}</td>
        <td class="py-1 pl-2 text-right font-semibold">${row.count}</td>
      </tr>
    `
      )
      .join("");

    // 5) Gráfico con Chart.js
    const ctx = document.getElementById("clicks-chart");
    if (!ctx) return;

    const labels = rows.map((r) => r.name);
    const dataValues = rows.map((r) => r.count);

    if (chartInstance) {
      chartInstance.destroy();
    }

    chartInstance = new Chart(ctx, {
      type: "bar",
      data: {
        labels,
        datasets: [
          {
            label: "Clics",
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
          legend: {
            display: false,
          },
        },
        scales: {
          x: {
            ticks: {
              color: "#e5e7eb",
              font: { size: 10 },
            },
            grid: {
              display: false,
            },
          },
          y: {
            ticks: {
              color: "#9ca3af",
              stepSize: 1,
              precision: 0,
            },
            grid: {
              color: "rgba(148, 163, 184, 0.2)",
            },
          },
        },
      },
    });
  }

  // Manejo de login
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

  // Logout
  if (logoutBtn) {
    logoutBtn.addEventListener("click", async () => {
      await supabase.auth.signOut();
      showLogin();
    });
  }

  // Revisamos sesión al cargar
  checkSessionOnLoad();
});
