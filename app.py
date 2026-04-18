from flask import Flask, render_template, request, jsonify
import json
import os
from datetime import datetime

app = Flask(__name__)
DATA_FILE = "data.json"

def load_data():
    if not os.path.exists(DATA_FILE):
        return {"budget": 5000, "expenses": []}
    with open(DATA_FILE) as f:
        return json.load(f)

def save_data(data):
    with open(DATA_FILE, "w") as f:
        json.dump(data, f, indent=2)

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/api/data")
def get_data():
    return jsonify(load_data())

@app.route("/api/expense", methods=["POST"])
def add_expense():
    data = load_data()
    body = request.json
    expense = {
        "id": int(datetime.now().timestamp() * 1000),
        "amount": float(body["amount"]),
        "category": body["category"],
        "note": body.get("note", ""),
        "date": datetime.now().strftime("%b %d, %Y")
    }
    data["expenses"].insert(0, expense)
    save_data(data)
    return jsonify(expense)

@app.route("/api/expense/<int:expense_id>", methods=["DELETE"])
def delete_expense(expense_id):
    data = load_data()
    data["expenses"] = [e for e in data["expenses"] if e["id"] != expense_id]
    save_data(data)
    return jsonify({"ok": True})

@app.route("/api/budget", methods=["POST"])
def set_budget():
    data = load_data()
    data["budget"] = float(request.json["budget"])
    save_data(data)
    return jsonify({"budget": data["budget"]})

if __name__ == "__main__":
    app.run(debug=True)
