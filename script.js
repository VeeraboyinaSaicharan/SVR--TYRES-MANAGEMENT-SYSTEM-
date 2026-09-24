let tyres = [];
let customers = JSON.parse(localStorage.getItem("customers")) || [];
let cart = [];
let currentBill = null;

const sectionMeta = {
  dashboard: { title: "Dashboard", subtitle: "Overview of your tyre shop" },
  inventory: { title: "Inventory", subtitle: "Manage stock and add tyres" },
  billing: { title: "Billing", subtitle: "Process sales and invoices" },
  analytics: { title: "Analytics", subtitle: "Sales and profit trends" },
  customers: { title: "Customers", subtitle: "Purchase history" }
};

function showSection(name) {
  document.querySelectorAll(".section").forEach(s => s.classList.remove("active"));
  document.querySelectorAll(".nav-item").forEach(n => n.classList.remove("active"));

  document.getElementById("section-" + name).classList.add("active");
  document.querySelector(`.nav-item[data-section="${name}"]`).classList.add("active");

  const meta = sectionMeta[name];
  document.getElementById("pageTitle").innerText = meta.title;
  document.getElementById("pageSubtitle").innerText = meta.subtitle;
}

function logout() {
  document.getElementById("mainApp").style.display = "none";
  document.getElementById("loginBox").style.display = "flex";
  document.getElementById("username").value = "";
  document.getElementById("password").value = "";
  showToast("Logged out successfully");
}
// Load saved data
window.onload = function () {
  let data = localStorage.getItem("tyres");
  if (data) {
    tyres = JSON.parse(data);
  }
  displayTyres();
  loadTyresToSelect();
  displayCart();
  updateDashboard();
  loadChart();
  loadProfitChart(); //  ADD THIS
  loadCustomers();
};

function addTyre() {
  let brand = document.getElementById("brand").value;
  let size = document.getElementById("size").value;
  let price = document.getElementById("price").value;
  let cost = document.getElementById("cost").value; //  ADD
  let quantity = document.getElementById("quantity").value;

  // validation
  if (!brand || !size || !price || !quantity) {
    showToast("❌ Fill all fields!", "error");
    return;
  }

  let tyre = {
    brand: brand,
    size: size,
    price: Number(price),
    cost: Number(cost),
    quantity: Number(quantity)
  };

  tyres.push(tyre);
  
  // save to localStorage
  localStorage.setItem("tyres", JSON.stringify(tyres));

  displayTyres();
  loadTyresToSelect();
  
  // clear inputs
  document.getElementById("brand").value = "";
  document.getElementById("size").value = "";
  document.getElementById("price").value = "";
  document.getElementById("quantity").value = "";
  document.getElementById("cost").value = "";
  showToast("✅ Tyre added successfully!");
}

function displayTyres() {
  let table = document.getElementById("tableBody");
  table.innerHTML = "";

  // ✅ total stock
  let totalStock = tyres.reduce((sum, t) => sum + t.quantity, 0);

  document.getElementById("stockCount").innerText = "Total Stock: " + totalStock;

  let lowStock = tyres.filter(t => t.quantity > 0 && t.quantity < 5).length;
  document.getElementById("lowStockCount").innerText = "Low Stock: " + lowStock;

  let outOfStock = tyres.filter(t => t.quantity === 0).length;
  document.getElementById("outOfStockCount").innerText = "Out of Stock: " + outOfStock;

  if (tyres.length === 0) {
  table.innerHTML = `<tr><td colspan="5">No tyres added</td></tr>`;
  return;
}

  // table rows
  tyres.forEach(function(t, index) {

    let rowClass = "";

    if (t.quantity === 0) {
      rowClass = "out-of-stock";
    } else if (t.quantity < 5) {
      rowClass = "low-stock";
    }

    table.innerHTML += `
      <tr class="${rowClass}">
        <td>${t.brand}</td>
        <td>${t.size}</td>
        <td>₹${t.price}</td>
        <td>${t.quantity}</td>
        <td>
          <button class="btn-delete" onclick="deleteTyre(${index})"><i class="fas fa-trash"></i></button>
          <button class="btn-edit" onclick="editTyre(${index})"><i class="fas fa-edit"></i></button>
        </td>
      </tr>
    `;
  });
}

function deleteTyre(index) {
  if (confirm("Are you sure you want to delete?")) {
    tyres.splice(index, 1);
    localStorage.setItem("tyres", JSON.stringify(tyres));
    displayTyres();
    loadTyresToSelect();
  }
}

function editTyre(index) {
  let t = tyres[index];

  document.getElementById("brand").value = t.brand;
  document.getElementById("size").value = t.size;
  document.getElementById("price").value = t.price;
  document.getElementById("quantity").value = t.quantity;

  tyres.splice(index, 1);

  localStorage.setItem("tyres", JSON.stringify(tyres)); // ✅ FIX
  displayTyres(); // ✅ refresh table
  loadTyresToSelect();
}

function searchTyres() {
  let searchValue = document.getElementById("search").value.toLowerCase();

  let table = document.getElementById("tableBody");
  table.innerHTML = "";

  tyres.forEach(function(t, index) {

    // ✅ check both brand AND size
    if (
      t.brand.toLowerCase().includes(searchValue) ||
      t.size.toLowerCase().includes(searchValue)
    ) {

      let rowClass = "";

      if (t.quantity === 0) {
        rowClass = "out-of-stock";
      } else if (t.quantity < 5) {
        rowClass = "low-stock";
      }

      table.innerHTML += `
        <tr class="${rowClass}">
          <td>${t.brand}</td>
          <td>${t.size}</td>
          <td>₹${t.price}</td>
          <td>${t.quantity === 0 ? "Out of Stock" : t.quantity}</td>
          <td>
            <button class="btn-delete" onclick="deleteTyre(${index})"><i class="fas fa-trash"></i></button>
            <button class="btn-edit" onclick="editTyre(${index})"><i class="fas fa-edit"></i></button>
          </td>
        </tr>
      `;
    }

  });
}

function loadTyresToSelect() {
  let select = document.getElementById("tyreSelect");
  select.innerHTML = "";

  if (tyres.length === 0) {
    select.innerHTML = `<option>No tyres available</option>`;
    document.getElementById("saleBtn").disabled = true;
    return;
  }

  tyres.forEach(function(t, index) {
    select.innerHTML += `
      <option value="${index}" ${t.quantity === 0 ? "disabled" : ""}>
        ${t.brand} - ${t.size} (₹${t.price}) ${t.quantity === 0 ? "[Out]" : ""}
      </option>
    `;
  });
}

function completeSale() {
  if (cart.length === 0) {
    showToast("🛒 Cart is empty!");
    return;
  }

  let name = document.getElementById("customerName").value;
  let phone = document.getElementById("customerPhone").value;

  if (!name || !phone) {
    showToast("❌ Enter customer details!", "error");
    return;
  }

  // remove spaces
  phone = phone.replace(/\s/g, "");

  if (!/^[0-9]{10}$/.test(phone)) {
    showToast("❌ Invalid phone number!", "error");
    return;
  }

  let subTotal = 0;

  // ✅ check stock
  for (let item of cart) {
    let tyre = tyres[item.index];
    if (tyre.quantity < item.qty) {
      showToast("⚠️ Stock issue!", "warning");
      return;
    }
  }

  // ✅ reduce stock
  for (let item of cart) {
    let tyre = tyres[item.index];
    tyre.quantity -= item.qty;
    subTotal += item.total;
  }

  let gst = subTotal * 0.18;
  let grandTotal = subTotal + gst;

  // ✅ FIX: declare first
  let now = new Date();
  let day = now.toLocaleString('en-IN', { weekday: 'long' });

  let totalProfit = 0;

  for (let item of cart) {
  let tyre = tyres[item.index];

  let profit = (tyre.price - tyre.cost) * item.qty;
  totalProfit += profit;
}

  currentBill = {
    name: name,
    phone: phone,
    items: [...cart],
    subTotal: subTotal,
    gst: gst,
    total: grandTotal,
    date: new Date().toISOString(),
    day: day
  };

  customers.push({
  name,
  phone,
  date: new Date().toISOString(),
  total: grandTotal,
  profit: totalProfit
});

  localStorage.setItem("tyres", JSON.stringify(tyres));

  displayTyres();
  loadTyresToSelect();

  // invoice
  let itemsHTML = "";
  cart.forEach(item => {
    itemsHTML += `
      <div class="invoice-line">
        <span>${item.brand} (${item.size}) x ${item.qty}</span>
        <span>₹${item.total}</span>
      </div>
    `;
  });

  document.getElementById("invoiceBox").innerHTML = `
    <div class="invoice-title">🛞 SVR TYRES</div>
    <hr>

    <div class="invoice-line">
      <span>Name:</span>
      <span>${name}</span>
    </div>

    <div class="invoice-line">
      <span>Phone:</span>
      <span>${phone}</span>
    </div>

    <div class="invoice-line">
      <span>Day:</span>
      <span>${day}</span>
    </div>

    <div class="invoice-line">
      <span>Date:</span>
      <span>${now.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</span>
    </div>

    <hr>
    ${itemsHTML}
    <hr>

    <div class="invoice-line">
      <span>Subtotal:</span>
      <span>₹${subTotal}</span>
    </div>

    <div class="invoice-line">
      <span>GST (18%):</span>
      <span>₹${gst.toFixed(2)}</span>
    </div>

    <hr>

    <div class="invoice-line" style="font-size:18px;">
      <strong>Total:</strong>
      <strong>₹${grandTotal.toFixed(2)}</strong>
    </div>

    <p style="text-align:center;">🙏 Thank you!</p>
  `;

  // save customer
  // customers.push({
  //   name,
  //   phone,
  //   date: new Date().toISOString(),
  //   day,
  //   total: grandTotal,
  //   items: [...cart]
  // });

  localStorage.setItem("customers", JSON.stringify(customers));

  // reset
  cart = [];
  displayCart();

  document.getElementById("customerName").value = "";
  document.getElementById("customerPhone").value = "";

  showToast("✅ Sale Completed Successfully!");

  updateDashboard();
  loadChart();
  loadCustomers();
  loadProfitChart();
}

function disableSale() {
  // Only disable if cart is empty
  if (cart.length === 0) {
    document.getElementById("saleBtn").disabled = true;
  }
}

function printInvoice() {
  let content = document.getElementById("invoiceBox").innerHTML;

  if (!content.trim()) {
    showToast("❌ No invoice to print!", "error");
    return;
  }

  let newWindow = window.open("", "", "width=600,height=600");
  newWindow.document.write(`
    <html>
      <head><title>Invoice</title></head>
      <body>${content}</body>
    </html>
  `);

  newWindow.document.close();
  newWindow.print();

  setTimeout(() => {
  document.getElementById("invoiceBox").innerHTML = "";
  }, 500);

}

function addToCart() {
  let index = document.getElementById("tyreSelect").value;
  let qty = document.getElementById("billQty").value;
  let cost = document.getElementById("cost").value;
  let tyre = tyres[index];

  if (tyre.quantity === 0) {
  showToast("❌ Out of stock!", "error");
  return;
}

if (!qty || qty <= 0) {
  showToast("❌ Enter valid quantity!", "error");
  return;
}

if (qty > tyre.quantity) {
  showToast("⚠️ Not enough stock!", "warning");
  return;
}

let existing = cart.find(item => item.index == index);

if (existing && existing.qty + Number(qty) > tyre.quantity) {
  showToast("⚠️ Exceeds stock!", "warning");
  return;
}

  if (existing) {
  existing.qty += Number(qty);
  existing.total = existing.qty * existing.price;
} else {
  let item = {
    brand: tyre.brand,
    size: tyre.size,
    price: tyre.price,
    qty: Number(qty),
    total: tyre.price * qty,
    index: index,
    cost: tyre.cost,
  };
  cart.push(item);
}

  showToast("🛒 Added to cart!", "success");

  document.getElementById("billQty").value = "";

  document.getElementById("saleBtn").disabled = false;

  displayCart();
}

function displayCart() {

  let box = document.getElementById("cartBox");
  box.innerHTML = "";

  if (cart.length === 0) {
  box.innerHTML = `
  <div style="text-align:center;color:#999;padding:20px;">
    <i class="fas fa-shopping-cart" style="font-size:30px;"></i>
    <p>No items in cart</p>
  </div>
  `;
  document.getElementById("saleBtn").disabled = true; // disable again
  return;
}
  
  let total = 0;

  cart.forEach((item, i) => {
  total += item.total;

  box.innerHTML += `
  <div class="cart-item">
    <span>${item.brand} (${item.size})</span>
    <span>${item.qty} x ₹${item.price}</span>
    <span>₹${item.total}</span>
    <button onclick="removeFromCart(${i})"><i class="fas fa-times"></i></button>
  </div>
`;
});

  box.innerHTML += `<hr><b>Total: ₹${total}</b>`;
}

function removeFromCart(index) {
  cart.splice(index, 1);
  displayCart();
}

function formatPhone(input) {
  let value = input.value.replace(/\D/g, ""); // only numbers

  if (value.length > 5) {
    value = value.slice(0,5) + " " + value.slice(5,10);
  }

  input.value = value;
}

function sendWhatsApp() {

  if (!currentBill) {
    showToast("❌ No bill available!", "error");
    return;
  }

  let message = `🛞 *SVR TYRES*\n\n`;
  message += `👤 Customer: ${currentBill.name}\n`;
  message += `📞 Phone: ${currentBill.phone}\n`;
  message += `📅 Date: ${new Date().toLocaleString('en-IN')}\n\n`;

  message += `🧾 *Items:*\n`;

  currentBill.items.forEach(item => {
    message += `• ${item.brand} (${item.size}) x ${item.qty} = ₹${item.total}\n`;
  });

  message += `\n----------------------\n`;
  message += `Subtotal: ₹${currentBill.subTotal}\n`;
  message += `GST (18%): ₹${currentBill.gst.toFixed(2)}\n`;
  message += `💰 *Total: ₹${currentBill.total.toFixed(2)}*\n`;
  message += `----------------------\n`;
  message += `🙏 Thank you!`;

  let url = `https://wa.me/91${currentBill.phone}?text=${encodeURIComponent(message)}`;

  window.open(url, "_blank");

}

function showCustomers() {
  let data = JSON.parse(localStorage.getItem("customers")) || [];
  console.log(data);
}

function showToast(message, type = "success") {
  let toast = document.getElementById("toast");

  toast.className = "";
  toast.classList.add("show", type);

  toast.innerText = message;

  // 🔊 SOUND LOGIC
  let sound;

  if (type === "success") {
    sound = new Audio("success.mp3");
  } else if (type === "error") {
    sound = new Audio("error.mp3");
  } else if (type === "warning") {
    sound = new Audio("warning.mp3");
  }

  if (sound) sound.play();

  setTimeout(() => {
    toast.classList.remove("show");
  }, 2500);
}

function updateDashboard() {
  let customers = JSON.parse(localStorage.getItem("customers")) || [];

  let today = new Date();
  let todayStr = today.getFullYear() + "-" + (today.getMonth()+1) + "-" + today.getDate();

  let todaySales = 0;
  let totalSales = 0;
  let totalProfit = 0;

  customers.forEach(c => {
    let d = new Date(c.date);
    let saleStr = d.getFullYear() + "-" + (d.getMonth()+1) + "-" + d.getDate();

    totalSales += c.total;
    totalProfit += c.profit || 0;

    if (saleStr === todayStr) {
      todaySales += c.total;
    }
  });

  document.getElementById("todaySales").innerText = "₹" + todaySales.toFixed(2);
  document.getElementById("totalSales").innerText = "₹" + totalSales.toFixed(2);
  document.getElementById("totalCustomers").innerText = customers.length;
  document.getElementById("totalProfit").innerText = "₹" + totalProfit.toFixed(2);
}

function loadChart() {
  let customers = JSON.parse(localStorage.getItem("customers")) || [];

  let salesByDate = {};

  customers.forEach(c => {
    let date = new Date(c.date).toLocaleDateString('en-IN');

    if (!salesByDate[date]) {
      salesByDate[date] = 0;
    }

    salesByDate[date] += c.total;
  });

  let labels = Object.keys(salesByDate);
  let data = Object.values(salesByDate);

  let ctx = document.getElementById("salesChart").getContext("2d");

  new Chart(ctx, {
    type: "line",
    data: {
      labels: labels,
      datasets: [{
        label: "Sales ₹",
        data: data,
        borderWidth: 2,
        fill: false
      }]
    }
  });
}

function loadCustomers() {
  let data = JSON.parse(localStorage.getItem("customers")) || [];
  let table = document.getElementById("customerTable");

  table.innerHTML = "";

  data.forEach(c => {
    table.innerHTML += `
      <tr>
        <td>${c.name}</td>
        <td>${c.phone}</td>
        <td>${new Date(c.date).toLocaleString('en-IN')}</td>
        <td>₹${c.total.toFixed(2)}</td>
      </tr>
    `;
  });
}

function login() {
  let user = document.getElementById("username").value;
  let pass = document.getElementById("password").value;

  if (user === "admin" && pass === "1234") {
    document.getElementById("loginBox").style.display = "none";
    document.getElementById("mainApp").style.display = "flex";
    showToast("✅ Login Successful!");
  } else {
    showToast("❌ Wrong credentials!", "error");
  }
}

function exportExcel() {
  let customers = JSON.parse(localStorage.getItem("customers")) || [];

  let csv = "Name,Phone,Date,Total\n";

  customers.forEach(c => {
    csv += `${c.name},${c.phone},${c.date},${c.total}\n`;
  });

  let blob = new Blob([csv], { type: "text/csv" });
  let url = URL.createObjectURL(blob);

  let a = document.createElement("a");
  a.href = url;
  a.download = "sales.csv";
  a.click();

  showToast("📤 Excel downloaded!");
}

function filterSales(type) {
  let customers = JSON.parse(localStorage.getItem("customers")) || [];

  let now = new Date();
  let filteredSales = 0;

  customers.forEach(c => {
    let d = new Date(c.date);

    if (type === "today") {
      if (d.toDateString() === now.toDateString()) {
        filteredSales += c.total;
      }
    }

    if (type === "week") {
      let diff = (now - d) / (1000 * 60 * 60 * 24);
      if (diff <= 7) {
        filteredSales += c.total;
      }
    }

    if (type === "month") {
      if (
        d.getMonth() === now.getMonth() &&
        d.getFullYear() === now.getFullYear()
      ) {
        filteredSales += c.total;
      }
    }
  });

  showToast(`💰 ${type.toUpperCase()} Sales: ₹${filteredSales.toFixed(2)}`);
}

function loadProfitChart() {
  let customers = JSON.parse(localStorage.getItem("customers")) || [];

  let profitByDate = {};

  customers.forEach(c => {
    let date = new Date(c.date).toLocaleDateString('en-IN');

    if (!profitByDate[date]) {
      profitByDate[date] = 0;
    }

    profitByDate[date] += c.profit || 0;
  });

  let labels = Object.keys(profitByDate);
  let data = Object.values(profitByDate);

  if (window.profitChartInstance) {
  window.profitChartInstance.destroy();
}

let ctx = document.getElementById("profitChart").getContext("2d");

window.profitChartInstance = new Chart(ctx, {
    type: "bar",
    data: {
      labels: labels,
      datasets: [{
        label: "Profit ₹",
        data: data,
        borderWidth: 2
      }]
    }
  });
}