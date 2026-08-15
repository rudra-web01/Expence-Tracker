# 💸 SpendSmart — Student Expense Analyzer

SpendSmart is a student-focused expense tracking web application that helps users record, analyze, and understand their spending habits.

The application provides spending analytics, category-wise breakdowns, spending patterns, waste detection, and personalized saving suggestions.

---

## 🚀 Features

### ➕ Add & Track Expenses

- Add expenses with:
  - Description
  - Amount
  - Category
  - Date
- Categorize expenses into Food, Transport, Entertainment, Education, Health, Shopping, Rent, and Other.
- Filter expenses by category.
- Filter expenses by time period:
  - All Time
  - This Week
  - This Month
- Delete expenses when required.

### 📊 Dashboard

- Monthly spending summary
- Total number of expenses
- Top spending category
- Daily average spending
- Highest spending day
- Category-wise spending breakdown
- Category-based spending insights
- Interactive spending chart

### 📈 Spending Patterns

- Daily spending trend for the last 30 days
- Weekly spending analysis
- Day-of-week spending pattern
- Category-wise spending visualization

### 🔥 Waste Report

- Identifies categories where spending is relatively high.
- Highlights potentially unnecessary spending.
- Provides simple suggestions to help reduce expenses.

### 💰 Savings Suggestions

- Generates saving suggestions based on spending patterns.
- Estimates potential monthly savings.
- Calculates a savings score based on spending behavior.

### 💾 Data Storage

- Uses browser `localStorage` to save expenses.
- Data remains available after refreshing the page.
- No backend or database is required.

---

## 🛠️ Tech Stack

- **HTML5** — Website structure
- **CSS3** — Styling and responsive layout
- **JavaScript (Vanilla JS)** — Application logic and data handling
- **Chart.js** — Interactive charts and data visualization
- **LocalStorage** — Client-side expense data storage

---

## 📂 Project Structure

```text
SpendSmart/
│
├── index.html      # Main application structure
├── style.css       # Styling and responsive design
└── script.js       # Expense logic, analytics and charts
