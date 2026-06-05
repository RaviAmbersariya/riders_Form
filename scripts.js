let ridersData = [];
let filteredRidersData = [];
let currentEditingId = null;
let currentDeleteId = null;

const API_URL = 'http://127.0.0.1:5000/api';

// DOM Elements
const registrationForm = document.getElementById('registrationForm');
const registrationModal = document.getElementById('registrationModal');
const addRiderBtn = document.getElementById('addRiderBtn');
const closeFormBtn = document.getElementById('closeFormBtn');
const cancelFormBtn = document.getElementById('cancelFormBtn');
const ridersContainer = document.getElementById('ridersContainer');
const successPopup = document.getElementById('successPopup');
const successBtn = document.getElementById('successBtn');
const themeToggle = document.getElementById('themeToggle');
const searchBtn = document.getElementById('searchBtn');
const resetSearchBtn = document.getElementById('resetSearchBtn');
const exportBtn = document.getElementById('exportBtn');
const deleteModal = document.getElementById('deleteModal');
const deleteConfirmBtn = document.getElementById('deleteConfirmBtn');
const deleteCancelBtn = document.getElementById('deleteCancelBtn');
const deleteCloseBtn = document.getElementById('deleteCloseBtn');

// Event Listeners
addRiderBtn.addEventListener('click', () => openRegistrationModal());
closeFormBtn.addEventListener('click', () => closeRegistrationModal());
cancelFormBtn.addEventListener('click', () => closeRegistrationModal());
registrationForm.addEventListener('submit', (e) => handleFormSubmit(e));
successBtn.addEventListener('click', () => closeSuccessPopup());
themeToggle.addEventListener('click', toggleTheme);
searchBtn.addEventListener('click', handleSearch);
resetSearchBtn.addEventListener('click', resetSearch);
exportBtn.addEventListener('click', exportData);
deleteConfirmBtn.addEventListener('click', confirmDelete);
deleteCancelBtn.addEventListener('click', closeDeleteModal);
deleteCloseBtn.addEventListener('click', closeDeleteModal);

window.addEventListener('click', (e) => {
  if (e.target === registrationModal) closeRegistrationModal();
  if (e.target === deleteModal) closeDeleteModal();
});

// Modal Functions
function openRegistrationModal(riderId = null) {
  currentEditingId = riderId;
  
  if (riderId) {
    const rider = ridersData.find(r => r.id === riderId);
    if (rider) {
      document.getElementById('formTitle').textContent = 'Edit Rider Information';
      populateFormWithData(rider);
    }
  } else {
    document.getElementById('formTitle').textContent = 'New Rider Registration';
    registrationForm.reset();
  }
  
  registrationModal.classList.add('active');
}

function closeRegistrationModal() {
  registrationModal.classList.remove('active');
  registrationForm.reset();
  currentEditingId = null;
  clearFormErrors();
}

function openDeleteModal(riderId) {
  currentDeleteId = riderId;
  deleteModal.classList.add('active');
}

function closeDeleteModal() {
  deleteModal.classList.remove('active');
  currentDeleteId = null;
}

// Form Submit
async function handleFormSubmit(e) {
  e.preventDefault();
  
  if (!validateForm()) {
    return;
  }

  const submitBtn = registrationForm.querySelector('.btn-submit');
  const btnText = submitBtn.querySelector('.btn-text');
  const spinner = submitBtn.querySelector('.loading-spinner');
  
  btnText.style.display = 'none';
  spinner.style.display = 'inline-block';
  submitBtn.disabled = true;

  const formData = new FormData(registrationForm);
  const riderData = Object.fromEntries(formData);
  
  try {
    const endpoint = currentEditingId 
      ? `${API_URL}/riders/${currentEditingId}` 
      : `${API_URL}/riders`;
    
    const method = currentEditingId ? 'PUT' : 'POST';
    
    const response = await fetch(endpoint, {
      method: method,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(riderData)
    });

    if (response.ok) {
      closeRegistrationModal();
      showSuccessPopup();
      await fetchRiders();
      await updateDashboardStats();
    } else {
      showNotification('Error saving rider data', 'error');
    }
  } catch (error) {
    console.error('Error:', error);
    showNotification('Cannot connect to server. Using local storage.', 'warning');
    // Fallback to local storage
    if (currentEditingId) {
      const index = ridersData.findIndex(r => r.id === currentEditingId);
      if (index !== -1) {
        ridersData[index] = { ...ridersData[index], ...riderData };
      }
    } else {
      riderData.id = Date.now();
      riderData.created_at = new Date().toISOString();
      ridersData.push(riderData);
    }
    saveToLocalStorage();
    closeRegistrationModal();
    showSuccessPopup();
    renderRiders();
    updateDashboardStats();
  } finally {
    btnText.style.display = 'inline';
    spinner.style.display = 'none';
    submitBtn.disabled = false;
  }
}

// Form Validation
function validateForm() {
  clearFormErrors();
  let isValid = true;

  const requiredFields = registrationForm.querySelectorAll('[required]');
  requiredFields.forEach(field => {
    if (!field.value.trim()) {
      showFieldError(field.name, 'This field is required');
      isValid = false;
    }
  });

  const email = document.getElementById('employeeEmail');
  if (email.value && !isValidEmail(email.value)) {
    showFieldError('employeeEmail', 'Please enter a valid email');
    isValid = false;
  }

  const phone = document.getElementById('employeePhone');
  if (phone.value && phone.value.length !== 10) {
    showFieldError('employeePhone', 'Mobile number must be 10 digits');
    isValid = false;
  }

  const pan = document.getElementById('panNumber');
  if (pan.value && !isValidPAN(pan.value)) {
    showFieldError('panNumber', 'Invalid PAN format (e.g., ABCDE1234F)');
    isValid = false;
  }

  const pinCode = document.getElementById('employeePinCode');
  if (pinCode.value && pinCode.value.length !== 6) {
    showFieldError('employeePinCode', 'Pin code must be 6 digits');
    isValid = false;
  }

  const dob = document.getElementById('employeeDOB');
  if (dob.value && !isValidAge(dob.value)) {
    showFieldError('employeeDOB', 'Employee must be at least 18 years old');
    isValid = false;
  }

  return isValid;
}

function showFieldError(fieldName, message) {
  const errorElement = document.getElementById(`${fieldName}Error`);
  if (errorElement) {
    errorElement.textContent = message;
    const field = document.querySelector(`[name="${fieldName}"]`);
    if (field && field.parentElement) {
      field.parentElement.classList.add('error');
    }
  }
}

function clearFormErrors() {
  document.querySelectorAll('.error-message').forEach(el => {
    el.textContent = '';
  });
  document.querySelectorAll('.form-group').forEach(el => {
    el.classList.remove('error');
  });
}

function populateFormWithData(rider) {
  Object.keys(rider).forEach(key => {
    const field = document.querySelector(`[name="${key}"]`);
    if (field) {
      field.value = rider[key] || '';
    }
  });
}

// Fetch Riders
async function fetchRiders() {
  try {
    const response = await fetch(`${API_URL}/riders`);
    if (response.ok) {
      const data = await response.json();
      ridersData = Array.isArray(data) ? data : [];
      renderRiders();
    } else {
      throw new Error('Failed to fetch riders');
    }
  } catch (error) {
    console.warn('API Error: Using local storage');
    loadFromLocalStorage();
    renderRiders();
  }
}

// Render Riders
function renderRiders() {
  const dataToRender = filteredRidersData.length > 0 ? filteredRidersData : ridersData;
  
  if (!Array.isArray(dataToRender) || dataToRender.length === 0) {
    ridersContainer.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">📋</div>
        <p>No riders found. Add your first rider to get started!</p>
      </div>
    `;
    return;
  }

  ridersContainer.innerHTML = dataToRender.map(rider => createRiderCard(rider)).join('');

  document.querySelectorAll('.edit-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const riderId = parseInt(btn.dataset.id);
      openRegistrationModal(riderId);
    });
  });

  document.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const riderId = parseInt(btn.dataset.id);
      openDeleteModal(riderId);
    });
  });
}

function createRiderCard(rider) {
  const statusClass = rider.insurance_status || rider.insuranceStatus || 'inactive';
  const employeeName = rider.employee_name || rider.employeeName || 'N/A';
  const employeeNo = rider.employee_no || rider.employeeNo || 'N/A';
  const employeeEmail = rider.employee_email || rider.employeeEmail || 'N/A';
  const employeePhone = rider.employee_phone || rider.employeePhone || 'N/A';
  const employeeCity = rider.employee_city || rider.employeeCity || 'N/A';
  const employeeState = rider.employee_state || rider.employeeState || 'N/A';

  return `
    <div class="rider-card">
      <div class="rider-photo">
        <span>${employeeName.charAt(0).toUpperCase() || '👤'}</span>
      </div>
      <div class="rider-info">
        <div class="rider-header">
          <div>
            <div class="rider-name">${employeeName}</div>
            <span class="status-badge ${statusClass}">${statusClass}</span>
          </div>
        </div>
        <div class="rider-details">
          <div class="detail-item">
            <span class="detail-label">Employee No:</span>
            <span class="detail-value">${employeeNo}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Email:</span>
            <span class="detail-value">${employeeEmail}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Phone:</span>
            <span class="detail-value">${employeePhone}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">City:</span>
            <span class="detail-value">${employeeCity}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">State:</span>
            <span class="detail-value">${employeeState}</span>
          </div>
        </div>
        <div class="rider-actions">
          <button class="edit-btn" data-id="${rider.id}">✏️ Edit</button>
          <button class="delete-btn" data-id="${rider.id}">🗑️ Delete</button>
        </div>
      </div>
    </div>
  `;
}

// Update Dashboard Stats
async function updateDashboardStats() {
  try {
    const response = await fetch(`${API_URL}/stats`);
    if (response.ok) {
      const stats = await response.json();
      document.getElementById('totalRiders').textContent = stats.total_riders || 0;
      document.getElementById('activeRiders').textContent = stats.active_riders || 0;
      document.getElementById('pendingInsurance').textContent = stats.pending_riders || 0;
      document.getElementById('completedInsurance').textContent = stats.completed_riders || 0;
      document.getElementById('expiringPolicies').textContent = stats.expiring_policies || 0;
      document.getElementById('recentlyActivated').textContent = stats.recently_activated || 0;
    } else {
      throw new Error('Failed to fetch stats');
    }
  } catch (error) {
    console.warn('Stats API Error: Computing locally');
    computeLocalStats();
  }
}

function computeLocalStats() {
  const total = ridersData.length;
  const active = ridersData.filter(r => (r.insurance_status || r.insuranceStatus) === 'active').length;
  const pending = ridersData.filter(r => (r.insurance_status || r.insuranceStatus) === 'pending').length;
  const inactive = ridersData.filter(r => (r.insurance_status || r.insuranceStatus) === 'inactive').length;
  
  document.getElementById('totalRiders').textContent = total;
  document.getElementById('activeRiders').textContent = active;
  document.getElementById('pendingInsurance').textContent = pending;
  document.getElementById('completedInsurance').textContent = active;
  document.getElementById('expiringPolicies').textContent = Math.max(0, inactive);
  document.getElementById('recentlyActivated').textContent = Math.max(0, Math.floor(total * 0.2));
}

// Search & Filter
function handleSearch() {
  const searchTerm = document.getElementById('searchInput').value.toLowerCase();
  const statusFilter = document.getElementById('statusFilter').value;

  filteredRidersData = ridersData.filter(rider => {
    const empName = rider.employee_name || rider.employeeName || '';
    const empEmail = rider.employee_email || rider.employeeEmail || '';
    const empNo = rider.employee_no || rider.employeeNo || '';
    
    const matchesSearch = 
      empName.toLowerCase().includes(searchTerm) ||
      empEmail.toLowerCase().includes(searchTerm) ||
      empNo.toLowerCase().includes(searchTerm);

    const status = rider.insurance_status || rider.insuranceStatus;
    const matchesStatus = statusFilter === 'all' || status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  renderRiders();
}

function resetSearch() {
  document.getElementById('searchInput').value = '';
  document.getElementById('statusFilter').value = 'all';
  filteredRidersData = [];
  renderRiders();
}

// Delete Rider
async function confirmDelete() {
  if (currentDeleteId) {
    try {
      const response = await fetch(`${API_URL}/riders/${currentDeleteId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        closeDeleteModal();
        await fetchRiders();
        await updateDashboardStats();
        showNotification('Rider deleted successfully', 'success');
      } else {
        throw new Error('Failed to delete rider');
      }
    } catch (error) {
      console.warn('Delete API Error: Using local storage');
      ridersData = ridersData.filter(r => r.id !== currentDeleteId);
      saveToLocalStorage();
      closeDeleteModal();
      renderRiders();
      updateDashboardStats();
      showNotification('Rider deleted successfully', 'success');
    }
  }
}

// Export Data
function exportData() {
  if (!Array.isArray(ridersData) || ridersData.length === 0) {
    showNotification('No data to export', 'warning');
    return;
  }

  const csv = convertToCSV(ridersData);
  downloadCSV(csv, 'riders_data.csv');
}

function convertToCSV(data) {
  if (!data || !Array.isArray(data) || data.length === 0) return '';
  
  const headers = Object.keys(data[0]);
  const rows = data.map(row => 
    headers.map(header => {
      const value = row[header] || '';
      return typeof value === 'string' && value.includes(',') 
        ? `"${value.replace(/"/g, '""')}"` 
        : value;
    }).join(',')
  );

  return [headers.join(','), ...rows].join('\n');
}

function downloadCSV(csv, filename) {
  const link = document.createElement('a');
  const blob = new Blob([csv], { type: 'text/csv' });
  link.href = window.URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  window.URL.revokeObjectURL(link.href);
}

// Theme Toggle
function toggleTheme() {
  document.body.classList.toggle('dark-mode');
  const icon = document.querySelector('.theme-icon');
  
  if (document.body.classList.contains('dark-mode')) {
    icon.textContent = '☀️';
    localStorage.setItem('theme', 'dark');
  } else {
    icon.textContent = '🌙';
    localStorage.setItem('theme', 'light');
  }
}

// Success Popup
function showSuccessPopup() {
  const title = currentEditingId ? 'Rider Updated!' : 'Rider Added!';
  const message = currentEditingId 
    ? 'Rider information has been updated successfully.' 
    : 'New rider has been registered successfully.';
  
  document.getElementById('successTitle').textContent = title;
  document.getElementById('successMessage').textContent = message;
  successPopup.classList.add('active');
}

function closeSuccessPopup() {
  successPopup.classList.remove('active');
}

// Utility Functions
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidPAN(pan) {
  return /^[A-Z]{5}[0-9]{4}[A-Z]$/.test(pan);
}

function isValidAge(dateString) {
  const birthDate = new Date(dateString);
  const age = new Date().getFullYear() - birthDate.getFullYear();
  return age >= 18;
}

function showNotification(message, type = 'info') {
  console.log(`[${type.toUpperCase()}] ${message}`);
  alert(message);
}

// LocalStorage Functions
function saveToLocalStorage() {
  localStorage.setItem('ridersData', JSON.stringify(ridersData));
}

function loadFromLocalStorage() {
  const data = localStorage.getItem('ridersData');
  ridersData = data ? JSON.parse(data) : [];
  if (!Array.isArray(ridersData)) {
    ridersData = [];
  }
}

// Initialize App
async function initializeApp() {
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme === 'dark') {
    document.body.classList.add('dark-mode');
    document.querySelector('.theme-icon').textContent = '☀️';
  }

  // Load from local storage first
  loadFromLocalStorage();
  
  // Try to fetch from API
  await fetchRiders();
  await updateDashboardStats();
  
  console.log('✅ Onsurity Rider Insurance Dashboard Initialized Successfully');
}

// Start when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApp);
} else {
  initializeApp();
}
