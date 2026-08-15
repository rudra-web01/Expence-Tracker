const STORAGE_KEY = "spendsmart_expenses";

// Load saved expenses from Local Storage
let expenses = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");

// Information used by different parts of the app
const categories = {
    food: { label: "Food", icon: "🍔", color: "#fcb95c", className: "cat-food", budget: 3000 },
    transport: { label: "Transport", icon: "🚌", color: "#5cf5c8", className: "cat-transport", budget: 1000 },
    entertainment: { label: "Entertainment", icon: "🎮", color: "#fc5c7d", className: "cat-entertainment", budget: 1500 },
    education: { label: "Education", icon: "📚", color: "#7c5cfc", className: "cat-education", budget: 2000 },
    health: { label: "Health", icon: "💊", color: "#5cc8fc", className: "cat-health", budget: 500 },
    shopping: { label: "Shopping", icon: "🛍️", color: "#c85cfc", className: "cat-shopping", budget: 2000 },
    rent: { label: "Rent", icon: "🏠", color: "#fc8c5c", className: "cat-rent", budget: 8000 },
    other: { label: "Other", icon: "📦", color: "#8c8ca0", className: "cat-other", budget: 1000 }
};

// Chart variables
let donutChart = null;
let lineChart = null;
let barChart = null;
let dowChart = null;
let radarChart = null;



function saveExpenses() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(expenses));
}



function addExpense() {
    const description = document.getElementById("exp-desc").value.trim();
    const amount = Number(document.getElementById("exp-amount").value);
    const category = document.getElementById("exp-cat").value;
    const dateInput = document.getElementById("exp-date").value;

    const date = dateInput || getToday();

    if (description === "") {
        showToast("Please enter a description");
        return;
    }

    if (isNaN(amount) || amount <= 0) {
        showToast("Please enter a valid amount");
        return;
    }

    const expense = {
        id: Date.now(),
        desc: description,
        amount: amount,
        cat: category,
        date: date
    };

    expenses.push(expense);

    saveExpenses();
    clearExpenseForm();
    renderAll();

    showToast("✓ Expense added successfully");
}

function deleteExpense(id) {
    const updatedExpenses = [];

    for (let i = 0; i < expenses.length; i++) {
        if (expenses[i].id !== id) {
            updatedExpenses.push(expenses[i]);
        }
    }

    expenses = updatedExpenses;

    saveExpenses();
    renderAll();

    showToast("Expense deleted");
}

function clearExpenseForm() {
    document.getElementById("exp-desc").value = "";
    document.getElementById("exp-amount").value = "";
}



function getToday() {
    return new Date().toISOString().slice(0, 10);
}

function formatDate(dateString) {
    const date = new Date(dateString + "T00:00:00");

    return date.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short"
    });
}

function getMonthExpenses() {
    const today = new Date();
    const monthExpenses = [];

    for (let i = 0; i < expenses.length; i++) {
        const expenseDate = new Date(expenses[i].date + "T00:00:00");

        if (
            expenseDate.getMonth() === today.getMonth() &&
            expenseDate.getFullYear() === today.getFullYear()
        ) {
            monthExpenses.push(expenses[i]);
        }
    }

    return monthExpenses;
}

function getFilteredExpenses() {
    const selectedCategory = document.getElementById("filter-cat").value;
    const selectedPeriod = document.getElementById("filter-period").value;

    const today = new Date();
    const filteredExpenses = [];

    for (let i = 0; i < expenses.length; i++) {
        const expense = expenses[i];

        // Category filter
        if (
            selectedCategory !== "all" &&
            expense.cat !== selectedCategory
        ) {
            continue;
        }

        // Week filter
        if (selectedPeriod === "week") {
            const expenseDate = new Date(expense.date + "T00:00:00");
            const differenceInDays =
                (today - expenseDate) / (1000 * 60 * 60 * 24);

            if (differenceInDays > 7 || differenceInDays < 0) {
                continue;
            }
        }

        // Month filter
        if (selectedPeriod === "month") {
            const expenseDate = new Date(expense.date + "T00:00:00");

            if (
                expenseDate.getMonth() !== today.getMonth() ||
                expenseDate.getFullYear() !== today.getFullYear()
            ) {
                continue;
            }
        }

        filteredExpenses.push(expense);
    }

    return filteredExpenses;
}



function getTotal(expenseList) {
    let total = 0;

    for (let i = 0; i < expenseList.length; i++) {
        total += Number(expenseList[i].amount);
    }

    return total;
}

function getCategoryTotals(expenseList) {
    const totals = {};

    for (let i = 0; i < expenseList.length; i++) {
        const category = expenseList[i].cat;

        if (totals[category] === undefined) {
            totals[category] = 0;
        }

        totals[category] += Number(expenseList[i].amount);
    }

    return totals;
}



function renderList() {
    const filteredExpenses = getFilteredExpenses();

    filteredExpenses.sort(function(a, b) {
        return new Date(b.date) - new Date(a.date);
    });

    const total = getTotal(filteredExpenses);
    const filterTotal = document.getElementById("filter-total");

    if (filteredExpenses.length > 0) {
        filterTotal.textContent =
            filteredExpenses.length +
            " expenses · ₹" +
            total.toLocaleString();
    } else {
        filterTotal.textContent = "";
    }

    const container = document.getElementById("expense-list");

    if (filteredExpenses.length === 0) {
        container.innerHTML =
            '<div class="empty-state"><span class="icon">📭</span>No expenses match this filter.</div>';
        return;
    }

    let html = "";

    for (let i = 0; i < filteredExpenses.length; i++) {
        const expense = filteredExpenses[i];
        const category = categories[expense.cat] || categories.other;

        html += `
            <div class="expense-item">
                <span class="cat-badge ${category.className}">
                    ${category.icon} ${category.label}
                </span>

                <span class="expense-desc">${expense.desc}</span>

                <span class="expense-date">${formatDate(expense.date)}</span>

                <span class="expense-amount">
                    ₹${Number(expense.amount).toLocaleString()}
                </span>

                <button class="btn btn-danger"
                    onclick="deleteExpense(${expense.id})">
                    ✕
                </button>
            </div>
        `;
    }

    container.innerHTML = html;
}



function renderHeaderStats() {
    const monthExpenses = getMonthExpenses();
    const monthTotal = getTotal(monthExpenses);
    const categoryTotals = getCategoryTotals(monthExpenses);

    document.getElementById("header-total").textContent =
        "₹" + monthTotal.toLocaleString();

    document.getElementById("header-count").textContent = expenses.length;

    let topCategory = "";
    let highestAmount = 0;

    for (const category in categoryTotals) {
        if (categoryTotals[category] > highestAmount) {
            highestAmount = categoryTotals[category];
            topCategory = category;
        }
    }

    if (topCategory !== "") {
        const category = categories[topCategory];

        document.getElementById("header-top-cat").textContent =
            category.icon + " " + category.label;
    } else {
        document.getElementById("header-top-cat").textContent = "—";
    }
}


function renderDashboard() {
    const monthExpenses = getMonthExpenses();
    const monthTotal = getTotal(monthExpenses);
    const categoryTotals = getCategoryTotals(monthExpenses);

    // Convert category totals into an array
    const categoryList = [];

    for (const category in categoryTotals) {
        categoryList.push({
            name: category,
            total: categoryTotals[category]
        });
    }

    // Sort categories from highest spending to lowest
    categoryList.sort(function(a, b) {
        return b.total - a.total;
    });

    // Calculate daily average
    let dailyAverage = 0;

    if (monthExpenses.length > 0) {
        const currentDay = new Date().getDate();
        dailyAverage = Math.round(monthTotal / currentDay);
    }

    // Find the day with the highest spending
    let biggestDay = "—";

    if (monthExpenses.length > 0) {
        const dailyTotals = {};

        for (let i = 0; i < monthExpenses.length; i++) {
            const date = monthExpenses[i].date;

            if (dailyTotals[date] === undefined) {
                dailyTotals[date] = 0;
            }

            dailyTotals[date] += Number(monthExpenses[i].amount);
        }

        let highestDayAmount = 0;
        let highestDayDate = "";

        for (const date in dailyTotals) {
            if (dailyTotals[date] > highestDayAmount) {
                highestDayAmount = dailyTotals[date];
                highestDayDate = date;
            }
        }

        if (highestDayDate !== "") {
            biggestDay =
                "₹" +
                highestDayAmount.toLocaleString() +
                " on " +
                formatDate(highestDayDate);
        }
    }

    document.getElementById("metrics-row").innerHTML = `
        <div class="metric-card accent">
            <div class="metric-label">This Month</div>
            <div class="metric-value">
                ₹${monthTotal.toLocaleString()}
            </div>
            <div class="metric-sub">
                ${monthExpenses.length} transactions
            </div>
        </div>

        <div class="metric-card danger">
            <div class="metric-label">Daily Average</div>
            <div class="metric-value">
                ₹${dailyAverage.toLocaleString()}
            </div>
            <div class="metric-sub">
                per day this month
            </div>
        </div>

        <div class="metric-card warn">
            <div class="metric-label">Biggest Day</div>
            <div class="metric-value" style="font-size:18px;">
                ${biggestDay}
            </div>
            <div class="metric-sub">
                highest single-day spend
            </div>
        </div>

        <div class="metric-card success">
            <div class="metric-label">Categories</div>
            <div class="metric-value">
                ${categoryList.length}
            </div>
            <div class="metric-sub">
                spending areas
            </div>
        </div>
    `;

    createDonutChart(categoryList);
    renderCategoryBreakdown(categoryList);
    renderCategoryInsights(categoryList, monthTotal);
}

function renderCategoryBreakdown(categoryList) {
    const container = document.getElementById("cat-breakdown");

    if (categoryList.length === 0) {
        container.innerHTML =
            '<div style="color:var(--muted);font-size:13px;padding:20px;">No data yet</div>';
        return;
    }

    const highestAmount = categoryList[0].total;
    let html = "";

    for (let i = 0; i < categoryList.length; i++) {
        const item = categoryList[i];
        const category = categories[item.name];

        const percentage = Math.round(
            (item.total / highestAmount) * 100
        );

        html += `
            <div style="margin-bottom:14px;">
                <div style="display:flex;justify-content:space-between;
                            font-size:12px;margin-bottom:4px;">
                    <span>${category.icon} ${category.label}</span>

                    <span style="color:${category.color};
                                 font-family:'Syne',sans-serif;
                                 font-weight:700;">
                        ₹${item.total.toLocaleString()}
                    </span>
                </div>

                <div class="progress-bar">
                    <div class="progress-fill"
                         style="width:${percentage}%;
                                background:${category.color};">
                    </div>
                </div>
            </div>
        `;
    }

    container.innerHTML = html;
}

function renderCategoryInsights(categoryList, monthTotal) {
    const container = document.getElementById("cat-insights");

    if (categoryList.length === 0) {
        container.innerHTML =
            '<div style="color:var(--muted);font-size:13px;">Add expenses to see insights.</div>';
        return;
    }

    let html = "";

    const numberToShow = Math.min(categoryList.length, 4);

    for (let i = 0; i < numberToShow; i++) {
        const item = categoryList[i];
        const category = categories[item.name];

        const percentage =
            monthTotal > 0
                ? ((item.total / monthTotal) * 100).toFixed(1)
                : 0;

        const budgetPercentage = Math.round(
            (item.total / category.budget) * 100
        );

        let budgetMessage = "";

        if (budgetPercentage > 100) {
            budgetMessage =
                `<br>Budget usage:
                <span class="insight-highlight">
                    ${budgetPercentage}% ⚠️ Over!
                </span>`;
        } else {
            budgetMessage =
                `<br>Budget usage:
                <span class="insight-good">
                    ${budgetPercentage}% ✓
                </span>`;
        }

        html += `
            <div class="insight-card">
                <div class="insight-icon">${category.icon}</div>

                <div>
                    <div class="insight-title">
                        ${category.label}
                    </div>

                    <div class="insight-body">
                        Spent
                        <span class="insight-highlight">
                            ₹${item.total.toLocaleString()}
                        </span>
                        — ${percentage}% of your total.

                        ${budgetMessage}
                    </div>
                </div>
            </div>
        `;
    }

    container.innerHTML = html;
}

function destroyChart(chart) {
    if (chart) {
        chart.destroy();
    }
}

function createDonutChart(categoryList) {
    destroyChart(donutChart);

    if (categoryList.length === 0) {
        return;
    }

    const labels = [];
    const values = [];
    const colors = [];

    for (let i = 0; i < categoryList.length; i++) {
        const category = categories[categoryList[i].name];

        labels.push(category.icon + " " + category.label);
        values.push(categoryList[i].total);
        colors.push(category.color);
    }

    const context =
        document.getElementById("donutChart").getContext("2d");

    donutChart = new Chart(context, {
        type: "doughnut",

        data: {
            labels: labels,

            datasets: [{
                data: values,
                backgroundColor: colors,
                borderWidth: 2
            }]
        },

        options: {
            responsive: true,
            maintainAspectRatio: false,

            plugins: {
                legend: {
                    position: "right",

                    labels: {
                        color: "rgba(240,238,255,0.7)",
                        font: {
                            family: "DM Mono",
                            size: 11
                        },
                        boxWidth: 12
                    }
                }
            },

            cutout: "65%"
        }
    });
}

function renderPatterns() {
    createLineChart();
    createWeeklyChart();
    createDayOfWeekChart();
    createRadarChart();
}

function createLineChart() {
    destroyChart(lineChart);

    const labels = [];
    const totals = [];

    // Last 30 days
    for (let i = 29; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);

        const dateKey = date.toISOString().slice(0, 10);

        labels.push(formatDate(dateKey));

        let total = 0;

        for (let j = 0; j < expenses.length; j++) {
            if (expenses[j].date === dateKey) {
                total += Number(expenses[j].amount);
            }
        }

        totals.push(total);
    }

    const context =
        document.getElementById("lineChart").getContext("2d");

    lineChart = new Chart(context, {
        type: "line",

        data: {
            labels: labels,

            datasets: [{
                label: "Daily Spend (₹)",
                data: totals,
                borderColor: "#7c5cfc",
                backgroundColor: "rgba(124,92,252,0.1)",
                borderWidth: 2,
                fill: true,
                tension: 0.4
            }]
        },

        options: getBasicChartOptions()
    });
}

function createWeeklyChart() {
    destroyChart(barChart);

    const labels = [];
    const totals = [];

    // Last 8 weeks
    for (let week = 7; week >= 0; week--) {
        const endDate = new Date();
        endDate.setDate(endDate.getDate() - week * 7);

        const startDate = new Date(endDate);
        startDate.setDate(startDate.getDate() - 6);

        let total = 0;

        for (let i = 0; i < expenses.length; i++) {
            const expenseDate =
                new Date(expenses[i].date + "T00:00:00");

            if (expenseDate >= startDate && expenseDate <= endDate) {
                total += Number(expenses[i].amount);
            }
        }

        labels.push("W" + (8 - week));
        totals.push(total);
    }

    const context =
        document.getElementById("barChart").getContext("2d");

    barChart = new Chart(context, {
        type: "bar",

        data: {
            labels: labels,

            datasets: [{
                label: "Weekly Spend",
                data: totals,
                backgroundColor: "#7c5cfc",
                borderRadius: 6
            }]
        },

        options: getBasicChartOptions()
    });
}

function createDayOfWeekChart() {
    destroyChart(dowChart);

    const dayNames = [
        "Sun", "Mon", "Tue", "Wed",
        "Thu", "Fri", "Sat"
    ];

    const totals = [0, 0, 0, 0, 0, 0, 0];

    for (let i = 0; i < expenses.length; i++) {
        const date =
            new Date(expenses[i].date + "T00:00:00");

        const dayNumber = date.getDay();

        totals[dayNumber] += Number(expenses[i].amount);
    }

    const context =
        document.getElementById("dowChart").getContext("2d");

    dowChart = new Chart(context, {
        type: "bar",

        data: {
            labels: dayNames,

            datasets: [{
                label: "Total Spend",
                data: totals,
                backgroundColor: "#fc5c7d",
                borderRadius: 6
            }]
        },

        options: getBasicChartOptions()
    });
}

function createRadarChart() {
    destroyChart(radarChart);

    const labels = [];
    const totals = [];

    for (const categoryName in categories) {
        labels.push(
            categories[categoryName].icon +
            " " +
            categories[categoryName].label
        );

        let total = 0;

        for (let i = 0; i < expenses.length; i++) {
            if (expenses[i].cat === categoryName) {
                total += Number(expenses[i].amount);
            }
        }

        totals.push(total);
    }

    const context =
        document.getElementById("radarChart").getContext("2d");

    radarChart = new Chart(context, {
        type: "radar",

        data: {
            labels: labels,

            datasets: [{
                label: "All-time spending",
                data: totals,
                backgroundColor: "rgba(124,92,252,0.2)",
                borderColor: "#7c5cfc",
                borderWidth: 2
            }]
        },

        options: {
            responsive: true,
            maintainAspectRatio: false,

            scales: {
                r: {
                    ticks: {
                        color: "rgba(240,238,255,0.7)"
                    }
                }
            },

            plugins: {
                legend: {
                    display: false
                }
            }
        }
    });
}

function getBasicChartOptions() {
    return {
        responsive: true,
        maintainAspectRatio: false,

        scales: {
            x: {
                ticks: {
                    color: "rgba(240,238,255,0.7)"
                }
            },

            y: {
                ticks: {
                    color: "rgba(240,238,255,0.7)",

                    callback: function(value) {
                        return "₹" + value.toLocaleString();
                    }
                }
            }
        },

        plugins: {
            legend: {
                display: false
            }
        }
    };
}


function renderWasteReport() {
    const total = getTotal(expenses);
    const categoryTotals = getCategoryTotals(expenses);

    const rules = {
        entertainment: {
            threshold: 2000,
            severity: "high",
            tip: "Subscriptions, gaming and movies can add up quickly. Try sharing subscriptions or using free alternatives."
        },

        food: {
            threshold: 4000,
            severity: "high",
            tip: "Eating out regularly can increase your monthly spending. Cooking a few meals at home can help."
        },

        shopping: {
            threshold: 2500,
            severity: "medium",
            tip: "Try waiting 24 hours before buying non-essential items."
        },

        transport: {
            threshold: 1500,
            severity: "medium",
            tip: "Public transport, carpooling or cycling can reduce transport costs."
        },

        other: {
            threshold: 1500,
            severity: "low",
            tip: "Track your Other expenses carefully because small purchases can become hidden spending."
        }
    };

    const waste = [];

    for (const category in categoryTotals) {
        const rule = rules[category];

        if (!rule) {
            continue;
        }

        const amount = categoryTotals[category];

        if (amount > rule.threshold) {
            waste.push({
                category: category,
                amount: amount,
                rule: rule
            });
        }
    }

    waste.sort(function(a, b) {
        return b.amount - a.amount;
    });

    const container = document.getElementById("waste-report");

    if (expenses.length === 0) {
        container.innerHTML =
            '<div class="empty-state"><span class="icon">📊</span>Add some expenses first to analyze your spending.</div>';
        return;
    }

    if (waste.length === 0) {
        container.innerHTML =
            '<div class="empty-state"><span class="icon">🎉</span>No obvious waste patterns detected. Keep it up!</div>';
        return;
    }

    let html = "";

    for (let i = 0; i < waste.length; i++) {
        const item = waste[i];
        const category = categories[item.category];

        const extraAmount =
            item.amount - item.rule.threshold;

        const percentage =
            total > 0
                ? ((item.amount / total) * 100).toFixed(1)
                : 0;

        let className = "";

        if (item.rule.severity === "medium") {
            className = "medium";
        } else if (item.rule.severity === "low") {
            className = "low";
        }

        html += `
            <div class="waste-item ${className}">
                <div class="waste-header">
                    <div class="waste-category">
                        ${category.icon} ${category.label} —
                        ₹${item.amount.toLocaleString()}
                    </div>

                    <div class="waste-pct">
                        ${percentage}% of total
                    </div>
                </div>

                <div class="waste-desc">
                    ₹${extraAmount.toLocaleString()}
                    above recommended threshold.
                    ${item.rule.tip}
                </div>
            </div>
        `;
    }

    container.innerHTML = html;
}


function renderSavings() {
    const monthExpenses = getMonthExpenses();
    const categoryTotals = getCategoryTotals(monthExpenses);
    const monthTotal = getTotal(monthExpenses);

    const suggestions = [];

    for (const category in categoryTotals) {
        const amount = categoryTotals[category];

        if (category === "food" && amount > 2500) {
            suggestions.push({
                icon: "🍳",
                title: "Cook More, Order Less",
                save: Math.round(amount * 0.3),
                body:
                    "You spent ₹" +
                    amount.toLocaleString() +
                    " on food. Cooking a few meals at home could reduce this amount."
            });
        }

        if (category === "entertainment" && amount > 800) {
            suggestions.push({
                icon: "📱",
                title: "Share Subscriptions",
                save: Math.round(amount * 0.4),
                body:
                    "You spent ₹" +
                    amount.toLocaleString() +
                    " on entertainment. Try free plans or sharing subscriptions."
            });
        }

        if (category === "transport" && amount > 800) {
            suggestions.push({
                icon: "🚲",
                title: "Reduce Transport Costs",
                save: Math.round(amount * 0.35),
                body:
                    "Your transport spending is ₹" +
                    amount.toLocaleString() +
                    ". Public transport, carpooling or cycling can help."
            });
        }

        if (category === "shopping" && amount > 1500) {
            suggestions.push({
                icon: "⏳",
                title: "Use the 24-Hour Rule",
                save: Math.round(amount * 0.5),
                body:
                    "You spent ₹" +
                    amount.toLocaleString() +
                    " on shopping. Wait 24 hours before non-essential purchases."
            });
        }
    }

    // Check the day with the highest spending
    if (monthExpenses.length > 5) {
        const dayTotals = [0, 0, 0, 0, 0, 0, 0];

        for (let i = 0; i < monthExpenses.length; i++) {
            const date =
                new Date(monthExpenses[i].date + "T00:00:00");

            dayTotals[date.getDay()] +=
                Number(monthExpenses[i].amount);
        }

        let highestDay = 0;

        for (let i = 1; i < dayTotals.length; i++) {
            if (dayTotals[i] > dayTotals[highestDay]) {
                highestDay = i;
            }
        }

        if (dayTotals[highestDay] > 0) {
            const dayNames = [
                "Sunday", "Monday", "Tuesday", "Wednesday",
                "Thursday", "Friday", "Saturday"
            ];

            suggestions.push({
                icon: "📅",
                title: "Watch Out for " + dayNames[highestDay] + "s",
                save: Math.round(dayTotals[highestDay] * 0.25),
                body:
                    dayNames[highestDay] +
                    " is your highest spending day. Set a spending limit for that day."
            });
        }
    }
    if (monthTotal > 5000) {
        suggestions.push({
            icon: "💰",
            title: "Pay Yourself First",
            save: Math.round(monthTotal * 0.1),
            body:
                "Try to save around 10% of your monthly spending. Small savings can build an emergency fund over time."
        });
    }

    // Student-specific suggestion
    suggestions.push({
        icon: "🎓",
        title: "Use Student Discounts",
        save: 300,
        body:
            "Look for student discounts on software, subscriptions, transport and other services."
    });

    let totalSavings = 0;

    for (let i = 0; i < suggestions.length; i++) {
        totalSavings += suggestions[i].save;
    }

    let score = "—";

    if (monthTotal > 0) {
        if (monthTotal < 3000) {
            score = "A+";
        } else if (monthTotal < 6000) {
            score = "B+";
        } else if (monthTotal < 10000) {
            score = "C";
        } else {
            score = "D";
        }
    }

    document.getElementById("potential-savings").textContent =
        "₹" + totalSavings.toLocaleString();

    document.getElementById("savings-score").textContent = score;

    const container =
        document.getElementById("saving-suggestions");

    let html = "";

    for (let i = 0; i < suggestions.length; i++) {
        const suggestion = suggestions[i];

        html += `
            <div class="suggestion-card">
                <div class="suggestion-header">

                    <div style="display:flex;gap:10px;align-items:center;">
                        <span style="font-size:24px;">
                            ${suggestion.icon}
                        </span>

                        <div class="suggestion-title">
                            ${suggestion.title}
                        </div>
                    </div>

                    <div class="save-badge">
                        Save ₹${suggestion.save.toLocaleString()}
                    </div>

                </div>

                <div class="suggestion-body">
                    ${suggestion.body}
                </div>
            </div>
        `;
    }

    if (html === "") {
        html =
            '<div class="empty-state"><span class="icon">🚀</span>Add more expenses to generate saving tips!</div>';
    }

    container.innerHTML = html;
}

function switchTab(name) {
    const panels = document.querySelectorAll(".tab-panel");
    const buttons = document.querySelectorAll(".tab-btn");

    for (let i = 0; i < panels.length; i++) {
        panels[i].classList.remove("active");
    }

    for (let i = 0; i < buttons.length; i++) {
        buttons[i].classList.remove("active");
    }

    document.getElementById("tab-" + name).classList.add("active");

    // event.target is the button that was clicked
    event.target.classList.add("active");

    if (name === "dashboard") {
        renderDashboard();
    }

    if (name === "patterns") {
        renderPatterns();
    }

    if (name === "waste") {
        renderWasteReport();
    }

    if (name === "savings") {
        renderSavings();
    }
}


function showToast(message) {
    const toast = document.getElementById("toast");

    toast.textContent = message;
    toast.classList.add("show");

    setTimeout(function() {
        toast.classList.remove("show");
    }, 2500);
}




function renderAll() {
    renderList();
    renderHeaderStats();
}


function getPastDate(daysAgo) {
    const date = new Date();

    date.setDate(date.getDate() - daysAgo);

    return date.toISOString().slice(0, 10);
}

function addDemoData() {
    if (expenses.length > 0) {
        return;
    }

    expenses = [
        {
            id: 1,
            desc: "Metro pass top-up",
            amount: 200,
            cat: "transport",
            date: getPastDate(1)
        },
        {
            id: 2,
            desc: "College canteen",
            amount: 80,
            cat: "food",
            date: getPastDate(2)
        },
        {
            id: 3,
            desc: "Ola cab",
            amount: 250,
            cat: "transport",
            date: getPastDate(7)
        },
        {
            id: 4,
            desc: "Dominos pizza",
            amount: 480,
            cat: "food",
            date: getPastDate(9)
        },
        {
            id: 5,
            desc: "New earphones",
            amount: 1499,
            cat: "shopping",
            date: getPastDate(10)
        },
        {
            id: 6,
            desc: "Medical checkup",
            amount: 200,
            cat: "health",
            date: getPastDate(12)
        },
        {
            id: 7,
            desc: "Mess fee partial",
            amount: 2000,
            cat: "food",
            date: getPastDate(14)
        },
        {
            id: 8,
            desc: "Books for sem",
            amount: 800,
            cat: "education",
            date: getPastDate(15)
        },
        {
            id: 9,
            desc: "Gym membership",
            amount: 700,
            cat: "health",
            date: getPastDate(18)
        },
        {
            id: 10,
            desc: "Auto rickshaw",
            amount: 100,
            cat: "transport",
            date: getPastDate(21)
        },
        {
            id: 11,
            desc: "Clothes shopping",
            amount: 1200,
            cat: "shopping",
            date: getPastDate(22)
        }
    ];

    saveExpenses();
}


document.getElementById("exp-date").value = getToday();

addDemoData();
renderAll();

