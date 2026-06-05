function getQueryParam(key) {
    const params = new URLSearchParams(window.location.search);
    return params.get(key);
}

function formatDate(value) {
    if (!value) return '—';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '—';
    return date.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
    });
}

function initProfilePage() {
    AOS.init({
        duration: 800,
        easing: 'ease-in-out',
        once: true,
        mirror: false
    });

    const riderId = getQueryParam('id');
    const riders = JSON.parse(localStorage.getItem('riders') || '[]');
    const rider = riders.find(item => item.id === riderId);

    const heroSection = document.getElementById('profileHero');
    const notFound = document.getElementById('profileNotFound');
    const themeToggle = document.getElementById('themeToggle');

    if (!rider) {
        heroSection.classList.add('hidden');
        notFound.classList.remove('hidden');
        themeToggle.addEventListener('click', toggleTheme);
        return;
    }

    renderRiderProfile(rider);
    themeToggle.addEventListener('click', toggleTheme);
    document.getElementById('downloadCertificateBtn').addEventListener('click', () => downloadCertificate(rider));
    document.getElementById('printSummaryBtn').addEventListener('click', printSummary);
}

function renderRiderProfile(rider) {
    const photo = document.querySelector('#profileAvatar img');
    const statusBadge = document.getElementById('policyBadge');
    const eligibilityBadge = document.getElementById('eligibilityBadge');
    const profileName = document.getElementById('profileName');
    const profileId = document.getElementById('profileId');
    const employeeNo = document.getElementById('employeeNo');
    const storeName = document.getElementById('storeName');
    const brandName = document.getElementById('brandName');
    const insuranceStatusLabel = document.getElementById('insuranceStatusLabel');
    const policyNumberLabel = document.getElementById('policyNumberLabel');
    const daysRemainingLabel = document.getElementById('daysRemainingLabel');
    const completionStatusLabel = document.getElementById('completionStatusLabel');
    const insuranceProviderLabel = document.getElementById('insuranceProviderLabel');
    const startDateLabel = document.getElementById('startDateLabel');
    const endDateLabel = document.getElementById('endDateLabel');
    const coverageAmountLabel = document.getElementById('coverageAmountLabel');
    const eligibilityLabel = document.getElementById('eligibilityLabel');
    const nomineeNameLabel = document.getElementById('nomineeNameLabel');
    const nomineeRelationshipLabel = document.getElementById('nomineeRelationshipLabel');
    const nomineeDobLabel = document.getElementById('nomineeDobLabel');
    const timelineList = document.getElementById('timelineList');

    if (rider.profilePhoto) {
        photo.src = rider.profilePhoto;
    }

    statusBadge.textContent = `${capitalize(rider.insuranceStatus || 'Pending')} Insurance`;
    statusBadge.className = `status-label ${rider.insuranceStatus === 'inactive' ? 'status-inactive' : 'status-active'}`;
    eligibilityBadge.textContent = rider.insuranceEligibilityStatus ? capitalize(rider.insuranceEligibilityStatus) : 'Pending';
    eligibilityBadge.className = `status-label ${rider.insuranceEligibilityStatus === 'ineligible' ? 'status-inactive' : 'status-eligible'}`;

    profileName.textContent = rider.employeeName || 'Rider Name';
    profileId.textContent = `Rider ID: ${rider.id}`;
    employeeNo.textContent = `Employee No: ${rider.employeeNo || '—'}`;
    storeName.textContent = `Store: ${rider.storeName || '—'}`;
    brandName.textContent = `Brand: ${rider.brandName || '—'}`;

    insuranceStatusLabel.textContent = capitalize(rider.insuranceStatus || 'pending');
    policyNumberLabel.textContent = rider.insurancePolicyNumber || '—';
    insuranceProviderLabel.textContent = rider.insuranceProvider || '—';
    startDateLabel.textContent = formatDate(rider.insuranceStartDate);
    endDateLabel.textContent = formatDate(rider.insuranceEndDate);
    coverageAmountLabel.textContent = rider.coverageAmount ? `₹ ${Number(rider.coverageAmount).toLocaleString('en-IN')}` : '—';
    eligibilityLabel.textContent = rider.insuranceEligibilityStatus ? capitalize(rider.insuranceEligibilityStatus) : 'Pending';
    nomineeNameLabel.textContent = rider.nomineeName || '—';
    nomineeRelationshipLabel.textContent = rider.nomineeRelationship || '—';
    nomineeDobLabel.textContent = formatDate(rider.nomineeDOB);

    const daysRemaining = getDaysRemaining(rider.insuranceEndDate);
    daysRemainingLabel.textContent = daysRemaining >= 0 ? `${daysRemaining} days` : 'Expired';
    completionStatusLabel.textContent = rider.insuranceStatus === 'active' ? 'Policy Active' : rider.insuranceStatus === 'inactive' ? 'Policy Inactive' : 'Pending Activation';

    renderTimeline(rider, timelineList, daysRemaining);
}

function getDaysRemaining(endDateValue) {
    if (!endDateValue) return -1;
    const now = new Date();
    const endDate = new Date(endDateValue);
    if (Number.isNaN(endDate.getTime())) return -1;
    return Math.ceil((endDate - now) / (1000 * 60 * 60 * 24));
}

function renderTimeline(rider, timelineList, daysRemaining) {
    timelineList.innerHTML = '';
    const startDate = new Date(rider.insuranceStartDate);
    const endDate = new Date(rider.insuranceEndDate);
    const now = new Date();
    const steps = [
        {
            title: 'Registration Created',
            description: rider.createdAt ? formatDate(rider.createdAt) : 'Pending',
            completed: Boolean(rider.createdAt),
            icon: '📝'
        },
        {
            title: 'Policy Issued',
            description: rider.insurancePolicyNumber || 'Not issued',
            completed: Boolean(rider.insurancePolicyNumber && rider.insuranceProvider),
            icon: '📄'
        },
        {
            title: rider.insuranceStatus === 'active' ? 'Coverage Active' : 'Coverage Pending',
            description: rider.insuranceStatus ? capitalize(rider.insuranceStatus) : 'Pending',
            completed: rider.insuranceStatus === 'active',
            icon: rider.insuranceStatus === 'active' ? '✅' : '⏳'
        },
        {
            title: daysRemaining < 0 ? 'Policy Expired' : 'Expiry Alert',
            description: daysRemaining < 0 ? `Expired ${Math.abs(daysRemaining)} days ago` : `${daysRemaining} days remaining`,
            completed: daysRemaining >= 0,
            icon: daysRemaining < 0 ? '⚠️' : '⏰',
            expired: daysRemaining < 0
        }
    ];

    steps.forEach(step => {
        const item = document.createElement('div');
        item.className = `timeline-step ${step.completed ? 'completed' : ''} ${step.expired ? 'expired' : ''}`;
        item.innerHTML = `
            <div class="timeline-icon">${step.icon}</div>
            <div class="timeline-content">
              <strong>${step.title}</strong>
              <span>${step.description}</span>
            </div>
        `;
        timelineList.appendChild(item);
    });
}

function downloadCertificate(rider) {
    const content = [
        'RIDER INSURANCE CERTIFICATE',
        '--------------------------------------',
        `Name: ${rider.employeeName || '—'}`,
        `Rider ID: ${rider.id}`,
        `Employee No: ${rider.employeeNo || '—'}`,
        `Brand: ${rider.brandName || '—'}`,
        `Store: ${rider.storeName || '—'}`,
        `Policy Number: ${rider.insurancePolicyNumber || '—'}`,
        `Provider: ${rider.insuranceProvider || '—'}`,
        `Start Date: ${formatDate(rider.insuranceStartDate)}`,
        `End Date: ${formatDate(rider.insuranceEndDate)}`,
        `Coverage: ₹ ${Number(rider.coverageAmount || 0).toLocaleString('en-IN')}`,
        `Eligibility: ${capitalize(rider.insuranceEligibilityStatus || 'Pending')}`,
        `Status: ${capitalize(rider.insuranceStatus || 'Pending')}`,
        '--------------------------------------',
        'This certificate confirms the rider insurance details as recorded in the Rider Insurance Portal.'
    ].join('\n');

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `insurance-certificate-${rider.employeeNo || rider.id}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function printSummary() {
    window.print();
}

function capitalize(value) {
    if (!value) return '';
    return value.charAt(0).toUpperCase() + value.slice(1);
}

function toggleTheme() {
    document.body.classList.toggle('dark-mode');
    const icon = document.querySelector('.theme-icon');
    if (icon) icon.textContent = document.body.classList.contains('dark-mode') ? '☀️' : '🌙';
}

window.addEventListener('DOMContentLoaded', initProfilePage);
