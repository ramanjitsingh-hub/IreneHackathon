"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Moon, Sun, Volume2, VolumeX, X, MessageCircle } from "lucide-react"
import {
  collection,
  addDoc,
  serverTimestamp,
  getDocs,
  query,
  orderBy,
  onSnapshot,
  doc,
  setDoc,
  getDoc,
} from "firebase/firestore"
import { db } from "@/firebase"
import EmotionalMap from "@/components/EmotionalMap"
import { v4 as uuidv4 } from "uuid"

const userId = uuidv4()

// Color themes
const colorThemes = [
  { name: "Default", from: "from-pink-200", to: "to-blue-300", button: "bg-pink-300" },
  { name: "Sunset", from: "from-orange-200", to: "to-pink-300", button: "bg-orange-300" },
  { name: "Ocean", from: "from-blue-200", to: "to-teal-300", button: "bg-blue-300" },
  { name: "Forest", from: "from-green-200", to: "to-emerald-300", button: "bg-green-300" },
]

// Quick reply options
const quickReplies = [
  "I'm feeling anxious",
  "I need motivation",
  "I'm having trouble sleeping",
  "I want to improve my mood",
]

export default function Home() {
  // States
  const [conversations, setConversations] = useState<any[]>([])
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null)
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([])
  const [inputMessage, setInputMessage] = useState("")
  const [dailyQuote, setDailyQuote] = useState("")
  const [isBreathing, setIsBreathing] = useState(false)
  const [breathingPhase, setBreathingPhase] = useState("")
  const [breathingTimer, setBreathingTimer] = useState(0)
  const [breathingCycles, setBreathingCycles] = useState(0)
  const [totalBreathingTime, setTotalBreathingTime] = useState(0)
  const [isMuted, setIsMuted] = useState(false)
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [currentTheme, setCurrentTheme] = useState(colorThemes[0])
  const [showThemes, setShowThemes] = useState(false)
  const [showAlert, setShowAlert] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const audioRef = useRef<HTMLAudioElement>(null)
  const [isThinking, setIsThinking] = useState(false)

  useEffect(() => {
    console.log("Firebase initialized:", db.app.options.projectId)
    console.log("Firebase Config:", {
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY?.substring(0, 5) + "*",
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    })
    fetchDailyQuote()
    fetchConversations()
  }, [])

  const storeUserData = async (userId: string, data: Record<string, any>) => {
    try {
      const userDocRef = doc(db, "userData", userId);
      await setDoc(userDocRef, data, { merge: true });
      console.log(`Stored user data for user ${userId}:`, data);
    } catch (error) {
      console.error("Error storing user data:", error);
    }
  };

  const getUserData = async (userId: string): Promise<Record<string, any> | null> => {
    try {
      const userDocRef = doc(db, "userData", userId);
      const userDoc = await getDoc(userDocRef);
      if (userDoc.exists()) {
        return userDoc.data();
      }
      return null;
    } catch (error) {
      console.error("Error retrieving user data:", error);
      return null;
    }
  };

  const fetchDailyQuote = async () => {
    try {
      const response = await fetch("/api/daily-quote")
      const data = await response.json()
      setDailyQuote(data.quote)
    } catch (error) {
      console.error("Error fetching daily quote:", error)
      setDailyQuote("Every day is a new beginning.")
    }
  }

  const fetchConversations = async () => {
    // Query conversations and order by createdAt timestamp in descending order
    const q = query(
      collection(db, "conversations"),
      orderBy("createdAt", "desc") // Changed to desc for newest first
    )
    const querySnapshot = await getDocs(q)
    const conversations = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }))
    setConversations(conversations)
    
    // Set the active conversation to the newest one if available
    if (conversations.length > 0) {
      setActiveConversationId(conversations[0].id)
    }
  }
  useEffect(() => {
    if (activeConversationId) {
      const q = query(collection(db, "conversations", activeConversationId, "messages"), orderBy("timestamp", "asc"))
      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const messages = querySnapshot.docs.map((doc) => {
          const data = doc.data()
          return {
            role: data.role as string,
            content: data.content as string,
          }
        })
        setMessages(messages)
      })
      return () => unsubscribe()
    }
  }, [activeConversationId])

  const createNewConversation = async () => {
    const newConversationRef = doc(collection(db, "conversations"))
    
    // Add timestamp when creating the conversation
    await setDoc(newConversationRef, {
      createdAt: serverTimestamp(),
    })
    
    // Update active conversation ID
    setActiveConversationId(newConversationRef.id)
    
    // Fetch all conversations to update the list
    await fetchConversations()
  }
  const analyzeTone = async (message: string): Promise<string> => {
    // Implement tone analysis logic (e.g., using an external API)
    // For now, we'll return a placeholder value
    return "neutral";
  };
  
  const detectProblems = async (message: string): Promise<string[]> => {
    // Implement problem detection logic (e.g., using an external API)
    // For now, we'll return a placeholder value
    return [];
  };

  const handleSendMessage = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!inputMessage.trim()) return;

  // Check for harmful text
  if (detectHarmfulText(inputMessage)) {
    setShowAlert(true); // Show alert pop-up
    await saveFlaggedMessage(userId, inputMessage); // Save flagged message
  }

  const userMessage = { role: "user", content: inputMessage };
  const newMessages = [...messages, userMessage];
  setMessages(newMessages);
  setInputMessage("");
  setIsLoading(true);
  setError(null);

  setIsThinking(true);
  const thinkingMessage = { role: "assistant", content: "Irene is thinking..." };
  setMessages([...newMessages, thinkingMessage]);

  try {
    const sentiment = await getSentiment(inputMessage);
    const botResponse = await getBotResponse(
      `The user's message has a "${sentiment}" sentiment. Respond appropriately. User: ${inputMessage}`,
      messages,
      userId,
    );

    if (botResponse) {
      const assistantMessage = { role: "assistant", content: botResponse };
      setMessages([...newMessages, assistantMessage]);

      if (activeConversationId) {
        await addDoc(collection(db, "conversations", activeConversationId, "messages"), {
          role: "user",
          content: inputMessage,
          timestamp: serverTimestamp(),
        });
        await addDoc(collection(db, "conversations", activeConversationId, "messages"), {
          role: "assistant",
          content: botResponse,
          timestamp: serverTimestamp(),
        });
      }
    }
  } catch (error) {
    console.error("Error processing message:", error);
    setError("I'm having trouble connecting. Please try again in a moment.");
  } finally {
    setIsLoading(false);
    setIsThinking(false);
  }
};

  const handleQuickReply = async (reply: string) => {
    const userMessage = { role: "user", content: reply }
    const newMessages = [...messages, userMessage]
    setMessages(newMessages)
    setIsLoading(true)
    setError(null)

    setIsThinking(true)
    const thinkingMessage = { role: "assistant", content: "Irene is thinking..." }
    setMessages([...newMessages, thinkingMessage])

    try {
      const sentiment = await getSentiment(reply)
      const botResponse = await getBotResponse(
        `The user's message has a "${sentiment}" sentiment. Respond appropriately. User: ${reply}`,
        messages,
        userId,
      )

      if (botResponse) {
        const assistantMessage = { role: "assistant", content: botResponse }
        setMessages([...newMessages, assistantMessage])

        if (activeConversationId) {
          await addDoc(collection(db, "conversations", activeConversationId, "messages"), {
            role: "user",
            content: reply,
            timestamp: serverTimestamp(),
          })
          await addDoc(collection(db, "conversations", activeConversationId, "messages"), {
            role: "assistant",
            content: botResponse,
            timestamp: serverTimestamp(),
          })
        }
      }
    } catch (error) {
      console.error("Error in handleQuickReply:", error)
      setError("I'm having trouble connecting. Please try again in a moment.")
    } finally {
      setIsLoading(false)
      setIsThinking(false)
    }
  }

  const getSentiment = async (message: string): Promise<string> => {
    try {
      const response = await fetch("https://bda6a3fc652c929291.gradio.live/api/predict", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Origin: window.location.origin,
        },
        body: JSON.stringify({ data: [message] }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`)
      }

      const data = await response.json()
      return data.data[0]
    } catch (error) {
      console.error("Error calling Gradio API:", error)
      return "neutral"
    }
  }

  const UserProfile = ({ userId }: { userId: string }) => {
  const [userData, setUserData] = useState<Record<string, any> | null>(null);

  useEffect(() => {
    const fetchUserData = async () => {
      const data = await getUserData(userId);
      setUserData(data);
    };
    fetchUserData();
  }, [userId]);

  if (!userData) return null;

  return (
    <div className="p-4 bg-white rounded-lg shadow-md">
      <h3 className="text-xl font-semibold mb-4">User Profile</h3>
      <p><strong>Name:</strong> {userData.name || "Not provided"}</p>
      <p><strong>Behavior:</strong> {userData.behavior || "Neutral"}</p>
      <p><strong>Tone:</strong> {userData.tone || "Neutral"}</p>
      <p><strong>Problems:</strong> {userData.problems?.join(", ") || "None mentioned"}</p>
    </div>
  );
};
  const getBotResponse = async (prompt: string, conversationHistory: any[], userId: string) => {
    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!apiKey) {
      setError("API key not configured");
      return null;
    }
  
    const userData = await getUserData(userId);
    const userName = userData?.name || "User";
    const userBehavior = userData?.behavior || "neutral";
    const userTone = userData?.tone || "neutral";
    const userProblems = userData?.problems || [];
  
    const history = conversationHistory
      .map((msg) => `${msg.role === "user" ? "User" : "Irene"}: ${msg.content}`)
      .join("\n");
  
    let constructedPrompt = `You are Irene, a mental health companion. Respond in a short, conversational, and empathetic tone, like a caring friend on WhatsApp. Keep it under 2-3 sentences. Be warm and lovely, but also provide actionable solutions to the user's problem. Here's the conversation history:\n${history}\n${prompt}`;
  
    if (userName) {
      constructedPrompt += `\nNote: The user's name is ${userName}.`;
    }
  
    if (userBehavior) {
      constructedPrompt += `\nThe user's recent behavior has been ${userBehavior}.`;
    }
  
    if (userTone) {
      constructedPrompt += `\nThe user's tone is ${userTone}.`;
    }
  
    if (userProblems.length > 0) {
      constructedPrompt += `\nThe user has mentioned the following problems: ${userProblems.join(", ")}.`;
    }
  
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: constructedPrompt,
                  },
                ],
              },
            ],
          }),
        },
      );
  
      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }
  
      const data = await response.json();
      return data.candidates[0].content.parts[0].text;
    } catch (err) {
      console.error("API Error:", err);
      setError("Oops! Something went wrong. Let's try again.");
      return null;
    }
  };
  const renderMessages = () => {
    return (
      <div className="flex-grow overflow-y-auto p-6 space-y-4 scrollbar-thin scrollbar-thumb-indigo-500 scrollbar-track-transparent">
        {messages.map((message, index) => (
          <div key={index} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-xs md:max-w-md rounded-2xl p-3 ${
                message.role === "user"
                  ? `${isDarkMode ? "bg-indigo-600" : "bg-indigo-500"} text-white`
                  : `${isDarkMode ? "bg-gray-700" : "bg-gray-200"} ${isDarkMode ? "text-white" : "text-gray-800"}`
              }`}
            >
              {message.content}
            </div>
          </div>
        ))}
      </div>
    )
  }

  const HomePage: React.FC = () => {
    const [showAlert, setShowAlert] = useState(false);
  
    return (
      <div>
        {/* Existing code... */}
  
        {/* Alert Pop-Up */}
        <AnimatePresence>
          {showAlert && <AlertPopup onClose={() => setShowAlert(false)} />}
        </AnimatePresence>
      </div>
    );
  };

  const detectHarmfulText = (message: string): boolean => {
    const harmfulKeywords = [
      "suicide",
      "kill myself",
      "harm myself",
      "hurt myself",
      "end my life",
      "want to die",
      "self-harm",
      "abuse",
      "violence",
      "hate",
      "murder",
    ];
  
    // Check if the message contains any harmful keywords
    return harmfulKeywords.some((keyword) =>
      message.toLowerCase().includes(keyword)
    );
  };

  const AlertPopup = ({ onClose }: { onClose: () => void }) => {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.8 }}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      >
        <div className="bg-white p-8 rounded-3xl shadow-lg text-center">
          <h2 className="text-2xl font-bold text-red-500 mb-4">Important Notice</h2>
          <p className="text-lg mb-4">
            Please reach out for help. You are an amazing soul, and there are people who care about you.
          </p>
          <button
            onClick={onClose}
            className="bg-red-500 text-white px-4 py-2 rounded-full hover:bg-red-600 transition duration-300"
          >
            Close
          </button>
        </div>
      </motion.div>
    );
  };

  const saveFlaggedMessage = async (userId: string, message: string) => {
    try {
      const flaggedMessageRef = collection(db, "flaggedMessages");
      await addDoc(flaggedMessageRef, {
        userId,
        message,
        timestamp: serverTimestamp(),
      });
      console.log("Flagged message saved to Firestore.");
    } catch (error) {
      console.error("Error saving flagged message:", error);
    }
  };

  const startBreathing = () => {
    setIsBreathing(true)
    setBreathingCycles(0)
    setTotalBreathingTime(0)
    breathingCycle()
  }

  const breathingCycle = () => {
    setBreathingPhase("Inhale")
    setBreathingTimer(4)
    const inhaleInterval = setInterval(() => {
      setBreathingTimer((prev) => {
        if (prev > 1) return prev - 1
        clearInterval(inhaleInterval)
        holdBreath()
        return 0
      })
    }, 1000)
  }

  const holdBreath = () => {
    setBreathingPhase("Hold")
    setBreathingTimer(7)
    const holdInterval = setInterval(() => {
      setBreathingTimer((prev) => {
        if (prev > 1) return prev - 1
        clearInterval(holdInterval)
        exhale()
        return 0
      })
    }, 1000)
  }

  const exhale = () => {
    setBreathingPhase("Exhale")
    setBreathingTimer(8)
    const exhaleInterval = setInterval(() => {
      setBreathingTimer((prev) => {
        if (prev > 1) return prev - 1
        clearInterval(exhaleInterval)
        setBreathingCycles((prev) => prev + 1)
        setTotalBreathingTime((prev) => prev + 19)
        if (isBreathing) breathingCycle()
        return 0
      })
    }, 1000)
  }

  const stopBreathing = () => {
    setIsBreathing(false)
    setBreathingPhase("")
    setBreathingTimer(0)
  }

  const toggleMute = () => {
    setIsMuted(!isMuted)
    if (audioRef.current) {
      audioRef.current.muted = !audioRef.current.muted
    }
  }

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode)
  }

  const changeTheme = (theme: (typeof colorThemes)[0]) => {
    setCurrentTheme(theme)
  }

  return (
    <div
      className={`min-h-screen flex flex-col ${
        isDarkMode ? "bg-gray-900 text-white" : `bg-gradient-to-br ${currentTheme.from} ${currentTheme.to}`
      }`}
    >
      <audio ref={audioRef} src="https://www.chosic.com/download-audio/27279/" loop autoPlay />

      <main className="flex-grow container mx-auto px-4 py-8 flex flex-col md:flex-row gap-8 items-center justify-center min-h-screen">
        {/* Left Section */}
        <div className="w-full md:w-1/3 space-y-6">
          <div className="text-center">
            <h1 className="text-6xl font-bold text-indigo-600 mb-2 font-['Comic_Sans_MS', 'Chalkboard_SE', 'sans-serif']">
              Irene
            </h1>
            <p className="text-2xl text-indigo-500 font-['Comic_Sans_MS', 'Chalkboard_SE', 'sans-serif']">
              Your Companion of Care
            </p>
          </div>
          <div
            className={`rounded-2xl p-6 shadow-lg ${isDarkMode ? "bg-gray-800 text-white" : "bg-white text-gray-800"}`}
          >
            <h3 className="text-xl font-semibold mb-2 text-indigo-500">Daily Vibe</h3>
            <p className="text-lg italic">{dailyQuote}</p>
            <span className="text-3xl mt-2 block">✨</span>
          </div>
          <div
            className={`rounded-2xl p-6 shadow-lg ${isDarkMode ? "bg-gray-800 text-white" : "bg-white text-gray-800"}`}
          >
            <h3 className="text-xl font-semibold mb-2 text-indigo-500">Breathe Easy</h3>
            {!isBreathing ? (
              <button
                onClick={startBreathing}
                className="bg-indigo-500 text-white px-4 py-2 rounded-full hover:bg-indigo-600 transition duration-300"
              >
                Start Breathing
              </button>
            ) : (
              <div className="text-center">
                <motion.div
                  animate={{
                    scale: breathingPhase === "Inhale" ? 1.2 : breathingPhase === "Exhale" ? 0.8 : 1,
                  }}
                  transition={{ duration: breathingPhase === "Hold" ? 7 : 4 }}
                  className="text-6xl mb-2"
                >
                  {breathingPhase === "Inhale" ? "🫁" : breathingPhase === "Exhale" ? "😮‍💨" : "😌"}
                </motion.div>
                <p className="text-lg font-medium">{breathingPhase}</p>
                <p className="text-2xl font-bold mt-2">{breathingTimer}</p>
                <p className="text-sm mt-2">Cycles: {breathingCycles}</p>
                <p className="text-sm">Total Time: {totalBreathingTime}s</p>
                <button
                  onClick={stopBreathing}
                  className="mt-4 bg-red-500 text-white px-4 py-2 rounded-full hover:bg-red-600 transition duration-300"
                >
                  Stop
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Middle Section - Chat */}
        <div className="w-full md:w-1/3">
          <div
            className={`rounded-3xl shadow-lg overflow-hidden ${isDarkMode ? "bg-gray-800" : "bg-white bg-opacity-70"}`}
          >
            <div className="h-[calc(100vh-200px)] flex flex-col">
              {renderMessages()}
              <div className="flex flex-wrap gap-2 mb-2 px-4">
                {quickReplies.map((reply, index) => (
                  <button
                    key={index}
                    onClick={() => handleQuickReply(reply)}
                    className="bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full text-sm hover:bg-indigo-200 transition duration-300"
                    disabled={isLoading}
                  >
                    {reply}
                  </button>
                ))}
              </div>
              <div className="p-4 border-t border-gray-200">
                <form onSubmit={handleSendMessage} className="flex rounded-full overflow-hidden shadow-lg">
                  <input
                    type="text"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    placeholder="Share your thoughts..."
                    className={`flex-grow p-3 focus:outline-none ${
                      isDarkMode ? "bg-gray-700 text-white" : "bg-gray-100 text-gray-800"
                    }`}
                  />
                  <button
                    type="submit"
                    className="bg-indigo-500 text-white px-6 py-3 hover:bg-indigo-600 transition duration-300"
                  >
                    Send
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>

        {/* Right Section - Conversation History */}
        <div className="w-full md:w-1/3 space-y-4">
          <button
            onClick={() => {
              createNewConversation()
              setMessages([])
            }}
            className="w-full px-4 py-2 rounded-full bg-green-500 text-white hover:bg-green-600 transition duration-300 flex items-center justify-center"
          >
            <MessageCircle className="mr-2" size={20} />
            New Chat
          </button>
          <div
            className={`rounded-2xl p-4 shadow-lg ${isDarkMode ? "bg-gray-800 text-white" : "bg-white text-gray-800"}`}
          >
            <h3 className="text-xl font-semibold mb-4 text-indigo-500">Conversation History</h3>
            <div className="space-y-2 max-h-[calc(100vh-300px)] overflow-y-auto">
  {conversations.map((conversation, index) => (
    <button
      key={conversation.id}
      onClick={() => {
        setActiveConversationId(conversation.id)
        const q = query(
          collection(db, "conversations", conversation.id, "messages"),
          orderBy("timestamp", "asc")
        )
        getDocs(q).then((querySnapshot) => {
          const messages = querySnapshot.docs.map((doc) => ({
            role: doc.data().role,
            content: doc.data().content,
          }))
          setMessages(messages)
        })
      }}
      className={`w-full px-4 py-2 rounded-full text-left ${
        activeConversationId === conversation.id
          ? "bg-indigo-500 text-white"
          : "bg-gray-200 text-gray-800 hover:bg-gray-300"
      }`}
    >
      Chat {conversations.length - index} {/* Updated to show newest as Chat 1 */}
    </button>
  ))}
</div>

          </div>
        </div>
      </main>

      {/* Controls */}
      <div className="fixed top-4 right-4 flex space-x-4">
        <div className="relative">
          <button
            onClick={() => setShowThemes(!showThemes)}
            className={`p-2 rounded-full ${
              isDarkMode ? "bg-gray-700 text-white" : "bg-white text-gray-800"
            } hover:bg-opacity-80 transition duration-300`}
          >
            <Sun size={24} />
          </button>
          {showThemes && (
            <div
              className={`absolute right-0 mt-2 p-2 rounded-lg shadow-lg ${isDarkMode ? "bg-gray-800" : "bg-white"}`}
            >
              {colorThemes.map((theme) => (
                <button
                  key={theme.name}
                  onClick={() => changeTheme(theme)}
                  className={`w-6 h-6 rounded-full ${theme.button} border-2 ${
                    currentTheme === theme ? "border-indigo-500" : "border-transparent"
                  } m-1`}
                  aria-label={`Set ${theme.name} theme`}
                />
              ))}
            </div>
          )}
        </div>
        <button
          onClick={toggleMute}
          className={`p-2 rounded-full ${
            isDarkMode ? "bg-gray-700 text-white" : "bg-white text-gray-800"
          } hover:bg-opacity-80 transition duration-300`}
        >
          {isMuted ? <VolumeX size={24} /> : <Volume2 size={24} />}
        </button>
        <button
          onClick={toggleDarkMode}
          className={`p-2 rounded-full ${
            isDarkMode ? "bg-gray-700 text-white" : "bg-white text-gray-800"
          } hover:bg-opacity-80 transition duration-300`}
        >
          {isDarkMode ? <Sun size={24} /> : <Moon size={24} />}
        </button>
      </div>

      {/* Breathing Exercise Overlay */}
      <AnimatePresence>
        {isBreathing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          >
            <div className={`p-8 rounded-3xl ${isDarkMode ? "bg-gray-800 text-white" : "bg-white text-gray-800"}`}>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-indigo-500">Breathe with Me</h2>
                <button
                  onClick={stopBreathing}
                  className="text-gray-500 hover:text-gray-700"
                  aria-label="Close breathing exercise"
                >
                  <X size={24} />
                </button>
              </div>
              <motion.div
                animate={{
                  scale: breathingPhase === "Inhale" ? 1.2 : breathingPhase === "Exhale" ? 0.8 : 1,
                }}
                transition={{ duration: breathingPhase === "Hold" ? 7 : 4 }}
                className="text-9xl text-center mb-4"
              >
                {breathingPhase === "Inhale" ? "🫁" : breathingPhase === "Exhale" ? "😮‍💨" : "😌"}
              </motion.div>
              <p className="text-2xl font-medium text-center mb-2">{breathingPhase}</p>
              <p className="text-4xl font-bold text-center mb-4">{breathingTimer}</p>
              <div className="text-center">
                <p className="text-lg">Cycles completed: {breathingCycles}</p>
                <p className="text-lg">Total time: {totalBreathingTime}s</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Alert Overlay */}
      <AnimatePresence>
        {showAlert && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          >
            <div className={`p-8 rounded-3xl ${isDarkMode ? "bg-gray-800 text-white" : "bg-white text-gray-800"}`}>
              <h2 className="text-2xl font-bold text-red-500 mb-4">Alert!</h2>
              <p className="text-lg mb-4">
                You need help and we have sent your info to the nearest help provider. Please be safe, you matter.
              </p>
              <button
                onClick={() => setShowAlert(false)}
                className="bg-red-500 text-white px-4 py-2 rounded-full hover:bg-red-600 transition duration-300"
              >
                Close
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

