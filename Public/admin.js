// ---------------- LOGIN ---------------- //
function validateAdmin() {
  const id = document.getElementById('adminId').value;
  const password = document.getElementById('adminPassword').value;

  fetch('/admin-login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, password }),
    credentials: 'include'
  })
  .then(res => {
    if (res.ok) {
      document.getElementById('loginOverlay').style.display = 'none';
      document.getElementById('adminContent').style.display = 'block';
      fetchAllData(); 
    } else {
      document.getElementById('loginError').style.display = 'block';
    }
  });
}

// ---------------- ADD DATA ---------------- //
async function addData(type) {
  const key = document.getElementById("adminKey").value;
  if (key !== "ADM") return alert("Invalid Admin Key");

  let data;
  try {
    if (type === "flight") data = JSON.parse(document.getElementById("flightData").value);
    else if (type === "train") data = JSON.parse(document.getElementById("trainData").value);
    else if (type === "bus") data = JSON.parse(document.getElementById("busData").value);
    else if (type === "driver") data = JSON.parse(document.getElementById("driverData").value);
  } catch (e) {
    return alert("Invalid JSON");
  }

  const res = await fetch(`/admin/add-${type}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ data })
  });

  const result = await res.json();
  alert(result.message);
}

// ---------------- LOGOUT ---------------- //
function logout() {
  fetch("/logout", { method: "POST" })
    .then(() => window.location.href = "/index.html");
}

// ---------------- FETCH DATA ---------------- //
async function fetchData(type) {
  let endpoint;
  if (type === "train") endpoint = "/admin/all-trains";
  else if (type === "bus") endpoint = "/admin/all-buses";
  else if (type === "flight") endpoint = "/admin/all-flights";
  else if (type === "driver") endpoint = "/admin/all-drivers";

  const res = await fetch(endpoint, { credentials: "include" });
  return res.json();
}

// ---------------- RENDER DATA ---------------- //
function createRecordHTML(record, type) {
  let idField;
  if (type === "flight") idField = "flightNumber";
  else if (type === "bus") idField = "busNumber";
  else if (type === "driver") idField = "firstName";
  else idField = "trainName";

  return `
    <div class="record" data-id="${record._id}" data-type="${type}">
      <div class="record-header">
        <strong>${record[idField] || "Unnamed " + type}</strong>
        <button class="edit-btn">Edit</button>
        <button class="delete-btn">Delete</button>
      </div>
      <div class="edit-form">
        ${Object.keys(record)
          .filter(k => k !== "_id" && k !== "__v")
          .map(
            key => `
          <label>${key}</label>
          <input type="text" name="${key}" value="${typeof record[key] === 'object' ? JSON.stringify(record[key]) : record[key]}">
        `
          )
          .join("")}
        <button class="update-btn">Update</button>
      </div>
    </div>
  `;
}

async function renderData(type, containerId) {
  const container = document.getElementById(containerId);
  const data = await fetchData(type);
  container.innerHTML = data.map(record => createRecordHTML(record, type)).join("");

  // Toggle accordion edit
  container.querySelectorAll(".edit-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const recordEl = btn.closest(".record");
      const form = recordEl.querySelector(".edit-form");
      form.classList.toggle("active");
    });
  });

  // Handle update
  container.querySelectorAll(".update-btn").forEach(btn => {
    btn.addEventListener("click", async () => {
      const recordEl = btn.closest(".record");
      const type = recordEl.dataset.type;
      const id = recordEl.dataset.id;
      const inputs = recordEl.querySelectorAll("input");

      let updatedData = {};
      inputs.forEach(input => {
        try {
          updatedData[input.name] = JSON.parse(input.value);
        } catch {
          updatedData[input.name] = input.value;
        }
      });

      const res = await fetch(`/admin/update-${type}/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedData),
        credentials: "include"
      });

      if (res.ok) {
        alert(`${type} updated successfully!`);
        renderData(type, containerId); // refresh
      } else {
        alert(`Error updating ${type}`);
      }
    });
  });

  // Handle delete
  container.querySelectorAll(".delete-btn").forEach(btn => {
    btn.addEventListener("click", async () => {
      const recordEl = btn.closest(".record");
      const type = recordEl.dataset.type;
      const id = recordEl.dataset.id;

      if (!confirm(`Are you sure you want to delete this ${type}?`)) return;

      const res = await fetch(`/admin/delete-${type}/${id}`, {
        method: "DELETE",
        credentials: "include"
      });

      if (res.ok) {
        alert(`${type} deleted successfully!`);
        renderData(type, containerId);
      } else {
        alert(`Error deleting ${type}`);
      }
    });
  });
}

// ---------------- INITIAL LOAD ---------------- //
renderData("train", "trainList");
renderData("bus", "busList");
renderData("flight", "flightList");
renderData("driver", "driverList");
