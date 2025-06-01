# 💸 Personal Finance Tracker

It's a full-stack web app for tracking your finances. Easily manage income, expenses, and accounts — built with modern technologies like Next.js, Drizzle ORM, React Query, Zustand, and Tailwind CSS.

---

## 🚀 Features

- 📥 Add, edit, and delete transactions
- 🏦 Manage accounts
- 📅 Filter by date ranges
- ⚡ Fast and reliable using React Query
- 🔐 Zod for schema validation
- 🧠 Zustand for state management
- 🎨 Styled with Tailwind CSS

---

## 🛠 Tech Stack

- **Framework**: Next.js (App Router)
- **Database ORM**: Drizzle ORM
- **Validation**: Zod
- **Client State**: Zustand
- **Server State**: React Query
- **Styling**: Tailwind CSS

---

## 📂 Project Structure

.
├── app/ # Routes and layouts
├── components/ # Reusable UI components
├── features/ # Accounts, transactions, filters, etc.
├── db/ # Drizzle schema and migrations
├── lib/ # Utilities and configs
├── public/ # Static assets
└── styles/ # Tailwind config and globals

---

## 🧪 Getting Started

### 1. Clone the repo

```bash
git clone https://github.com/YOUR_USERNAME/financio.git
cd financio
2. Install dependencies
bash
Copy
Edit
npm install
3. Configure environment
Create a .env file:

ini
Copy
Edit
DATABASE_URL=your_database_url
4. Set up the database
bash
Copy
Edit
npx drizzle-kit push
5. Start the development server
bash
Copy
Edit
npm run dev
✅ Todo
 Add paywall and settings

🙋‍♀️ Author
Built with ❤️ by Christian
Inspired by personal need and powered by modern web tools.
