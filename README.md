# 🚀 Tagarise — Multi-Platform Username Checker

Tagarise helps you check if a username (handle) is **available or taken** across multiple platforms — quickly, reliably, and with a clean architecture.  

> **Motto:** *“Tag it. Rise with it.”*

---

## ✨ Features
- ⚡ **Multi-platform checks** — GitHub, Reddit, Medium, Behance, Dribbble (MVP).  
- 🛡 **Rate limiting** — prevents abuse & protects APIs.  
- 🔄 **Retry & timeout** — resilient against network hiccups.  
- 💾 **In-memory TTL cache** — faster repeat lookups.  
- ✅ **Validation** — input guarded with Zod schemas.  
- 📊 **Observability** — logs, response times, request summaries.  
- 🔌 **Adapter pattern** — each platform isolated, easy to extend.

---

## 📡 API Endpoints

### `GET /api/platforms`
Returns a list of supported platforms.  
```json
{ "platforms": ["github", "reddit", "medium", "behance", "dribbble"] }
```

### `GET /api/check`
Check availability for one or more platforms.  

**Query params:**  
- `username` *(required)*  
- `platforms` *(optional, comma-separated)*  

**Example:**  
```
/api/check?username=serlow&platforms=github,reddit
```

**Response:**  
```json
{
  "username": "serlow",
  "checkedAt": "2025-09-18T12:00:00.000Z",
  "results": [
    { "platform": "github", "status": "taken", "url": "https://github.com/serlow", "ms": 182 },
    { "platform": "reddit", "status": "free", "url": "https://reddit.com/user/serlow", "ms": 95 }
  ]
}
```

---

## 🛠 Installation & Usage

```bash
# clone the repo
git clone https://github.com/haloglu/tagarise.git
cd tagarise

# install dependencies
npm install

# copy env file
cp .env.example .env

# run in dev mode
npm run dev
```

Default server runs at:  
👉 `http://localhost:4000`

---

## 🗺 Roadmap
- [x] GitHub & Reddit adapters  
- [x] Medium, Behance, Dribbble adapters  
- [x] Rate-limit, cache, validation, concurrency  
- [ ] UI MVP (HTML client)  
- [ ] Hard adapters (Instagram, X, TikTok, YouTube) with headless/browser strategy  
- [ ] Deployment (Render/Fly/Zeabur free tier)  

---

## 📜 License
MIT — feel free to use & contribute.  

---

## 💡 Credits
Built with ❤️ using **Node.js + Express**.  
Architecture inspired by *adapter pattern, bulkhead isolation, and clean code principles*.
