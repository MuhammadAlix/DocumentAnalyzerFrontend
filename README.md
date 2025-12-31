# 💻 AI Document Analyzer (Frontend)

A modern, responsive React application built with **Vite** and **TailwindCSS**. This frontend provides a sleek interface for users to chat with their documents, view real-time AI streaming, and listen to neural text-to-speech audio.

![React](https://img.shields.io/badge/React-v18-blue)
![Vite](https://img.shields.io/badge/Vite-Fast-yellow)
![TailwindCSS](https://img.shields.io/badge/Tailwind-CSS-cyan)

## ✨ Key Features

* **Real-Time Streaming UI:** Displays AI responses character-by-character as they arrive from the backend.
* **Multimodal File Upload:** Drag-and-drop support for PDFs, Images, and Videos for analysis.
* **Interactive Chat Interface:**
    * **RAG Toggle:** Switch between "Context Only" (Strict) and "General Knowledge" (Hybrid) modes.
    * **Voice Control:** Record voice questions using the built-in microphone integration.
    * **Voice Selection:** Choose from multiple neural voices for audio playback.
* **Smart Audio Player:** Custom-built audio controls for playing back generated summaries and responses.
* **Chat History:** Sidebar navigation to browse and load previous document conversations.
* **Responsive Design:** Fully optimized for desktop and mobile layouts using TailwindCSS.

## 🛠️ Tech Stack

* **Framework:** React (v18)
* **Build Tool:** Vite
* **Styling:** TailwindCSS
* **Icons:** Lucide React
* **HTTP Client:** Native Fetch API
* **State Management:** React Hooks (`useState`, `useRef`, `useLayoutEffect`)

---

## 🚀 Getting Started

### Prerequisites

* **Node.js** (v18 or higher)
* **Backend Server** running on port `5000` (refer to the Backend repo).

### 1. Clone & Install

```bash
git clone https://github.com/MuhammadAlix/DocumentAnalyzerFrontend.git
cd DocumentAnalyzerFrontend
npm install
```

### 2. Configuration

By default, the application is configured to connect to `http://localhost:5000`. If you need to change this, look for the API fetch calls (or `API_URL` constant) in `src/ChatInterface.jsx` and `src/App.jsx`.

### 3. Run Development Server

```bash
npm run dev
```

The application will start at `http://localhost:5173`.

---

## 📂 Project Structure

```
client/
├── public/              # Static assets
├── src/
│   ├── components/      # Reusable UI components
│   ├── App.jsx          # Main routing & layout logic
│   ├── ChatInterface.jsx # Core chat logic (Streaming, Audio, RAG)
│   ├── main.jsx         # Entry point
│   └── index.css        # Tailwind directives
├── index.html
├── tailwind.config.js
└── vite.config.js
```

## 🔌 API Integration Details

This frontend communicates with the backend via the following key integrations:

* Streaming: Uses `ReadableStream` decoding to handle chunked text responses from `/api/chat`.

* Audio Polling: Asynchronously checks `/api/audio/:id` to play voice chunks as they become available.

* Authentication: Stores JWT tokens in `localStorage` for secure session management.

## 📄 License

[MIT](https://choosealicense.com/licenses/mit/)