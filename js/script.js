document.getElementById('salaryForm').addEventListener('input', debounce(calculate, 300));

const recalculateButton = document.getElementById('recalculateButton');
const infoMessage = document.getElementById('infoMessage');

// Reset form logic
recalculateButton.addEventListener('click', () => {
    document.getElementById('salaryForm').reset();
    document.getElementById('resultsTable').getElementsByTagName('tbody')[0].innerHTML = '';
    infoMessage.style.display = 'block';
    recalculateButton.style.display = 'none';
});

// Utility function for formatting numbers
function formatNumber(num) {
    return new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(num);
}

// Main calculation function
function calculate() {
    try {
        const currentSalary = parseFloat(document.getElementById('currentSalary').value.replace(/[^0-9.]/g, '')) || 0;
        const properSalary = parseFloat(document.getElementById('properSalary').value.replace(/[^0-9.]/g, '')) || 0;
        
        const firstDateInput = document.getElementById('firstDate').value;
        const secondDateInput = document.getElementById('secondDate').value;

        if (currentSalary && properSalary && firstDateInput && secondDateInput) {
            recalculateButton.style.display = 'block';
            infoMessage.style.display = 'none';
        } else {
            recalculateButton.style.display = 'none';
            infoMessage.style.display = 'block';
            return;
        }

        const firstDate = new Date(firstDateInput);
        const secondDate = new Date(secondDateInput);

        if (isNaN(firstDate.getTime()) || isNaN(secondDate.getTime())) {
            throw new Error('Invalid date format. Please ensure both dates are in the correct format (YYYY-MM-DD).');
        }

        if (firstDate > secondDate) {
            throw new Error('End Date must be later than Start Date.');
        }

        const initialDifferentialAmount = Math.max(0, properSalary - currentSalary);
        const grossSalDiff = calculateGrossDifferential(firstDate, secondDate, initialDifferentialAmount);

        // Calculate SD Bonus
        const sdBonus = (midYearEligible(firstDate, secondDate) || yearEndEligible(firstDate, secondDate)) 
            ? initialDifferentialAmount 
            : 0;

        // Calculate GSIS, Tax, Deductions, and Net
        const totalGrossWithBonus = grossSalDiff + sdBonus;
        const gsisPS = 0.09;
        const gsisPshare = totalGrossWithBonus * gsisPS;
        const lessGsis = totalGrossWithBonus - gsisPshare;

        const taxPercentage = getTaxPercentage(properSalary * 12);
        const withholdingTax = lessGsis * taxPercentage;
        const totalDeduction = gsisPshare + withholdingTax;
        const netAmount = totalGrossWithBonus - totalDeduction;

        // Update results
        updateResults({
            currentSalary: formatNumber(currentSalary),
            properSalary: formatNumber(properSalary),
            initialDifferentialAmount: formatNumber(initialDifferentialAmount),
            grossSalDiff: formatNumber(grossSalDiff),
            sdBonus: formatNumber(sdBonus),
            totalGrossWithBonus: formatNumber(totalGrossWithBonus),
            gsisPshare: formatNumber(gsisPshare),
            lessGsis: formatNumber(lessGsis),
            withholdingTax: formatNumber(withholdingTax),
            totalDeduction: formatNumber(totalDeduction),
            netAmount: formatNumber(netAmount),
        });
    } catch (error) {
        console.error(error.message);
        alert(`An error occurred: ${error.message}`);
    }
}

// Helper function to calculate the gross differential
function calculateGrossDifferential(startDate, endDate, differentialAmount) {
    const businessDaysInFirstMonth = networkDays(startDate, getLastDayOfMonth(startDate));
    const businessDaysInSecondMonth = networkDays(getFirstDayOfMonth(endDate), endDate);

    if (startDate.getMonth() === endDate.getMonth() && startDate.getFullYear() === endDate.getFullYear()) {
        return (differentialAmount / 22) * (businessDaysInFirstMonth + businessDaysInSecondMonth);
    } else {
        const fullMonths = getDifferenceInMonths(startDate, endDate) - 1;
        return (differentialAmount / 22) * businessDaysInFirstMonth +
               (differentialAmount / 22) * businessDaysInSecondMonth +
               (differentialAmount * fullMonths);
    }
}

// Helper function to calculate the number of months between two dates
function getDifferenceInMonths(startDate, endDate) {
    let years = endDate.getFullYear() - startDate.getFullYear();
    let months = endDate.getMonth() - startDate.getMonth();
    if (months < 0) {
        years -= 1;
        months += 12;
    }
    return years * 12 + months;
}

// Function to calculate the number of business days (excluding weekends) between two dates
function networkDays(startDate, endDate) {
    let count = 0;
    let currentDate = new Date(startDate);

    while (currentDate <= endDate) {
        const day = currentDate.getDay();
        if (day !== 0 && day !== 6) { // 0 = Sunday, 6 = Saturday
            count++;
        }
        currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return count;
}

// Helper function to get the first day of the month
function getFirstDayOfMonth(date) {
    return new Date(date.getFullYear(), date.getMonth(), 1);
}

// Helper function to get the last day of the month
function getLastDayOfMonth(date) {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

// Functions to check SD Bonus eligibility
function midYearEligible(startDate, endDate) {
    const midYearDate = new Date(`05/15/${startDate.getFullYear()}`);
    return startDate <= midYearDate && endDate >= midYearDate;
}

function yearEndEligible(startDate, endDate) {
    const yearEndDate = new Date(`10/31/${startDate.getFullYear()}`);
    return startDate <= yearEndDate && endDate >= yearEndDate;
}

// Function to get tax percentage based on annual salary
function getTaxPercentage(annualSalary) {
    if (annualSalary <= 250000) return 0;
    if (annualSalary >= 250001 && annualSalary < 400000) return 0.15;
    if (annualSalary >= 400001 && annualSalary <= 800000) return 0.20;
    if (annualSalary >= 800001 && annualSalary <= 2000000) return 0.25;
    if (annualSalary >= 2000001 && annualSalary <= 8000000) return 0.30;
    return 0.32;
}

// Function to update results table
function updateResults(results) {
    const resultsTable = document.getElementById('resultsTable').getElementsByTagName('tbody')[0];
    resultsTable.innerHTML = `
        <tr><th>Current Salary</th><td>${results.currentSalary}</td></tr>
        <tr><th>Actual Salary</th><td>${results.properSalary}</td></tr>
        <tr><th>Difference</th><td>${results.initialDifferentialAmount}</td></tr>
        <tr><th>Gross Differential</th><td>${results.grossSalDiff}</td></tr>
        <tr><th>SD Bonus</th><td>${results.sdBonus}</td></tr>
        <tr><th>Gross + SD Bonus</th><td>${results.totalGrossWithBonus}</td></tr>
        <tr><th>GSIS PS</th><td>${results.gsisPshare}</td></tr>
        <tr><th>Less GSIS</th><td>${results.lessGsis}</td></tr>
        <tr><th>Tax</th><td>${results.withholdingTax}</td></tr>
        <tr><th>Total Deduction</th><td>${results.totalDeduction}</td></tr>
        <tr><th>Net</th><td>${results.netAmount}</td></tr>
    `;
}

// Debounce function to prevent too many rapid inputs
function debounce(func, wait) {
    let timeout;
    return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}
