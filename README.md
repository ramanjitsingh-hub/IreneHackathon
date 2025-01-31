# Irene: AI-Based Mental Health Assistant 🌟

Welcome to **Irene** – your AI-powered mental health companion! 🤖💬 Irene provides immediate emotional support, detects your emotions, and recommends helpful resources to improve your mental well-being. Whether you're feeling stressed, anxious, or just need someone to talk to, Irene is here for you 24/7. 🌈✨

## Table of Contents 📚
- [Brief Overview](#brief-overview)
- [System Architecture](#system-architecture)
- [Process Flow](#process-flow)
- [Tech Stack](#tech-stack)
- [How to Run the Project](#how-to-run-the-project)
- [Contributors](#contributors)
- [License](#license)

## Brief Overview 🌐

Mental health is a critical aspect of our lives, yet many people struggle to access immediate help. 😔 **Irene** bridges this gap by providing a chatbot that offers empathetic conversations, sentiment analysis to understand emotions, and resource recommendations tailored to individual needs. Whether you're looking for a listening ear or actionable advice, Irene has got your back! 💪

## System Architecture 🏗️

Let’s break down how Irene works under the hood! 🛠️

### 1. Frontend (Next.js) 🖥️
**Purpose:** The user interface where users interact with Irene.

**Features:**
- Chatbox for real-time conversations.
- Emotion feedback (emoji-based) based on sentiment analysis.
- Resource recommendations displayed in a clean, user-friendly format.

### 2. Backend (FastAPI) 🚀
**Purpose:** Handles logic, AI model integration, and database interactions.

**Features:**
- **Chat Endpoint:** Processes user messages and generates AI-based responses.
- **Sentiment Analysis Endpoint:** Detects emotions from user input.
- **Resource Endpoint:** Fetches relevant mental health resources based on user emotions.

### 3. AI Model (GPT API (Chatbot) and Fine-Tuned Bert-Based Model) 🧠
**Purpose:** Powers the chatbot and sentiment analysis.

**Features:**
- **Chatbot:** Generates empathetic and context-aware responses.
- **Sentiment Analysis:** Detects emotions like happiness, sadness, anxiety, etc.

### 4. Database (Firebase) 🔥
**Purpose:** Stores user chat history and mental health resources.

**Features:**
- **Chat History:** Logs user interactions for continuity.
- **Resources:** Stores curated mental health resources (e.g., hotlines, articles, videos).

### 5. Hosting & Deployment 🌍
- **Frontend:** Hosted on **Vercel**.
- **Backend:** Deployed on **Render**.
- **Database:** Managed by **Firebase**.

## Process Flow 🔄

1. **User Interaction 👤**
   - The user opens the Irene web app and starts typing a message in the chatbox.
2. **Frontend Request 📨**
   - The frontend sends the user's message to the backend via the `/chat` endpoint.
3. **Sentiment Analysis 🎭**
   - The backend processes the message to detect emotions using a sentiment analysis model.
4. **Chatbot Response 🤖**
   - The AI model generates a response based on the message and detected emotion.
5. **Resource Recommendation 📚**
   - The backend fetches relevant mental health resources based on the detected emotion.
6. **Frontend Display 🖥️**
   - The chatbot’s response, emotion feedback (emoji), and resources are displayed to the user.
7. **Database Update 🔄**
   - The user’s chat history and interaction details are stored in Firebase.

## Tech Stack 💻

| Component   | Technology |
|------------|-----------|
| Frontend   | Next.js, Tailwind CSS |
| Backend    | FastAPI (Python) |
| AI Model   | DistillBERT with Go-Emotions Dataset |
| Database   | Firebase |
| Hosting    | Vercel (Frontend) |

## How to Run the Project 🚀

### Clone the Repository:
```bash
git clone https://github.com/your-username/irene.git
cd irene
```

### Install Dependencies:

#### Frontend:
```bash
cd frontend
npm install
```

#### Backend:
```bash
cd backend
pip install -r requirements.txt
```

### Set Up Environment Variables:
Create a `.env` file in the `backend` directory and add your API keys:
```plaintext
OPENAI_API_KEY=your-openai-api-key
FIREBASE_CONFIG=your-firebase-config
```

### Run the Backend:
```bash
uvicorn main:app --reload
```

### Run the Frontend:
```bash
npm run dev
```

### Open the App:
Visit [http://localhost:3000](http://localhost:3000) in your browser to interact with Irene!

## Contributors 👩‍💻👨‍💻
- **Amulya**: Frontend
- **Ramanjit Singh**:  AI and Integration

## License 📜
This project is licensed under the **MIT License**. See the [LICENSE](LICENSE) file for details.

---

✨ We hope **Irene** makes a positive impact on mental well-being. If you love this project, consider giving it a ⭐ on GitHub! ✨
