document.getElementById('salaryForm').addEventListener('input', debounce(calculate, 300));

const recalculateButton = document.getElementById('recalculateButton');
const infoMessage = document.getElementById('infoMessage');

recalculateButton.addEventListener('click', () => {
    document.getElementById('salaryForm').reset();
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

        const initialDifferentialAmount = properSalary - currentSalary;
        const dailyDifferential = initialDifferentialAmount / 22;

        // Business days calculations
        const businessDaysFirstSegment = networkDays(firstDate, getLastDayOfMonth(firstDate));
        const businessDaysSecondSegment = networkDays(getFirstDayOfMonth(secondDate), secondDate);

        console.log(`Daily Differential: ${dailyDifferential}`);
        console.log(`Business Days First Segment: ${businessDaysFirstSegment}`);
        console.log(`Business Days Second Segment: ${businessDaysSecondSegment}`);

        // Calculate gross differential
        const grossDifferential = (dailyDifferential * businessDaysFirstSegment) + (dailyDifferential * businessDaysSecondSegment);
        
        // Update results
        updateResults({
            currentSalary: formatNumber(currentSalary),
            properSalary: formatNumber(properSalary),
            initialDifferentialAmount: formatNumber(initialDifferentialAmount),
            grossDifferential: formatNumber(grossDifferential),
            businessDaysFirstSegment: businessDaysFirstSegment,
            businessDaysSecondSegment: businessDaysSecondSegment,
            dailyDifferential: formatNumber(dailyDifferential)
        });
    } catch (error) {
        console.error(error.message);
        alert(`An error occurred: ${error.message}`);
    }
}

function networkDays(startDate, endDate) {
    let count = 0;
    let currentDate = new Date(startDate);

    while (currentDate <= endDate) {
        const day = currentDate.getDay();
        if (day !== 0 && day !== 6) { // Monday to Friday
            count++;
        }
        currentDate.setDate(currentDate.getDate() + 1);
    }

    return count;
}


function networkDays(startDate, endDate) {
    let count = 0;
    let currentDate = new Date(startDate);

    while (currentDate <= endDate) {
        const day = currentDate.getDay();
        if (day !== 0 && day !== 6) { // Monday to Friday
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

function debounce(func, wait) {
    let timeout;
    return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}

function updateResults(results) {
    const resultsTable = document.getElementById('resultsTable').getElementsByTagName('tbody')[0];
    resultsTable.innerHTML = `
        <tr><th>Current Salary</th><td>${results.currentSalary}</td></tr>
        <tr><th>Proper Salary</th><td>${results.properSalary}</td></tr>
        <tr><th>Initial Differential Amount</th><td>${results.initialDifferentialAmount}</td></tr>
        <tr><th>Gross Differential</th><td>${results.grossDifferential}</td></tr>
        <tr><th>Business Days First Segment</th><td>${results.businessDaysFirstSegment}</td></tr>
        <tr><th>Business Days Second Segment</th><td>${results.businessDaysSecondSegment}</td></tr>
        <tr><th>Daily Differential</th><td>${results.dailyDifferential}</td></tr>
    `;
}
