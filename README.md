# 📄 DocuMind – AI-Powered PDF Chat Application

DocuMind is a full-stack AI application that allows users to upload PDF documents and interact with them through a conversational interface. It uses semantic search and LLMs to provide accurate, context-aware answers from documents.

---

## 🚀 Features

* 📤 Upload and process PDF documents
* 🔍 Semantic search using embeddings
* 💬 Chat with documents using AI
* ⚡ Real-time upload progress (SSE)
* 🧠 Context-aware responses using chunk retrieval
* 🌙 Light/Dark mode support
* 🔐 Secure authentication with Supabase
* 💾 Persistent chat per document (localStorage)

---

## 🧠 How It Works

1. User uploads a PDF
2. Backend:

   * Extracts text
   * Splits into chunks
   * Generates embeddings
   * Stores in database
3. User asks a question
4. Backend:

   * Converts question to embedding
   * Finds relevant chunks (vector search)
   * Sends context + question to LLM
5. AI returns an answer based on document context

---

## 🏗️ Tech Stack

### Frontend

* React (Vite)
* CSS Modules
* Supabase Auth

### Backend

* Node.js + Express
* Supabase (DB + Storage + RPC)
* Groq API (LLM)
* Transformers.js (Embeddings)

---

## 📂 Project Structure

```
client/
  ├── components/
  ├── pages/
  ├── lib/
  └── context/

server/
  ├── routes/
  ├── services/
```

---

## ⚙️ Environment Variables

### Frontend (.env)

```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
VITE_API_URL=https://your-backend-url
```

### Backend (.env)

```
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_key
GROQ_API_KEY=your_groq_api_key
```

---

## ▶️ Running Locally

### 1. Clone the repo

```
git clone https://github.com/your-username/documind.git
cd documind
```

### 2. Start backend

```
cd server
npm install
npm run dev
```

### 3. Start frontend

```
cd client
npm install
npm run dev
```

---

## 🌐 Deployment

* Frontend: Netlify
* Backend: Railway

Make sure to configure environment variables properly.

---

## ⚠️ Known Limitations

* Token limits may restrict large document queries
* Chat history stored in localStorage (not synced across devices)
* SSE progress endpoint does not use authentication headers

---

## 🚀 Future Improvements

* 🧠 Add conversational memory (multi-turn context)
* 💾 Store chat history in database
* ⚡ Streaming responses (like ChatGPT)
* 📊 Better chunk ranking & summarization
* 🔄 Retry handling for rate limits

---

## 🧠 Key Concepts Used

* Semantic Search
* Vector Embeddings
* Retrieval-Augmented Generation (RAG)
* Server-Sent Events (SSE)
* Full-stack API integration

---

## 👨‍💻 Author

**Sai Vikas**

* GitHub: https://github.com/saivikas499
* LinkedIn: https://linkedin.com/in/saivikasbolloju

---

## ⭐ If you like this project

Give it a star ⭐ and feel free to contribute!
