# 💰 Finance Dashboard

A simple, aesthetic personal finance dashboard built with Python (Flask) + HTML/CSS/JS.

## Features

- Track daily expenses by category
- Set and monitor a monthly budget
- Doughnut chart breakdown by category
- Dark glassmorphism UI with smooth animations
- All data stored locally in `data.json`

## Tech Stack

| Layer    | Tech                  |
|----------|-----------------------|
| Backend  | Python + Flask        |
| Frontend | HTML, CSS, JavaScript |
| Charts   | Chart.js              |
| Storage  | JSON (local file)     |

## Getting Started

```bash
# 1. Clone the repo
git clone https://github.com/YOUR_USERNAME/YOUR_REPO.git
cd YOUR_REPO

# 2. Install dependencies
pip install -r requirements.txt

# 3. Run
python app.py
```

Open `http://localhost:5000` in your browser.

## Keyboard Shortcuts

| Key | Action        |
|-----|---------------|
| `N` | Add expense   |
| `Esc` | Close modal |

## Project Structure

```
├── app.py              # Flask backend
├── requirements.txt
├── templates/
│   └── index.html      # Main UI
└── static/
    ├── style.css
    └── script.js
```
