```
# 🌍 Port Keyword Mapping Tool

## 📌 Project Description

The **Port Keyword Mapping Tool** helps convert vague, misspelled, or region-based keywords into accurate, verified **sea port names**. Built for global logistics operations, this tool integrates multi-layered backend logic with AI fallback (LLM) to ensure high confidence in keyword resolution, reducing ambiguity and manual lookup effort.
This system supports teams dealing with inconsistent input from clients or users and provides a scalable backend for integration into logistics platforms or internal dashboards.


## 🚀 Features

- ✅ **Multi-Layered Port Resolution Logic**
  - Exact match
  - Token match (country/region)
  - Fuzzy match (substring & Levenshtein)
  - LLM fallback (LLAMA3-70b-8192 Model From Groq Api)

- 🔍 **Confidence Flagging**
  - Tracks The Sources used Cascading or LLM
  - Associates it with a confidence scrore

- 📦 **Modular Architecture**
  - Easily extend logic layers or change backend behavior
  - Ready for integration into broader systems

- 🛠️ **Data Sanitization**
  - Pre-processing for port names to improve matching accuracy


### 🔍 Sample API Usage – `GET /search-ports`

Description:  
Search for ports based on a keyword (`q`) and optional type (`type`: `inland`, `sea`, `airport`, etc.).

**Example Request**:
```bash
curl -X GET "http://localhost:3000/search-ports?q=amritsar&type=inland" \
  -H "accept: application/json"
```

**Query Parameters**:
```
| Parameter | Type   | Required | Description             |
|-----------|--------|----------|-------------------------|
| `q`       | string | ✅       | Keyword to search       |
| `type`    | string | ❌       | Filter by port type     |
```

**Sample Response** (`200 OK`):
```
json
[
  {
    "port": {
      "id": "temp-1744010759388",
      "name": "amritsar",
      "display_name": "amritsar",
      "port_type": "inland",
      "lat_lon": { "lat": 0, "lon": 0 }
    },
    "verified": false,
    "match_score": 0
  }
]
```

## 📂 Project Structure

```
├── backend/
│   ├── routes/
│   ├── utils/
│   ├── services/
│   └── index.js
├── frontend/
│   ├── components/
│   └── App.js
├── database/
│   └── ports.json
├── Dockerfile
├── docker-compose.yml
└── README.md
```

## 🛠 Installation

### 🔧 Manual Setup

1. **Clone the repository**
```bash
git clone https://github.com/sujalbochkar-gocomet/port-mapping-tool.git
cd port-mapping-tool
```

2. **Install backend dependencies**
```bash
cd backend
npm install
```

3. **Install frontend dependencies**
```bash
cd ../frontend
npm install
```

4. **Start both servers**
```bash
# Backend
cd ../backend
npm run dev

# Frontend (in another terminal)
cd ../frontend
npm run dev
```

## 👨‍💻 Development

### Prerequisites
- Node.js
- npm
- MongoDB (local or cloud)

### Recommended Workflow

- Use `git checkout -b feature/your-feature` for features.
- Maintain modularity in `/utils` and `/services` for new logic layers.
- Add sample test keywords in `/backend/test.json` for quick checks.

---

## 📈 Future Improvements

- 🧹 **Database Automation**
  - Remove duplicate/invalid port entries
  - Auto-standardize inconsistent port names

- 🧱 **Migrate Backend to No-Code Tools**
  - Use platforms like Xano/Airtable for simple logic deployments

- 🧠 **Enhance LLM Integration**
  - Add prompt engineering and few-shot examples for better GPT output
  - Use GPT only for fallback or co-pilot refinemen

## 🧾 License

This project is licensed under the [MIT License](LICENSE).

```

Let me know if you want a version with project badges (Docker, React, Node.js, LLM) or want the markdown saved as a `.md` file for upload to GitHub.
