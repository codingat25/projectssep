document.getElementById('salaryForm').addEventListener('input', debounce(calculate, 300));

const recalculateButton = document.getElementById('recalculateButton');
const infoMessage = document.getElementById('infoMessage');

recalculateButton.addEventListener('click', () => {
    // Clear the form fields
    document.getElementById('salaryForm').reset();
    
    // Hide the results table and show the info message
    document.getElementById('resultsTable').getElementsByTagName('tbody')[0].innerHTML = '';
    infoMessage.style.display = 'block';
    recalculateButton.style.display = 'none';
});

function formatNumber(num) {
    return new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(num);
}

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
        const differenceInMonths = getDifferenceInMonths(firstDate, secondDate);

        // Calculate business days in each segment
        const businessDaysFirstSegment = networkDays(firstDate, getLastDayOfMonth(firstDate));
        const businessDaysSecondSegment = networkDays(getFirstDayOfMonth(secondDate), secondDate);

        let calculatedDifferential;
        if (differenceInMonths === 1) {
            // Special formula for 1 month difference
            const daysInMonth = businessDaysFirstSegment + businessDaysSecondSegment;
            calculatedDifferential = (initialDifferentialAmount / 22 * daysInMonth);
        } else {
            // General formula
            calculatedDifferential = initialDifferentialAmount * differenceInMonths;
        }

        const sdBonus = (midYearEligible(firstDate, secondDate) || yearEndEligible(firstDate, secondDate))
            ? initialDifferentialAmount
            : 0;

        const grossSalDiff = calculatedDifferential + sdBonus;
        const gsisPS = 0.09;

        const gsisPshare = initialDifferentialAmount * differenceInMonths * gsisPS;
        const lessGsis = grossSalDiff - gsisPshare;

        const taxPercentage = getTaxPercentage(properSalary * 12);
        const withholdingTax = lessGsis * taxPercentage;
        const totalDeduction = gsisPshare + withholdingTax;
        const netAmount = grossSalDiff - totalDeduction;

        updateResults({
            currentSalary: formatNumber(currentSalary),
            properSalary: formatNumber(properSalary),
            initialDifferentialAmount: formatNumber(initialDifferentialAmount),
            grossSalDiff: formatNumber(grossSalDiff),
            sdBonus: formatNumber(sdBonus),
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

function getDifferenceInMonths(startDate, endDate) {
    if (!startDate || !endDate) return 0;

    let years = endDate.getFullYear() - startDate.getFullYear();
    let months = endDate.getMonth() - startDate.getMonth();
    let days = endDate.getDate() - startDate.getDate();

    if (days < 0) {
        months -= 1;
        days += new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0).getDate();
    }

    if (months < 0) {
        years -= 1;
        months += 12;
    }

    return years * 12 + months + (days / 30);
}

function networkDays(startDate, endDate) {
    let count = 0;
    let currentDate = new Date(startDate);

    while (currentDate <= endDate) {
        if (currentDate.getDay() !== 0 && currentDate.getDay() !== 6) { // Monday to Friday
            count++;
        }
        currentDate.setDate(currentDate.getDate() + 1);
    }

    return count;
}

function getFirstDayOfMonth(date) {
    return new Date(date.getFullYear(), date.getMonth(), 1);
}

function getLastDayOfMonth(date) {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

function midYearEligible(startDate, endDate) {
    const midYearDate = new Date(`05/15/${startDate.getFullYear()}`);
    return startDate <= midYearDate && endDate >= midYearDate;
}

function yearEndEligible(startDate, endDate) {
    const yearEndDate = new Date(`10/31/${startDate.getFullYear()}`);
    return startDate <= yearEndDate && endDate >= yearEndDate;
}

function getTaxPercentage(annualSalary) {
    if (annualSalary <= 282612) return 0;
    if (annualSalary >= 282613 && annualSalary < 451944) return 0.15;
    if (annualSalary >= 451945 && annualSalary <= 890772) return 0.20;
    if (annualSalary >= 890773 && annualSalary <= 1185804) return 0.25;
    if (annualSalary >= 1185805 && annualSalary <= 8000000) return 0.30;
    return 0.35;
}

function updateResults(results) {
    const resultsTable = document.getElementById('resultsTable').getElementsByTagName('tbody')[0];
    resultsTable.innerHTML = `
        <tr><th>Current Salary</th><td>${results.currentSalary}</td></tr>
        <tr><th>Actual Salary</th><td>${results.properSalary}</td></tr>
        <tr><th>Difference</th><td>${results.initialDifferentialAmount}</td></tr>
        <tr><th>Gross Differential</th><td>${results.grossSalDiff}</td></tr>
        <tr><th>SD Bonus</th><td>${results.sdBonus}</td></tr>
        <tr><th>Gross + SD Bonus</th><td>${results.grossSalDiff}</td></tr>
        <tr><th>GSIS PS</th><td>${results.gsisPshare}</td></tr>
        <tr><th>Less GSIS</th><td>${results.lessGsis}</td></tr>
        <tr><th>Tax</th><td>${results.withholdingTax}</td></tr>
        <tr><th>Total Deduction</th><td>${results.totalDeduction}</td></tr>
        <tr><th>Net</th><td>${results.netAmount}</td></tr>
    `;
}

function debounce(func, wait) {
    let timeout;
    return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}
