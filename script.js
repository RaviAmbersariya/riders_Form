/**
 * ========================================
 * RIDER INSURANCE REGISTRATION APP
 * Frontend connected to Flask Python API
 * ========================================
 */

// API Configuration
const API_BASE_URL = 'http://localhost:5000/api';

// ========================================
// STATE MANAGEMENT
// ========================================

let appState = {
    riders: [],
    filteredRiders: [],
    editingRiderId: null,
    deleteRiderId: null,
    isDarkMode: localStorage.getItem('darkMode') === 'true',
    statusFilter: 'all',
    searchTerm: '',
    selectedProfilePhoto: null,
    sortBy: 'name'
};

// ========================================
// DOM ELEMENTS
// ========================================

const registrationModal = document.getElementById('registrationModal');
const registrationForm = document.getElementById('registrationForm');
const formTitle = document.getElementById('formTitle');
const successPopup = document.getElementById('successPopup');
const deleteModal = document.getElementById('deleteModal');
const successBtn = document.getElementById('successBtn');
const deleteConfirmBtn = document.getElementById('deleteConfirmBtn');
const deleteCancelBtn = document.getElementById('deleteCancelBtn');
const addRiderBtn = document.getElementById('addRiderBtn');
const exportBtn = document.getElementById('exportBtn');
const searchBtn = document.getElementById('searchBtn');
const resetSearchBtn = document.getElementById('resetSearchBtn');
const searchInput = document.getElementById('searchInput');
const statusFilterSelect = document.getElementById('statusFilter');
const themeToggle = document.getElementById('themeToggle');
const ridersContainer = document.getElementById('ridersContainer');
const emptyState = document.getElementById('emptyState');
const closeFormBtn = document.getElementById('closeFormBtn');
const cancelFormBtn = document.getElementById('cancelFormBtn');
const totalRidersEl = document.getElementById('totalRiders');
const activeRidersEl = document.getElementById('activeRiders');
const pendingInsuranceEl = document.getElementById('pendingInsurance');
const completedInsuranceEl = document.getElementById('completedInsurance');
const expiringPoliciesEl = document.getElementById('expiringPolicies');
const recentlyActivatedEl = document.getElementById('recentlyActivated');
const profilePhotoInput = document.getElementById('profilePhoto');
const photoPreview = document.getElementById('photoPreview');

// ========================================
// INITIALIZATION
// ========================================

document.addEventListener('DOMContentLoaded', function() {
    console.log('Application initialized');
    
    // Apply saved theme
    if (appState.isDarkMode) {
        document.body.classList.add('dark-mode');
        updateThemeIcon();
    }

    // Set up event listeners
    setupEventListeners();

    // Load data from API
    loadDashboardData();
});

// ========================================
// EVENT LISTENERS
// ========================================

function setupEventListeners() {
    // Form buttons
    addRiderBtn.addEventListener('click', openNewRegistrationForm);
    closeFormBtn.addEventListener('click', closeRegistrationForm);
    cancelFormBtn.addEventListener('click', closeRegistrationForm);
    registrationForm.addEventListener('submit', handleFormSubmit);

    // Search functionality
    searchBtn.addEventListener('click', handleSearch);
    resetSearchBtn.addEventListener('click', handleResetSearch);
    statusFilterSelect.addEventListener('change', handleFilterChange);
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleSearch();
    });

    // Profile photo preview
    if (profilePhotoInput) {
        profilePhotoInput.addEventListener('change', handleProfilePhotoChange);
    }

    // Export functionality
    exportBtn.addEventListener('click', handleExport);

    // Theme toggle
    themeToggle.addEventListener('click', toggleTheme);

    // Success popup
    successBtn.addEventListener('click', closeSuccessPopup);

    // Delete confirmation
    deleteConfirmBtn.addEventListener('click', confirmDelete);
    deleteCancelBtn.addEventListener('click', closeDeleteModal);
    document.getElementById('deleteCloseBtn').addEventListener('click', closeDeleteModal);

    // Close modals on outside click
    window.addEventListener('click', (e) => {
        if (e.target === registrationModal) closeRegistrationForm();
        if (e.target === deleteModal) closeDeleteModal();
    });
}

// ========================================
// FORM MANAGEMENT
// ========================================

/**
 * Opens the registration form for adding a new rider
 */
function openNewRegistrationForm() {
    appState.editingRiderId = null;
    appState.selectedProfilePhoto = null;
    formTitle.textContent = 'New Rider Registration';
    registrationForm.reset();
    clearAllErrors();
    updatePhotoPreview();
    registrationModal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

/**
 * Closes the registration form modal
 */
function closeRegistrationForm() {
    registrationModal.classList.remove('active');
    document.body.style.overflow = 'auto';
    registrationForm.reset();
    clearAllErrors();
    appState.selectedProfilePhoto = null;
    updatePhotoPreview();
}

/**
 * Clears all error messages from the form
 */
function clearAllErrors() {
    const errorMessages = document.querySelectorAll('.error-message');
    errorMessages.forEach(error => {
        error.classList.remove('show');
        error.textContent = '';
    });

    const errorInputs = document.querySelectorAll('.error');
    errorInputs.forEach(input => {
        input.classList.remove('error');
    });
}

/**
 * Handles form submission
 */
function handleFormSubmit(e) {
    e.preventDefault();
    clearAllErrors();

    // Collect form data
    const formData = {
        brandName: document.getElementById('brandName').value.trim(),
        storeName: document.getElementById('storeName').value.trim(),
        employeeNo: document.getElementById('employeeNo').value.trim(),
        employeeName: document.getElementById('employeeName').value.trim(),
        employeeEmail: document.getElementById('employeeEmail').value.trim(),
        employeePhone: document.getElementById('employeePhone').value.trim(),
        employeeGender: document.getElementById('employeeGender').value,
        employeeDOB: document.getElementById('employeeDOB').value,
        panNumber: document.getElementById('panNumber').value.trim().toUpperCase(),
        employeeAddress: document.getElementById('employeeAddress').value.trim(),
        employeeCity: document.getElementById('employeeCity').value.trim(),
        employeeState: document.getElementById('employeeState').value,
        employeePinCode: document.getElementById('employeePinCode').value.trim(),
        nomineeName: document.getElementById('nomineeName').value.trim(),
        nomineeGender: document.getElementById('nomineeGender').value,
        nomineeDOB: document.getElementById('nomineeDOB').value,
        nomineeRelationship: document.getElementById('nomineeRelationship').value,
        profilePhoto: appState.selectedProfilePhoto || '',
        insuranceStatus: document.getElementById('insuranceStatus').value,
        insurancePolicyNumber: document.getElementById('insurancePolicyNumber').value.trim(),
        insuranceProvider: document.getElementById('insuranceProvider').value.trim(),
        insuranceStartDate: document.getElementById('insuranceStartDate').value,
        insuranceEndDate: document.getElementById('insuranceEndDate').value,
        coverageAmount: document.getElementById('coverageAmount').value.trim(),
        insuranceEligibilityStatus: document.getElementById('insuranceEligibilityStatus').value
    };

    // Validate form data
    if (!validateForm(formData)) {
        console.log('Form validation failed');
        return;
    }

    // Show loading spinner
    showLoadingSpinner();

    // Simulate API call with timeout
    setTimeout(() => {
        if (appState.editingRiderId) {
            // Update existing rider
            updateRider(appState.editingRiderId, formData);
        } else {
            // Add new rider
            addNewRider(formData);
        }

        // Hide loading spinner
        hideLoadingSpinner();

        // Close form and show success
        closeRegistrationForm();
        showSuccessPopup(
            appState.editingRiderId ? 'Rider Updated Successfully!' : 'Registration Successful!',
            appState.editingRiderId ? 'Rider information has been updated.' : 'Rider has been registered successfully.'
        );

        // Refresh UI
        renderRiders(appState.riders);
        updateStatistics();
    }, 1500);
}

/**
 * Shows loading spinner
 */
function showLoadingSpinner() {
    const submitBtn = registrationForm.querySelector('.btn-submit');
    const spinner = submitBtn.querySelector('.loading-spinner');
    const btnText = submitBtn.querySelector('.btn-text');
    
    spinner.style.display = 'inline-block';
    btnText.style.display = 'none';
    submitBtn.disabled = true;
}

/**
 * Hides loading spinner
 */
function hideLoadingSpinner() {
    const submitBtn = registrationForm.querySelector('.btn-submit');
    const spinner = submitBtn.querySelector('.loading-spinner');
    const btnText = submitBtn.querySelector('.btn-text');
    
    spinner.style.display = 'none';
    btnText.style.display = 'inline';
    submitBtn.disabled = false;
}

// ========================================
// FORM VALIDATION
// ========================================

/**
 * Validates the entire form
 */
function validateForm(data) {
    let isValid = true;

    // Brand Name validation
    if (!validateRequired(data.brandName, 'brandName', 'Brand name is required')) isValid = false;
    if (data.brandName && data.brandName.length < 3) {
        showError('brandName', 'Brand name must be at least 3 characters');
        isValid = false;
    }

    // Store Name validation
    if (!validateRequired(data.storeName, 'storeName', 'Store name is required')) isValid = false;
    if (data.storeName && data.storeName.length < 3) {
        showError('storeName', 'Store name must be at least 3 characters');
        isValid = false;
    }

    // Employee No validation
    if (!validateRequired(data.employeeNo, 'employeeNo', 'Employee number is required')) isValid = false;

    // Employee Name validation
    if (!validateRequired(data.employeeName, 'employeeName', 'Employee name is required')) isValid = false;
    if (data.employeeName && data.employeeName.length < 3) {
        showError('employeeName', 'Employee name must be at least 3 characters');
        isValid = false;
    }

    // Email validation
    if (!validateRequired(data.employeeEmail, 'employeeEmail', 'Email is required')) isValid = false;
    if (data.employeeEmail && !validateEmail(data.employeeEmail)) {
        showError('employeeEmail', 'Please enter a valid email address');
        isValid = false;
    }

    // Phone validation
    if (!validateRequired(data.employeePhone, 'employeePhone', 'Mobile number is required')) isValid = false;
    if (data.employeePhone && !validatePhone(data.employeePhone)) {
        showError('employeePhone', 'Mobile number must be exactly 10 digits');
        isValid = false;
    }

    // Gender validation
    if (!validateRequired(data.employeeGender, 'employeeGender', 'Please select gender')) isValid = false;

    // DOB validation
    if (!validateRequired(data.employeeDOB, 'employeeDOB', 'Date of birth is required')) isValid = false;
    if (data.employeeDOB && !validateDOB(data.employeeDOB, 18)) {
        showError('employeeDOB', 'Employee must be at least 18 years old');
        isValid = false;
    }

    // PAN validation
    if (!validateRequired(data.panNumber, 'panNumber', 'PAN number is required')) isValid = false;
    if (data.panNumber && !validatePAN(data.panNumber)) {
        showError('panNumber', 'Invalid PAN format (AAAAA0000A)');
        isValid = false;
    }

    // Address validation
    if (!validateRequired(data.employeeAddress, 'employeeAddress', 'Address is required')) isValid = false;
    if (data.employeeAddress && data.employeeAddress.length < 5) {
        showError('employeeAddress', 'Address must be at least 5 characters');
        isValid = false;
    }

    // City validation
    if (!validateRequired(data.employeeCity, 'employeeCity', 'City is required')) isValid = false;

    // State validation
    if (!validateRequired(data.employeeState, 'employeeState', 'Please select state')) isValid = false;

    // Pin Code validation
    if (!validateRequired(data.employeePinCode, 'employeePinCode', 'Pin code is required')) isValid = false;
    if (data.employeePinCode && !validatePinCode(data.employeePinCode)) {
        showError('employeePinCode', 'Pin code must be exactly 6 digits');
        isValid = false;
    }

    // Nominee Name validation
    if (!validateRequired(data.nomineeName, 'nomineeName', 'Nominee name is required')) isValid = false;
    if (data.nomineeName && data.nomineeName.length < 3) {
        showError('nomineeName', 'Nominee name must be at least 3 characters');
        isValid = false;
    }

    // Nominee Gender validation
    if (!validateRequired(data.nomineeGender, 'nomineeGender', 'Please select nominee gender')) isValid = false;

    // Nominee DOB validation
    if (!validateRequired(data.nomineeDOB, 'nomineeDOB', 'Nominee date of birth is required')) isValid = false;

    // Nominee Relationship validation
    if (!validateRequired(data.nomineeRelationship, 'nomineeRelationship', 'Please select nominee relationship')) isValid = false;

    // Insurance validation
    if (!validateRequired(data.insuranceStatus, 'insuranceStatus', 'Insurance status is required')) isValid = false;
    if (!validateRequired(data.insurancePolicyNumber, 'insurancePolicyNumber', 'Policy number is required')) isValid = false;
    if (!validateRequired(data.insuranceProvider, 'insuranceProvider', 'Insurance provider is required')) isValid = false;
    if (!validateRequired(data.insuranceStartDate, 'insuranceStartDate', 'Policy start date is required')) isValid = false;
    if (!validateRequired(data.insuranceEndDate, 'insuranceEndDate', 'Policy end date is required')) isValid = false;
    if (!validateRequired(data.coverageAmount, 'coverageAmount', 'Coverage amount is required')) isValid = false;
    if (data.coverageAmount && !validatePositiveNumber(data.coverageAmount)) {
        showError('coverageAmount', 'Coverage amount must be a positive number');
        isValid = false;
    }
    if (!validateRequired(data.insuranceEligibilityStatus, 'insuranceEligibilityStatus', 'Eligibility status is required')) isValid = false;

    return isValid;
}

/**
 * Validates a positive numeric field
 */
function validatePositiveNumber(value) {
    return !isNaN(value) && Number(value) >= 0;
}

/**
 * Handles profile photo selection and preview
 */
function handleProfilePhotoChange(event) {
    const file = event.target.files[0];
    if (!file) {
        appState.selectedProfilePhoto = null;
        updatePhotoPreview();
        return;
    }

    const reader = new FileReader();
    reader.onload = function(e) {
        appState.selectedProfilePhoto = e.target.result;
        updatePhotoPreview();
    };
    reader.readAsDataURL(file);
}

/**
 * Updates the profile photo preview element
 */
function updatePhotoPreview() {
    if (!photoPreview) return;

    photoPreview.innerHTML = '';
    if (appState.selectedProfilePhoto) {
        const img = document.createElement('img');
        img.src = appState.selectedProfilePhoto;
        img.alt = 'Profile Photo Preview';
        photoPreview.appendChild(img);
        return;
    }

    const placeholder = document.createElement('span');
    placeholder.textContent = 'No photo selected';
    photoPreview.appendChild(placeholder);
}

/**
 * Validates required fields
 */
function validateRequired(value, fieldId, message) {
    if (!value) {
        showError(fieldId, message);
        return false;
    }
    return true;
}

/**
 * Validates email format
 */
function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * Validates phone number (10 digits)
 */
function validatePhone(phone) {
    const phoneRegex = /^\d{10}$/;
    return phoneRegex.test(phone);
}

/**
 * Validates PAN number format (AAAAA0000A)
 */
function validatePAN(pan) {
    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
    return panRegex.test(pan);
}

/**
 * Validates pin code (6 digits)
 */
function validatePinCode(pinCode) {
    const pinRegex = /^\d{6}$/;
    return pinRegex.test(pinCode);
}

/**
 * Validates date of birth (must be at least minAge years old)
 */
function validateDOB(dob, minAge = 0) {
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }

    return age >= minAge && birthDate < today;
}

/**
 * Shows error message for a field
 */
function showError(fieldId, message) {
    const field = document.getElementById(fieldId);
    const errorEl = document.getElementById(fieldId + 'Error');

    if (field) {
        field.classList.add('error');
    }

    if (errorEl) {
        errorEl.textContent = message;
        errorEl.classList.add('show');
    }
}

// ========================================
// CRUD OPERATIONS
// ========================================

/**
 * Adds a new rider via API
 */
async function addNewRider(formData) {
    try {
        const response = await fetch(`${API_BASE_URL}/riders`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });

        const result = await response.json();
        if (response.ok && result.success) {
            console.log('Rider added:', result);
            loadRidersFromAPI();
        } else {
            throw new Error(result.error || 'Failed to add rider');
        }
    } catch (error) {
        console.error('Error adding rider:', error);
        throw error;
    }
}

/**
 * Updates an existing rider via API
 */
async function updateRider(riderId, formData) {
    try {
        const response = await fetch(`${API_BASE_URL}/riders/${riderId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });

        const result = await response.json();
        if (response.ok && result.success) {
            console.log('Rider updated:', result);
            loadRidersFromAPI();
        } else {
            throw new Error(result.error || 'Failed to update rider');
        }
    } catch (error) {
        console.error('Error updating rider:', error);
        throw error;
    }
}

/**
 * Deletes a rider via API
 */
async function deleteRider(riderId) {
    try {
        const response = await fetch(`${API_BASE_URL}/riders/${riderId}`, {
            method: 'DELETE'
        });

        const result = await response.json();
        if (response.ok && result.success) {
            console.log('Rider deleted:', result);
            loadRidersFromAPI();
        } else {
            throw new Error(result.error || 'Failed to delete rider');
        }
    } catch (error) {
        console.error('Error deleting rider:', error);
        throw error;
    }
}

/**
 * Gets a rider by ID via API
 */
async function getRiderById(riderId) {
    try {
        const response = await fetch(`${API_BASE_URL}/riders/${riderId}`);
        const result = await response.json();
        if (result.success) {
            return result.data;
        }
        return null;
    } catch (error) {
        console.error('Error fetching rider:', error);
        return null;
    }
}

/**
 * Loads all riders from API
 */
async function loadRidersFromAPI() {
    try {
        const response = await fetch(`${API_BASE_URL}/riders`);
        const result = await response.json();
        if (result.success) {
            appState.riders = result.data || [];
            renderRiders(appState.riders);
            updateStatistics();
            return appState.riders;
        }
    } catch (error) {
        console.error('Error loading riders:', error);
    }
    return [];
}

// ========================================
// EDIT FUNCTIONALITY
// ========================================

/**
 * Opens edit form for a rider - loads from API
 */
async function editRider(riderId) {
    const rider = await getRiderById(riderId);
    if (!rider) {
        console.error('Rider not found');
        return;
    }

    appState.editingRiderId = riderId;
    formTitle.textContent = 'Edit Rider Information';

    // Populate form fields from API data
    document.getElementById('brandName').value = rider.brand_name || '';
    document.getElementById('storeName').value = rider.store_name || '';
    document.getElementById('employeeNo').value = rider.employee_no || '';
    document.getElementById('employeeName').value = rider.employee_name || '';
    document.getElementById('employeeEmail').value = rider.employee_email || '';
    document.getElementById('employeePhone').value = rider.employee_phone || '';
    document.getElementById('employeeGender').value = rider.employee_gender || '';
    document.getElementById('employeeDOB').value = rider.employee_dob || '';
    document.getElementById('panNumber').value = rider.pan_number || '';
    document.getElementById('employeeAddress').value = rider.employee_address || '';
    document.getElementById('employeeCity').value = rider.employee_city || '';
    document.getElementById('employeeState').value = rider.employee_state || '';
    document.getElementById('employeePinCode').value = rider.employee_pincode || '';
    document.getElementById('nomineeName').value = rider.nominee_name || '';
    document.getElementById('nomineeGender').value = rider.nomineeGender;
    document.getElementById('nomineeDOB').value = rider.nomineeDOB;
    document.getElementById('nomineeRelationship').value = rider.nomineeRelationship;
    document.getElementById('insuranceStatus').value = rider.insuranceStatus || '';
    document.getElementById('insurancePolicyNumber').value = rider.insurancePolicyNumber || '';
    document.getElementById('insuranceProvider').value = rider.insuranceProvider || '';
    document.getElementById('insuranceStartDate').value = rider.insuranceStartDate || '';
    document.getElementById('insuranceEndDate').value = rider.insuranceEndDate || '';
    document.getElementById('coverageAmount').value = rider.coverageAmount || '';
    document.getElementById('insuranceEligibilityStatus').value = rider.insuranceEligibilityStatus || '';
    appState.selectedProfilePhoto = rider.profilePhoto || null;
    updatePhotoPreview();

    // Open modal
    registrationModal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

// ========================================
// DELETE FUNCTIONALITY
// ========================================

/**
 * Opens delete confirmation modal
 */
function openDeleteConfirmation(riderId) {
    appState.deleteRiderId = riderId;
    deleteModal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

/**
 * Closes delete confirmation modal
 */
function closeDeleteModal() {
    deleteModal.classList.remove('active');
    document.body.style.overflow = 'auto';
    appState.deleteRiderId = null;
}

/**
 * Confirms and executes deletion
 */
function confirmDelete() {
    if (appState.deleteRiderId) {
        deleteRider(appState.deleteRiderId);
        closeDeleteModal();
        renderRiders(appState.riders);
        updateStatistics();
        showSuccessPopup(
            'Rider Deleted',
            'Rider record has been successfully deleted.'
        );
    }
}

// ========================================
// SEARCH AND FILTER
// ========================================

/**
 * Handles search functionality
 */
function handleSearch() {
    appState.searchTerm = searchInput.value.trim().toLowerCase();
    filterRiders();
}

function handleFilterChange() {
    appState.statusFilter = statusFilterSelect.value;
    filterRiders();
}

function filterRiders() {
    const searchTerm = appState.searchTerm;
    const statusFilter = appState.statusFilter;

    appState.filteredRiders = appState.riders.filter(rider => {
        const matchesSearch = !searchTerm || [
            rider.employeeName,
            rider.employeeEmail,
            rider.employeeNo,
            rider.employeePhone,
            rider.brandName,
            rider.storeName
        ].some(value => value && value.toLowerCase().includes(searchTerm));

        const matchesStatus = statusFilter === 'all' || rider.insuranceStatus === statusFilter;

        return matchesSearch && matchesStatus;
    });

    renderRiders(appState.filteredRiders);
    console.log(`Filtered ${appState.filteredRiders.length} riders by status=${statusFilter} search="${searchTerm}"`);
}

/**
 * Resets search and shows all riders
 */
function handleResetSearch() {
    searchInput.value = '';
    statusFilterSelect.value = 'all';
    appState.searchTerm = '';
    appState.statusFilter = 'all';
    appState.filteredRiders = [...appState.riders];
    renderRiders(appState.riders);
}

// ========================================
// RENDERING FUNCTIONS
// ========================================

/**
 * Renders the dashboard section
 */
function renderDashboard() {
    // Dashboard is already in HTML, this function can be used for dynamic updates
    updateStatistics();
}

/**
 * Updates dashboard statistics
 */
function updateStatistics() {
    // Animate counter updates
    animateCounter(totalRidersEl, appState.riders.length);
    animateCounter(activeRidersEl, appState.riders.filter(r => r.status === 'active').length);
    animateCounter(pendingInsuranceEl, appState.riders.filter(r => r.insuranceStatus === 'pending').length);
    animateCounter(completedInsuranceEl, appState.riders.filter(r => r.insuranceStatus === 'completed').length);
    animateCounter(expiringPoliciesEl, calculateExpiringPolicies());
    animateCounter(recentlyActivatedEl, calculateRecentlyActivatedPolicies());
}

function calculateExpiringPolicies() {
    const now = new Date();
    return appState.riders.filter(rider => {
        if (!rider.insuranceEndDate || !rider.insuranceStatus) return false;
        const endDate = new Date(rider.insuranceEndDate);
        const daysRemaining = Math.ceil((endDate - now) / (1000 * 60 * 60 * 24));
        return rider.insuranceStatus === 'active' && daysRemaining >= 0 && daysRemaining <= 30;
    }).length;
}

function calculateRecentlyActivatedPolicies() {
    const now = new Date();
    return appState.riders.filter(rider => {
        if (!rider.updatedAt || rider.insuranceStatus !== 'active') return false;
        const updatedAt = new Date(rider.updatedAt);
        const diffDays = Math.ceil((now - updatedAt) / (1000 * 60 * 60 * 24));
        return diffDays <= 30;
    }).length;
}

/**
 * Animates counter values
 */
function animateCounter(element, targetValue) {
    const currentValue = parseInt(element.textContent) || 0;
    const increment = Math.ceil((targetValue - currentValue) / 10);
    let count = currentValue;

    const interval = setInterval(() => {
        count += increment;
        if ((increment > 0 && count >= targetValue) || (increment < 0 && count <= targetValue)) {
            count = targetValue;
            clearInterval(interval);
        }
        element.textContent = count;
    }, 30);
}

/**
 * Renders riders in the container
 */
function renderRiders(riders) {
    ridersContainer.innerHTML = '';

    if (riders.length === 0) {
        emptyState.style.display = 'block';
        return;
    }

    emptyState.style.display = 'none';

    riders.forEach((rider, index) => {
        const riderCard = createRiderCard(rider);
        riderCard.setAttribute('data-aos', 'fade-up');
        riderCard.setAttribute('data-aos-delay', (index * 50) % 300);
        ridersContainer.appendChild(riderCard);
    });

    // Re-initialize AOS for new elements
    AOS.refresh();
}

/**
 * Creates a rider card element
 */
function createRiderCard(rider) {
    const card = document.createElement('div');
    card.className = 'rider-card';

    // Format dates
    const dob = new Date(rider.employeeDOB).toLocaleDateString('en-IN');
    const age = calculateAge(rider.employeeDOB);

    card.innerHTML = `
        <div class="rider-header">
            <div>
                <h3 class="rider-name">
                  <a href="rider-profile.html?id=${encodeURIComponent(rider.id)}" class="rider-name-link">${escapeHtml(rider.employeeName)}</a>
                </h3>
                <p class="rider-meta">${escapeHtml(rider.brandName)} • ${escapeHtml(rider.storeName)}</p>
                <p style="color: var(--text-secondary); font-size: 0.9rem;">ID: ${escapeHtml(rider.employeeNo)}</p>
            </div>
            <span class="rider-status ${rider.insuranceStatus}">
                ${rider.insuranceStatus === 'completed' ? '✓' : rider.insuranceStatus === 'active' ? '✔️' : '⏳'} 
                ${capitalize(rider.insuranceStatus)}
            </span>
        </div>

        <div class="rider-info">
            <div class="rider-info-item">
                <span class="rider-info-label">📧 Email:</span>
                <span class="rider-info-value">${escapeHtml(rider.employeeEmail)}</span>
            </div>
            <div class="rider-info-item">
                <span class="rider-info-label">📱 Phone:</span>
                <span class="rider-info-value">${escapeHtml(rider.employeePhone)}</span>
            </div>
            <div class="rider-info-item">
                <span class="rider-info-label">📍 Location:</span>
                <span class="rider-info-value">${escapeHtml(rider.employeeCity)}, ${escapeHtml(rider.employeeState)}</span>
            </div>
            <div class="rider-info-item">
                <span class="rider-info-label">🎂 Age:</span>
                <span class="rider-info-value">${age} years</span>
            </div>
            <div class="rider-info-item">
                <span class="rider-info-label">🏢 Store:</span>
                <span class="rider-info-value">${escapeHtml(rider.storeName)}</span>
            </div>
            <div class="rider-info-item">
                <span class="rider-info-label">👤 Nominee:</span>
                <span class="rider-info-value">${escapeHtml(rider.nomineeName)} (${rider.nomineeRelationship})</span>
            </div>
        </div>

        <div class="rider-actions">
            <button class="rider-action-btn rider-edit-btn" onclick="editRider('${rider.id}')">
                ✏️ Edit
            </button>
            <button class="rider-action-btn rider-delete-btn" onclick="openDeleteConfirmation('${rider.id}')">
                🗑️ Delete
            </button>
        </div>
    `;

    return card;
}

// ========================================
// SUCCESS POPUP
// ========================================

/**
 * Shows success popup
 */
function showSuccessPopup(title, message) {
    document.getElementById('successTitle').textContent = title;
    document.getElementById('successMessage').textContent = message;
    successPopup.classList.add('active');
    document.body.style.overflow = 'hidden';

    // Auto-close after 3 seconds
    setTimeout(() => {
        closeSuccessPopup();
    }, 3000);
}

/**
 * Closes success popup
 */
function closeSuccessPopup() {
    successPopup.classList.remove('active');
    document.body.style.overflow = 'auto';
}

// ========================================
// EXPORT FUNCTIONALITY
// ========================================

/**
 * Handles data export
 */
function handleExport() {
    if (appState.riders.length === 0) {
        alert('No riders to export');
        return;
    }

    // Create CSV content
    const csvContent = generateCSV(appState.riders);

    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', `riders_${Date.now()}.csv`);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    console.log('Data exported successfully');
}

/**
 * Generates CSV content from riders data
 */
function generateCSV(riders) {
    const headers = [
        'ID',
        'Brand Name',
        'Store Name',
        'Employee No',
        'Employee Name',
        'Email',
        'Phone',
        'Gender',
        'Date of Birth',
        'PAN',
        'Address',
        'City',
        'State',
        'Pin Code',
        'Nominee Name',
        'Nominee Gender',
        'Nominee DOB',
        'Nominee Relationship',
        'Insurance Status',
        'Policy Number',
        'Provider',
        'Policy Start',
        'Policy End',
        'Coverage Amount',
        'Eligibility Status',
        'Status',
        'Created At'
    ];

    let csv = headers.join(',') + '\n';

    riders.forEach(rider => {
        const row = [
            rider.id,
            `"${rider.brandName}"`,
            `"${rider.storeName}"`,
            rider.employeeNo,
            `"${rider.employeeName}"`,
            rider.employeeEmail,
            rider.employeePhone,
            rider.employeeGender,
            rider.employeeDOB,
            rider.panNumber,
            `"${rider.employeeAddress}"`,
            rider.employeeCity,
            rider.employeeState,
            rider.employeePinCode,
            `"${rider.nomineeName}"`,
            rider.nomineeGender,
            rider.nomineeDOB,
            rider.nomineeRelationship,
            rider.insuranceStatus,
            rider.insurancePolicyNumber,
            rider.insuranceProvider,
            rider.insuranceStartDate,
            rider.insuranceEndDate,
            rider.coverageAmount,
            rider.insuranceEligibilityStatus,
            rider.status,
            new Date(rider.createdAt).toLocaleString('en-IN')
        ];
        csv += row.join(',') + '\n';
    });

    return csv;
}

// ========================================
// THEME TOGGLE
// ========================================

/**
 * Toggles between dark and light theme
 */
function toggleTheme() {
    appState.isDarkMode = !appState.isDarkMode;
    document.body.classList.toggle('dark-mode');
    localStorage.setItem('darkMode', appState.isDarkMode);
    updateThemeIcon();
    console.log('Theme toggled:', appState.isDarkMode ? 'Dark' : 'Light');
}

/**
 * Updates theme icon based on current theme
 */
function updateThemeIcon() {
    const icon = document.querySelector('.theme-icon');
    icon.textContent = appState.isDarkMode ? '☀️' : '🌙';
}

// ========================================
// API DATA MANAGEMENT
// ========================================

/**
 * Load all dashboard data from Flask API
 */
async function loadDashboardData() {
    try {
        const [statsRes, ridersRes] = await Promise.all([
            fetch(`${API_BASE_URL}/stats`),
            fetch(`${API_BASE_URL}/riders`)
        ]);

        if (!statsRes.ok || !ridersRes.ok) {
            throw new Error('Failed to load data from API');
        }

        const stats = await statsRes.json();
        const ridersResult = await ridersRes.json();

        if (stats.success) {
            updateStatisticsFromAPI(stats);
        }

        if (ridersResult.success) {
            appState.riders = ridersResult.data || [];
            appState.filteredRiders = [...appState.riders];
            renderRiders(appState.riders);
            console.log(`Loaded ${appState.riders.length} riders from API`);
        }
    } catch (error) {
        console.error('Error loading dashboard data:', error);
        alert('Failed to load data. Make sure the Flask API is running on http://localhost:5000');
    }
}

/**
 * Updates dashboard statistics from API response
 */
function updateStatisticsFromAPI(stats) {
    if (totalRidersEl) totalRidersEl.textContent = stats.total_riders || 0;
    if (activeRidersEl) activeRidersEl.textContent = stats.active_riders || 0;
    if (pendingInsuranceEl) pendingInsuranceEl.textContent = stats.pending_insurance || 0;
    if (completedInsuranceEl) completedInsuranceEl.textContent = stats.completed_insurance || 0;
    if (expiringPoliciesEl) expiringPoliciesEl.textContent = stats.expiring_policies || 0;
    if (recentlyActivatedEl) recentlyActivatedEl.textContent = stats.recently_activated || 0;
}

// ========================================
// STORAGE MANAGEMENT (Deprecated - using API instead)
// ========================================

/**
 * Saves riders to localStorage (deprecated - data stored in database)
 */
function saveRidersToStorage() {
    // API now handles persistence
    console.log('Data persisted via Flask API');
}

/**
 * Loads riders from localStorage (deprecated - use API instead)
 */
function loadRidersFromStorage() {
    // API now handles data loading
    console.log('Loading from Flask API instead of localStorage');
}

// ========================================
// UTILITY FUNCTIONS
// ========================================

/**
 * Generates a unique ID
 */
function generateUniqueId() {
    return `rider_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Calculates age from date of birth
 */
function calculateAge(dob) {
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }

    return age;
}

/**
 * Escapes HTML to prevent XSS
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Capitalizes first letter
 */
function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

// ========================================
// DEMONSTRATION DATA
// ========================================

/**
 * Adds sample data for demonstration (optional)
 */
function addSampleData() {
    if (appState.riders.length === 0) {
        const sampleRiders = [
            {
                id: generateUniqueId(),
                brandName: 'Royal Enfield',
                storeName: 'Bangalore Branch',
                employeeNo: 'EMP001',
                employeeName: 'Rajesh Kumar',
                employeeEmail: 'rajesh@example.com',
                employeePhone: '9876543210',
                employeeGender: 'Male',
                employeeDOB: '1990-05-15',
                panNumber: 'ABCDE1234F',
                employeeAddress: '123 Main Street',
                employeeCity: 'Bangalore',
                employeeState: 'Karnataka',
                employeePinCode: '560001',
                nomineeName: 'Priya Kumar',
                nomineeGender: 'Female',
                nomineeDOB: '1992-08-20',
                nomineeRelationship: 'Spouse',
                status: 'active',
                insuranceStatus: 'completed',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            }
        ];

        appState.riders = sampleRiders;
        saveRidersToStorage();
        renderRiders(appState.riders);
        updateStatistics();
    }
}

// Uncomment below line to add sample data on first load
// document.addEventListener('DOMContentLoaded', addSampleData);

console.log('Rider Insurance Registration App - JavaScript loaded successfully');
