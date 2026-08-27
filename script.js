/* ============================================================
   VISION OF LOVE — GITHUB PAGES JAVASCRIPT
   This version is designed for static GitHub Pages hosting.
   It does not require Node.js or a server.

   IMPORTANT:
   GitHub Pages cannot write into TEXTFILE/*.txt. To keep the
   complete website testable on GitHub Pages, records are stored
   in the browser's localStorage. The Download buttons can export
   the displayed records as CSV files.
   ============================================================ */

/* ---------- 1. Storage keys ---------- */
const STORAGE = {
  distribution: "visionOfLove_distribution",
  donation: "visionOfLove_donation",
  packages: "visionOfLove_packages",
  searchLog: "visionOfLove_searchLog"
};

/* ---------- 2. DOM helpers ---------- */
const $ = (selector, parent = document) => parent.querySelector(selector);
const $$ = (selector, parent = document) => [...parent.querySelectorAll(selector)];

function escapeHTML(value = "") {
  return String(value).replace(/[&<>"']/g, char => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
  }[char]));
}

function showFeedback(element, message, type = "success") {
  if (!element) return;
  element.textContent = message;
  element.className = `feedback show ${type}`;
}

function getRecords(key) {
  try {
    return JSON.parse(localStorage.getItem(key) || "[]");
  } catch (_) {
    return [];
  }
}

function saveRecords(key, records) {
  localStorage.setItem(key, JSON.stringify(records));
}

/* ---------- 3. Three-line navigation ---------- */
function setupNavigation() {
  const menu = $("#menuButton");
  const close = $("#navClose");
  const panel = $("#navPanel");
  const overlay = $("#navOverlay");
  if (!menu || !panel) return;

  const open = () => {
    panel.classList.add("open");
    overlay?.classList.add("open");
    panel.setAttribute("aria-hidden", "false");
  };

  const shut = () => {
    panel.classList.remove("open");
    overlay?.classList.remove("open");
    panel.setAttribute("aria-hidden", "true");
  };

  menu.addEventListener("click", open);
  close?.addEventListener("click", shut);
  overlay?.addEventListener("click", shut);
  document.addEventListener("keydown", e => {
    if (e.key === "Escape") shut();
  });
}

/* ---------- 4. Validation ---------- */
function required(value) {
  return String(value ?? "").trim().length > 0;
}

function positiveNumber(value) {
  return Number.isFinite(Number(value)) && Number(value) > 0;
}

function validEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value).trim());
}

function validPhone(value) {
  return /^[0-9+()\-.\s]{7,20}$/.test(String(value).trim());
}

function validateFamily(data) {
  if (!Object.values(data).every(required)) return "Please complete the required fields.";
  if (!positiveNumber(data.members)) return "Please enter a valid quantity.";
  if (!validEmail(data.email)) return "Please enter a valid email address.";
  if (!validPhone(data.telephone)) return "Please enter a valid-looking telephone number.";
  return null;
}

/* ---------- 5. Distribution / Family Records ---------- */
function setupDistribution() {
  const form = $("#distributionForm");
  const tableBody = $("#distributionTableBody");
  const feedback = $("#distributionFeedback");
  const filter = $("#distributionFilter");
  const editId = $("#distributionEditId");
  if (!form || !tableBody) return;

  let records = getRecords(STORAGE.distribution);

  const render = () => {
    const term = (filter?.value || "").trim().toLowerCase();
    const visible = records.filter(r =>
      Object.values(r).some(v => String(v).toLowerCase().includes(term))
    );

    tableBody.innerHTML = visible.length ? visible.map(r => `
      <tr>
        <td>${escapeHTML(r.familyId)}</td>
        <td>${escapeHTML(r.name)}</td>
        <td>${escapeHTML(r.surname)}</td>
        <td>${escapeHTML(r.members)}</td>
        <td>${escapeHTML(r.package)}</td>
        <td>${escapeHTML(r.collectionDate)}</td>
        <td>
          <div class="table-actions">
            <button class="small-btn small-edit" data-edit="${escapeHTML(r.familyId)}">Update</button>
          </div>
        </td>
      </tr>
    `).join("") : `<tr><td colspan="7" class="empty-row">No family records found.</td></tr>`;

    $$("[data-edit]", tableBody).forEach(button => {
      button.addEventListener("click", () => loadFamily(button.dataset.edit));
    });
  };

  const loadFamily = id => {
    const record = records.find(r => r.familyId === id);
    if (!record) {
      showFeedback(feedback, "Record not found.", "error");
      return;
    }

    Object.entries(record).forEach(([key, value]) => {
      const field = form.elements[key];
      if (field) field.value = value;
    });

    editId.value = id;
    showFeedback(feedback, "Family record loaded for update.", "info");
    window.scrollTo({top:0, behavior:"smooth"});
  };

  form.addEventListener("submit", event => {
    event.preventDefault();

    const data = Object.fromEntries(new FormData(form).entries());
    delete data.editId;

    const error = validateFamily(data);
    if (error) {
      showFeedback(feedback, error, "error");
      return;
    }

    const editing = editId.value;
    if (editing) {
      const index = records.findIndex(r => r.familyId === editing);
      if (index < 0) {
        showFeedback(feedback, "Record not found.", "error");
        return;
      }

      if (data.familyId !== editing &&
          records.some((r,i) => i !== index && r.familyId === data.familyId)) {
        showFeedback(feedback, "Family ID already exists.", "error");
        return;
      }

      records[index] = data;
      saveRecords(STORAGE.distribution, records);
      showFeedback(feedback, "Record updated successfully.");
    } else {
      if (records.some(r => r.familyId === data.familyId)) {
        showFeedback(feedback, "Family ID already exists.", "error");
        return;
      }

      records.push(data);
      saveRecords(STORAGE.distribution, records);
      showFeedback(feedback, "Family record saved successfully.");
    }

    form.reset();
    editId.value = "";
    render();
  });

  $("#distributionClear")?.addEventListener("click", () => {
    form.reset();
    editId.value = "";
    showFeedback(feedback, "Form cleared.", "info");
  });

  filter?.addEventListener("input", render);
  $("#distributionPrint")?.addEventListener("click", () => window.print());
  $("#distributionDownload")?.addEventListener("click", () =>
    downloadCSV(records, "distribution-records.csv")
  );

  render();
}

/* ---------- 6. Donation ---------- */
function setupDonation() {
  const form = $("#donationForm");
  const tableBody = $("#donationTableBody");
  const feedback = $("#donationFeedback");
  if (!form || !tableBody) return;

  let records = getRecords(STORAGE.donation);

  const render = () => {
    tableBody.innerHTML = records.length ? records.map(r => `
      <tr>
        <td>${escapeHTML(r.donorType)}</td>
        <td>${escapeHTML(r.donorName)}</td>
        <td>${escapeHTML(r.donationType)}</td>
        <td>${escapeHTML(r.quantity)}</td>
        <td>${escapeHTML(r.donationDate)}</td>
      </tr>
    `).join("") : `<tr><td colspan="5" class="empty-row">No donations recorded.</td></tr>`;
  };

  form.addEventListener("submit", event => {
    event.preventDefault();

    const data = Object.fromEntries(new FormData(form).entries());

    if (!Object.values(data).every(required)) {
      showFeedback(feedback, "Please complete the required fields.", "error");
      return;
    }

    if (!positiveNumber(data.quantity)) {
      showFeedback(feedback, "Please enter a valid quantity.", "error");
      return;
    }

    records.push(data);
    saveRecords(STORAGE.donation, records);
    showFeedback(feedback, "Donation saved successfully.");
    form.reset();
    render();
  });

  $("#donationClear")?.addEventListener("click", () => {
    form.reset();
    showFeedback(feedback, "Form cleared.", "info");
  });

  $("#donationPrint")?.addEventListener("click", () => window.print());
  $("#donationDownload")?.addEventListener("click", () =>
    downloadCSV(records, "donations.csv")
  );

  render();
}

/* ---------- 7. Search / Delete ---------- */
function setupDeleteSearch() {
  const form = $("#searchForm");
  const resultBox = $("#searchResult");
  const feedback = $("#searchFeedback");
  if (!form || !resultBox) return;

  form.addEventListener("submit", event => {
    event.preventDefault();

    const value = $("#searchValue").value.trim().toLowerCase();
    if (!value) {
      showFeedback(feedback, "Please complete the required fields.", "error");
      return;
    }

    const records = getRecords(STORAGE.distribution);
    const record = records.find(r =>
      Object.values(r).some(v => String(v).toLowerCase().includes(value))
    );

    if (!record) {
      resultBox.innerHTML = `<div class="feedback show error">Record not found.</div>`;
      return;
    }

    resultBox.innerHTML = `
      <div class="panel">
        <h2>Matching Family Record</h2>
        <div class="form-grid">
          <div><strong>Family ID</strong><br>${escapeHTML(record.familyId)}</div>
          <div><strong>Name</strong><br>${escapeHTML(record.name)}</div>
          <div><strong>Surname</strong><br>${escapeHTML(record.surname)}</div>
          <div><strong>Members</strong><br>${escapeHTML(record.members)}</div>
          <div><strong>Email</strong><br>${escapeHTML(record.email)}</div>
          <div><strong>Telephone</strong><br>${escapeHTML(record.telephone)}</div>
          <div><strong>Package</strong><br>${escapeHTML(record.package)}</div>
          <div><strong>Collection Date</strong><br>${escapeHTML(record.collectionDate)}</div>
        </div>
        <div class="form-actions">
          <button class="danger-btn icon-btn" id="deleteFoundRecord">
            <img src="LOGOS/delete.png" alt=""> Delete
          </button>
        </div>
      </div>
    `;

    $("#deleteFoundRecord")?.addEventListener("click", () => {
      if (!window.confirm("Are you sure you want to delete this record?")) return;

      const current = getRecords(STORAGE.distribution);
      const updated = current.filter(r => r.familyId !== record.familyId);
      saveRecords(STORAGE.distribution, updated);

      const logs = getRecords(STORAGE.searchLog);
      logs.push({
        action:"delete",
        familyId:record.familyId,
        timestamp:new Date().toISOString()
      });
      saveRecords(STORAGE.searchLog, logs);

      showFeedback(feedback, "Record deleted successfully.");
      resultBox.innerHTML = "";
      form.reset();
    });
  });
}

/* ---------- 8. Package Allocation ---------- */
function setupPackages() {
  const form = $("#packageForm");
  const tableBody = $("#packageTableBody");
  const feedback = $("#packageFeedback");
  const editId = $("#packageEditId");
  if (!form || !tableBody) return;

  let records = getRecords(STORAGE.packages);

  const render = () => {
    tableBody.innerHTML = records.length ? records.map(r => `
      <tr>
        <td>${escapeHTML(r.packageId)}</td>
        <td>${escapeHTML(r.packageName)}</td>
        <td>${escapeHTML(r.packageType)}</td>
        <td>${escapeHTML(r.quantity)}</td>
        <td>${escapeHTML(r.status)}</td>
        <td>
          <div class="table-actions">
            <button class="small-btn small-edit" data-package-edit="${escapeHTML(r.packageId)}">Update</button>
            <button class="small-btn small-delete" data-package-delete="${escapeHTML(r.packageId)}">Delete</button>
          </div>
        </td>
      </tr>
    `).join("") : `<tr><td colspan="6" class="empty-row">No package records found.</td></tr>`;

    $$("[data-package-edit]", tableBody).forEach(button => {
      button.addEventListener("click", () => loadPackage(button.dataset.packageEdit));
    });

    $$("[data-package-delete]", tableBody).forEach(button => {
      button.addEventListener("click", () => deletePackage(button.dataset.packageDelete));
    });
  };

  const loadPackage = id => {
    const record = records.find(r => r.packageId === id);

    if (!record) {
      showFeedback(feedback, "Record not found.", "error");
      return;
    }

    Object.entries(record).forEach(([key,value]) => {
      const field = form.elements[key];
      if (field) field.value = value;
    });

    editId.value = id;
    showFeedback(feedback, "Package record loaded for update.", "info");
    window.scrollTo({top:0,behavior:"smooth"});
  };

  const deletePackage = id => {
    if (!window.confirm("Are you sure you want to delete this record?")) return;

    records = records.filter(r => r.packageId !== id);
    saveRecords(STORAGE.packages, records);
    showFeedback(feedback, "Record deleted successfully.");
    render();
  };

  form.addEventListener("submit", event => {
    event.preventDefault();

    const data = Object.fromEntries(new FormData(form).entries());
    delete data.editId;

    if (!Object.values(data).every(required)) {
      showFeedback(feedback, "Please complete the required fields.", "error");
      return;
    }

    if (!positiveNumber(data.quantity)) {
      showFeedback(feedback, "Please enter a valid quantity.", "error");
      return;
    }

    const editing = editId.value;

    if (editing) {
      const index = records.findIndex(r => r.packageId === editing);

      if (index < 0) {
        showFeedback(feedback, "Record not found.", "error");
        return;
      }

      if (data.packageId !== editing &&
          records.some((r,i) => i !== index && r.packageId === data.packageId)) {
        showFeedback(feedback, "Package ID already exists.", "error");
        return;
      }

      records[index] = data;
      showFeedback(feedback, "Record updated successfully.");
    } else {
      if (records.some(r => r.packageId === data.packageId)) {
        showFeedback(feedback, "Package ID already exists.", "error");
        return;
      }

      records.push(data);
      showFeedback(feedback, "Package record saved successfully.");
    }

    saveRecords(STORAGE.packages, records);
    form.reset();
    editId.value = "";
    render();
  });

  $("#packageClear")?.addEventListener("click", () => {
    form.reset();
    editId.value = "";
    showFeedback(feedback, "Form cleared.", "info");
  });

  $("#packagePrint")?.addEventListener("click", () => window.print());
  $("#packageDownload")?.addEventListener("click", () =>
    downloadCSV(records, "package-records.csv")
  );

  render();
}

/* ---------- 9. Download displayed records ---------- */
function downloadCSV(records, filename) {
  if (!records.length) {
    window.alert("There are no displayed records to download.");
    return;
  }

  const headers = Object.keys(records[0]);

  const csv = [
    headers.join(","),
    ...records.map(row => headers.map(h =>
      `"${String(row[h] ?? "").replace(/"/g,'""')}"`
    ).join(","))
  ].join("\n");

  const blob = new Blob([csv], {type:"text/csv;charset=utf-8"});
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();

  URL.revokeObjectURL(url);
}

/* ---------- 10. Start all functionality ---------- */
document.addEventListener("DOMContentLoaded", () => {
  setupNavigation();
  setupDistribution();
  setupDonation();
  setupDeleteSearch();
  setupPackages();
});
