***

# 🟪 FinMate

*FinMate* is a modern, AI-powered personal finance management app built for everyday professionals, students, and families. Track your expenses, set and achieve savings goals, manage recurring costs, and grow your financial confidence—all in a sleek, secure, and intuitive platform.

***

## ✨ Key Features

### *🔐 Authentication & Onboarding*
- Sign up and login securely using Firebase Authentication.
- Cloud data persistence with Firestore for reliable data storage.
- Guided onboarding: Set your user role (Student/Professional/Housewife), income, and fixed monthly expenses.

### *📊 Dashboard*
- See an instant snapshot of your monthly finances: Income, overall and daily spending, savings, goals, emergency fund, and category breakdowns.
- Visual analytics for recent spending and active goals.
- Smart alerts if you exceed your daily spending limit or near important milestones.
- Export comprehensive financial reports in multiple formats:
  - Beautiful PDF reports with financial insights, trends, and recommendations
  - Structured tables showing transactions, goals, and emergency fund details
  - Visual charts and graphs embedded in PDF exports
  - CSV export for spreadsheet analysis
  - JSON data for external integrations

### *📝 Daily Expense Logging (Check-In)*
- Quickly log today's expenses, specifying category, amount, and description.
- Real-time progress against your set daily limit.
- Interactive pie charts visualize spending by category each day.
- Automatic categorization and field parsing using AI.
- Voice input support for hands-free expense logging.
- OCR support for scanning receipts and bills.

### *📒 Expenses & Analysis*
- Powerful filters by week, month, or full history.
- See vertical bar charts breaking down spending per category.
- Review and sort transactions in detail.
- AI Recommendations: Personalized insights for budgeting and saving better.
- End-of-day summaries with spending analysis.
- Real-time spending forecasts and trend analysis.

### *📅 Fixed Expenses & EMIs*
- Add, edit, and check off fixed monthly expenses (like rent, subscriptions, EMIs).
- Timeline tracking for EMIs/loans with progress bars and upcoming deadline alerts.
- Pie chart of fixed spending distribution.

### *🎯 Goals Management*
- Create, edit, and track financial goals (big purchase, vacation, etc.).
- Specify target amount, timeline, monthly contribution.
- View progress bars and bar charts comparing goal vs. saved amount.
- Contribution history and forecasts for when you’ll reach your goals.

### *🛡 Emergency Fund*
- Set a savings target and contribute/withdraw as needed.
- Track progress and view full transaction history.
- Recommendations to help you stay financially secure.

### *⚡ Smart, Modular UI*
- Fast navigation via the sidebar and top bar.
- Customized for dark mode & theming (purple and neutral design).
- Mobile responsive: Works across devices.

### *🧠 AI & Automation*
- AI-driven recommendations for improving savings and identifying spending leaks.
- Goal forecasts and alerts about financial behavior.

### *⚙ Profile & Settings*
- Edit your profile, update role/income, and manage recurring expenses.
- "Danger Zone": Secure, confirmed deletion of all user data.

***

## 🛠 Tech Stack

| Tool / Library       | Purpose                                     |
|----------------------|---------------------------------------------|
| Next.js              | App framework & routing                     |
| React & React Hooks  | UI logic, state, and rendering              |
| TypeScript           | Type safety, robustness                     |
| Tailwind CSS         | Fast, utility-based responsive styling      |
| shadcn/ui            | Headless UI primitives and custom components|
| Firebase Auth        | User authentication & session management    |
| Firestore           | Cloud data persistence & real-time sync     |
| Recharts             | Data visualization (charts, graphs)         |
| date-fns             | Date parsing and formatting                 |
| react-hook-form      | Declarative, scalable form management       |
| zod                  | Type-safe form validation                   |
| lucide-react         | Modern, easily customizable icons           |
| jsPDF                | Advanced PDF report generation              |
| jspdf-autotable      | Structured PDF tables and layouts           |
| Tesseract.js         | OCR processing for receipt scanning         |
| Web Speech API       | Voice input for expense logging            |
| Custom hooks/utilities| Centralized business logic, classnames     |

***

## 🗂 Folder Structure

```
  src/
    app/             # Next.js pages and routing
    components/      # Shared UI primitives & custom components
    hooks/           # Project and utility React hooks
    lib/             # Firebase, types, utils
    styles/          # Tailwind config, global CSS
  public/            # Static assets (logo, images)
  .env.local         # Environment variables
```
***

## ⚡ Getting Started

### *1. Clone and Install*
bash
git clone https://github.com/Vino1705/Kart-i-quo.git
cd Kart-i-quo
npm install
# or
yarn install


### *2. Set up Firebase*
- Go to the [Firebase Console](https://console.firebase.google.com/), create a project, enable Email/Password authentication.
- Get your project’s config keys (API key, Auth domain, Project ID, App ID).

### *3. Configure Environment Variables*
Create a .env.local file at the repo root:

```bash
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_firebase_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_firebase_app_id

# Google AI Configuration
GEMINI_API_KEY=your_gemini_api_key
GOOGLE_PROJECT_ID=your_google_project_id
GOOGLE_CLOUD_PROJECT=your_google_cloud_project_id
```
### *4. Run the App*
bash
npm run dev
# or
yarn dev

View the app at [http://localhost:3000](http://localhost:3000)

***

## 🔒 Security & Best Practices

- All authentication via secure Firebase flows.
- Environment variables keep secrets out of source.
- TypeScript with strict schemas for safe, reliable data handling.
- Profile and expense data is never exposed to unauthorized users.

***

## 👨‍💻 Contributing

1. Fork this repo
2. Create a branch (git checkout -b amazing-feature)
3. Commit your changes and push your branch
4. Open a Pull Request!

***

## 🙋 FAQ

*Is this production ready?*  
This codebase provides robust, scalable foundations for both hackathons and real deployments. Harden for prod by enabling stricter build rules, more test coverage, persistent backend (e.g., Firestore), and real CI workflows.

*Can I add more AI features?*  
Yes! Modular hooks & component design make it easy to integrate external AI APIs for more personalized insights.

***

## 🏆 Credits

Made with 💜 by
- [Vino1705](https://github.com/Vino1705)
- [Ganesh-0509](https://github.com/Ganesh-0509)

***

## 📣 Thanks for using *FinMate*!

For bugs, ideas, and features—open a GitHub issue or pull request.

***

*Take control of your finances—set goals, log expenses, and start winning with FinMate!*
