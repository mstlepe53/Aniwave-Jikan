# ANIWAVE – Local Development Setup

## Prerequisites
- **Node.js v20 or v22** (check: `node --version`)
- **MongoDB** running locally

---

## Step 1 — Install MongoDB (if not installed)

**Windows:**
Download and install from https://www.mongodb.com/try/download/community
After install, MongoDB runs as a Windows service automatically.
To check: open Services app → look for "MongoDB Server"
Or run: `net start MongoDB`

**Mac (Homebrew):**
```
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community
```

**Linux:**
```
sudo systemctl start mongod
sudo systemctl enable mongod
```

---

## Step 2 — Configure environment

Copy the example env file and set your JWT secret:
```
copy .env.example .env    # Windows
cp .env.example .env      # Mac/Linux
```

Edit `.env` and set a JWT_SECRET (any long random string):
```
JWT_SECRET=my_super_secret_key_at_least_32_chars_long
```

Leave `MONGODB_URI` commented out — the app will auto-connect to `mongodb://127.0.0.1:27017/animevault`.

---

## Step 3 — Install dependencies and run

```
npm install
npm run dev
```

Open http://localhost:5000 in your browser.

---

## Troubleshooting

**"tsx must be loaded with --import"** → You're on Node v20+. This is fixed in this version.

**MongoDB connection error** → Make sure MongoDB is running:
- Windows: `net start MongoDB`
- Mac: `brew services start mongodb-community`
- Linux: `sudo systemctl start mongod`

**Port already in use** → The app will automatically try port 3000 if 5000 is busy.
