document.getElementById('salaryForm').addEventListener('input', debounce(calculate, 300));

function calculate() {
    try {
        // Get inputs
        const currentSalary = parseFloat(document.getElementById('currentSalary').value.replace(/[^0-9.]/g, '')) || 0;
        const properSalary = parseFloat(document.getElementById('properSalary').value.replace(/[^0-9.]/g, '')) || 0;
        const firstDate = new Date(document.getElementById('firstDate').value);
        const secondDate = new Date(document.getElementById('secondDate').value);

        // Check for valid inputs
        if (!currentSalary || !properSalary || isNaN(firstDate.getTime()) || isNaN(secondDate.getTime())) {
            alert("Please provide valid inputs.");
            return;
        }

        // Validate date range
        if (firstDate > secondDate) {
            alert("End Date must be later than Start Date.");
            return;
        }

        // Calculate differential amount and per day basis
        const initialDifferentialAmount = properSalary - currentSalary;
        const dailyDifferential = initialDifferentialAmount / 22; // Assumed 22 working days in a month

        // Business days and partial month calculations
        const partialMonthDifferential = calculatePartialMonth(firstDate, secondDate, dailyDifferential);

        // Full months differential
        const fullMonthsDiff = getFullMonthsDifferential(firstDate, secondDate, initialDifferentialAmount);

        // Gross Differential
        const grossDifferential = partialMonthDifferential + fullMonthsDiff;

        // SD Bonus calculation
        const sdBonus = calculateSdBonus(firstDate, secondDate, initialDifferentialAmount);

        // Gross + SD Bonus
        const grossPlusBonus = grossDifferential + sdBonus;

        // GSIS PS share and deductions
        const gsisShare = grossPlusBonus * 0.09;
        const lessGsis = grossPlusBonus - gsisShare;

        // Tax calculation
        const taxPercentage = getTaxPercentage(properSalary * 12);
        const withholdingTax = lessGsis * taxPercentage;
        const totalDeduction = gsisShare + withholdingTax;

        // Net Amount
        const netAmount = grossPlusBonus - totalDeduction;

        // Update results in the table
        updateResults({
            currentSalary: formatNumber(currentSalary),
            properSalary: formatNumber(properSalary),
            initialDifferentialAmount: formatNumber(initialDifferentialAmount),
            grossDifferential: formatNumber(grossDifferential),
            sdBonus: formatNumber(sdBonus),
            grossPlusBonus: formatNumber(grossPlusBonus),
            gsisShare: formatNumber(gsisShare),
            withholdingTax: formatNumber(withholdingTax),
            totalDeduction: formatNumber(totalDeduction),
            netAmount: formatNumber(netAmount)
        });
    } catch (error) {
        console.error("Error in calculation:", error);
        alert("Error in calculation. Please check the inputs.");
    }
}

// Helper functions

function calculatePartialMonth(firstDate, secondDate, dailyDifferential) {
    // Calculate partial month differentials for both start and end months
    const firstPeriodEnd = getLastDayOfMonth(firstDate);
    const businessDaysInFirstPeriod = networkDays(firstDate, firstPeriodEnd);

    const secondPeriodStart = getFirstDayOfMonth(secondDate);
    const businessDaysInSecondPeriod = networkDays(secondPeriodStart, secondDate);

    return dailyDifferential * (businessDaysInFirstPeriod + businessDaysInSecondPeriod);
}

function getFullMonthsDifferential(firstDate, secondDate, differentialAmount) {
    const fullMonths = getDifferenceInMonths(firstDate, secondDate);
    return differentialAmount * fullMonths;
}

function calculateSdBonus(firstDate, secondDate, differentialAmount) {
    const midYearBonus = midYearEligible(firstDate, secondDate) ? differentialAmount * 0.10 : 0;
    const yearEndBonus = yearEndEligible(firstDate, secondDate) ? differentialAmount * 0.10 : 0;
    return midYearBonus + yearEndBonus;
}

function networkDays(startDate, endDate) {
    let count = 0;
    let curDate = startDate;
    while (curDate <= endDate) {
        const dayOfWeek = curDate.getDay();
        if (dayOfWeek !== 0 && dayOfWeek !== 6) count++;
        curDate.setDate(curDate.getDate() + 1);
    }
    return count;
}

function getDifferenceInMonths(startDate, endDate) {
    const months = (endDate.getFullYear() - startDate.getFullYear()) * 12 + (endDate.getMonth() - startDate.getMonth());
    return months;
}

function midYearEligible(firstDate, secondDate) {
    const midYearCutoff = new Date(firstDate.getFullYear(), 4, 15); // May 15 cutoff
    return secondDate >= midYearCutoff;
}

function yearEndEligible(firstDate, secondDate) {
    const yearEndCutoff = new Date(firstDate.getFullYear(), 9, 31); // October 31 cutoff
    return secondDate >= yearEndCutoff;
}

function getLastDayOfMonth(date) {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

function getFirstDayOfMonth(date) {
    return new Date(date.getFullYear(), date.getMonth(), 1);
}

function getTaxPercentage(annualSalary) {
    if (annualSalary <= 282612) return 0;
    if (annualSalary >= 282613 && annualSalary < 451944) return 0.15;
    if (annualSalary >= 451945 && annualSalary <= 890772) return 0.20;
    if (annualSalary >= 890773 && annualSalary <= 1185804) return 0.25;
    if (annualSalary >= 1185805 && annualSalary <= 8000000) return 0.30;
    return 0.35;
}

function formatNumber(num) {
    return num.toLocaleString('en-US', { style: 'currency', currency: 'PHP' });
}

function updateResults(results) {
    document.getElementById('currentSalaryResult').textContent = results.currentSalary;
    document.getElementById('properSalaryResult').textContent = results.properSalary;
    document.getElementById('initialDifferentialAmountResult').textContent = results.initialDifferentialAmount;
    document.getElementById('grossDifferentialResult').textContent = results.grossDifferential;
    document.getElementById('sdBonusResult').textContent = results.sdBonus;
    document.getElementById('grossPlusBonusResult').textContent = results.grossPlusBonus;
    document.getElementById('gsisShareResult').textContent = results.gsisShare;
    document.getElementById('withholdingTaxResult').textContent = results.withholdingTax;
    document.getElementById('totalDeductionResult').textContent = results.totalDeduction;
    document.getElementById('netAmountResult').textContent = results.netAmount;
}

// Debounce function to delay execution
function debounce(func, delay) {
    let debounceTimer;
    return function() {
        const context = this;
        const args = arguments;
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => func.apply(context, args), delay);
    };
}
