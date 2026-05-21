import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";

import {
  FaRobot,
  FaUser,
  FaPaperPlane,
  FaVolumeUp,
  FaTrash,
  FaStop,
} from "react-icons/fa";

import Login from "./Login";
import { Typewriter } from "react-simple-typewriter";

import SpeechRecognition, {
  useSpeechRecognition,
} from "react-speech-recognition";

import { MathJax, MathJaxContext } from "better-react-mathjax";
import { useDropzone } from "react-dropzone";

// IMPORTANT: keep /ai/solve at the end
const API_URL = "https://homework-ai-app-jgsw.onrender.com/ai/solve";

export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [xp, setXp] = useState(0);
  const [image, setImage] = useState(null);
  const [tutorStyle, setTutorStyle] = useState("friendly");

  const [loggedIn, setLoggedIn] = useState(
    !!localStorage.getItem("homeworkUser")
  );

  const messagesEndRef = useRef(null);

  const { transcript, listening, resetTranscript } =
    useSpeechRecognition();

  const { getRootProps, getInputProps } = useDropzone({
    accept: {
      "image/*": [],
      "application/pdf": [],
    },
    onDrop: (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        setImage(acceptedFiles[0]);
      }
    },
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages]);

  useEffect(() => {
    const user = localStorage.getItem("homeworkUser");

    if (!user) return;

    const savedMessages = localStorage.getItem(`chatHistory_${user}`);
    const savedXP = localStorage.getItem(`xp_${user}`);

    if (savedMessages) {
      setMessages(JSON.parse(savedMessages));
    }

    if (savedXP) {
      setXp(Number(savedXP));
    }
  }, []);

  useEffect(() => {
    const user = localStorage.getItem("homeworkUser");

    if (!user) return;

    localStorage.setItem(`chatHistory_${user}`, JSON.stringify(messages));
    localStorage.setItem(`xp_${user}`, xp.toString());
  }, [messages, xp]);

  const speakText = (text) => {
    window.speechSynthesis.cancel();

    const speech = new SpeechSynthesisUtterance(text);
    speech.rate = 1;

    window.speechSynthesis.speak(speech);
  };

  const stopSpeaking = () => {
    window.speechSynthesis.cancel();
  };

  const solveHomework = async () => {
    const finalQuestion = transcript || question;

    if (!finalQuestion && !image) return;

    const userMessage = {
      type: "user",
      text: finalQuestion || `Uploaded file: ${image?.name}`,
    };

    setMessages((prev) => [...prev, userMessage]);

    try {
      setLoading(true);

      const formData = new FormData();

      formData.append("question", finalQuestion);
      formData.append("tutorStyle", tutorStyle);

      if (image) {
        formData.append("image", image);
      }

      const res = await axios.post(API_URL, formData);

      const aiMessage = {
        type: "ai",
        text: res.data.answer || "No answer received.",
      };

      setMessages((prev) => [...prev, aiMessage]);
      setXp((prev) => prev + 10);
    } catch (err) {
      console.log(err);

      setMessages((prev) => [
        ...prev,
        {
          type: "ai",
          text:
            "Something went wrong. Check if your Render backend is live and your API URL is correct.",
        },
      ]);
    }

    setQuestion("");
    setImage(null);
    setLoading(false);
    resetTranscript();
  };

  const clearChat = () => {
    setMessages([]);

    const user = localStorage.getItem("homeworkUser");

    if (user) {
      localStorage.removeItem(`chatHistory_${user}`);
    }
  };

  const logout = () => {
    window.speechSynthesis.cancel();
    localStorage.removeItem("homeworkUser");
    setLoggedIn(false);
  };

  if (showSplash) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center overflow-hidden relative">
        <div className="absolute w-[500px] h-[500px] bg-blue-600 opacity-30 blur-3xl rounded-full animate-pulse" />
        <div className="absolute w-[350px] h-[350px] bg-purple-600 opacity-20 blur-3xl rounded-full bottom-10 right-10 animate-pulse" />

        <motion.div
          initial={{ opacity: 0, scale: 0.7, y: 40 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="relative z-10 text-center"
        >
          <motion.div
            animate={{
              rotate: 360,
            }}
            transition={{
              repeat: Infinity,
              duration: 2,
              ease: "linear",
            }}
            className="mx-auto mb-6 w-24 h-24 rounded-3xl bg-blue-600 flex items-center justify-center shadow-2xl"
          >
            <FaRobot size={45} />
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-5xl font-bold"
          >
            Homework AI
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="text-slate-400 mt-3 text-lg"
          >
            Preparing your AI tutor...
          </motion.p>

          <div className="flex justify-center gap-2 mt-8">
            <div className="w-3 h-3 bg-white rounded-full animate-bounce" />
            <div className="w-3 h-3 bg-white rounded-full animate-bounce delay-100" />
            <div className="w-3 h-3 bg-white rounded-full animate-bounce delay-200" />
          </div>
        </motion.div>
      </div>
    );
  }

  if (!loggedIn) {
    return <Login setLoggedIn={setLoggedIn} />;
  }

  const achievements = [
    {
      name: "Homework Beginner",
      unlocked: xp >= 50,
    },
    {
      name: "Study Master",
      unlocked: xp >= 200,
    },
    {
      name: "AI Legend",
      unlocked: xp >= 500,
    },
  ];

  return (
    <MathJaxContext>
      <div className="min-h-screen bg-black text-white overflow-hidden relative">
        <div className="absolute w-[500px] h-[500px] bg-blue-600 opacity-20 blur-3xl rounded-full top-[-100px] left-[-100px]" />
        <div className="absolute w-[400px] h-[400px] bg-purple-600 opacity-20 blur-3xl rounded-full bottom-[-100px] right-[-100px]" />

        <div className="relative z-10 flex flex-col h-screen">
          <div className="flex items-center justify-between p-5 border-b border-white/10 bg-black/30 backdrop-blur-lg">
            <div className="flex items-center gap-4">
              <div className="bg-blue-600 p-4 rounded-2xl">
                <FaRobot size={28} />
              </div>

              <div>
                <h1 className="text-3xl font-bold">Homework AI</h1>
                <p className="text-slate-400 text-sm">
                  Learn step-by-step
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <select
                value={tutorStyle}
                onChange={(e) => setTutorStyle(e.target.value)}
                className="bg-black/40 border border-white/10 rounded-xl p-2"
              >
                <option value="friendly">Friendly</option>
                <option value="strict">Strict</option>
                <option value="fun">Fun</option>
                <option value="exam">Exam Coach</option>
                <option value="simple">Explain Simply</option>
              </select>

              <div className="bg-yellow-500 text-black px-4 py-2 rounded-xl font-bold">
                XP: {xp}
              </div>

              <button
                onClick={clearChat}
                className="bg-red-500 hover:bg-red-600 p-3 rounded-xl"
              >
                <FaTrash />
              </button>

              <button
                onClick={logout}
                className="bg-slate-700 hover:bg-slate-600 px-4 py-3 rounded-xl font-bold"
              >
                Logout
              </button>
            </div>
          </div>

          <div className="p-4 flex gap-4 overflow-x-auto">
            {achievements.map((a, i) => (
              <div
                key={i}
                className={`px-4 py-2 rounded-xl whitespace-nowrap ${
                  a.unlocked ? "bg-green-500" : "bg-slate-700"
                }`}
              >
                🏆 {a.name}
              </div>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {messages.length === 0 && (
              <div className="text-center text-slate-400 mt-20">
                <h2 className="text-3xl font-bold mb-3 text-white">
                  Ask your first homework question
                </h2>
                <p>Type a question, use the mic, or upload homework.</p>
              </div>
            )}

            {messages.map((msg, index) => (
              <motion.div
                key={index}
                initial={{
                  opacity: 0,
                  y: 20,
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                }}
                className={`flex ${
                  msg.type === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[85%] md:max-w-[70%] rounded-3xl p-5 shadow-lg ${
                    msg.type === "user"
                      ? "bg-blue-600"
                      : "bg-white/10 backdrop-blur-lg border border-white/10"
                  }`}
                >
                  <div className="flex items-center gap-3 mb-3">
                    {msg.type === "user" ? <FaUser /> : <FaRobot />}

                    <span className="font-bold">
                      {msg.type === "user" ? "You" : "Homework AI"}
                    </span>
                  </div>

                  <MathJax>
                    {msg.type === "ai" ? (
                      <div className="prose prose-invert max-w-none">
                        <Typewriter
                          words={[msg.text]}
                          loop={1}
                          cursor
                          typeSpeed={10}
                        />
                      </div>
                    ) : (
                      <ReactMarkdown>{msg.text}</ReactMarkdown>
                    )}
                  </MathJax>

                  {msg.type === "ai" && (
                    <div className="flex gap-3 mt-4">
                      <button
                        onClick={() => speakText(msg.text)}
                        className="bg-slate-700 hover:bg-slate-600 px-4 py-2 rounded-xl flex items-center gap-2"
                      >
                        <FaVolumeUp />
                        Speak
                      </button>

                      <button
                        onClick={stopSpeaking}
                        className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded-xl flex items-center gap-2"
                      >
                        <FaStop />
                        Stop
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}

            {loading && (
              <div className="flex gap-2">
                <div className="w-3 h-3 bg-white rounded-full animate-bounce" />
                <div className="w-3 h-3 bg-white rounded-full animate-bounce delay-100" />
                <div className="w-3 h-3 bg-white rounded-full animate-bounce delay-200" />
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          <div className="p-5 border-t border-white/10 bg-black/30 backdrop-blur-lg">
            <div
              {...getRootProps()}
              className="border-2 border-dashed border-white/20 rounded-2xl p-4 mb-4 cursor-pointer text-center hover:bg-white/5 transition"
            >
              <input {...getInputProps()} />

              <p>📸 Drag homework image/PDF here or click to upload</p>
            </div>

            {image && (
              <div className="mb-4 bg-white/10 rounded-2xl p-3 flex items-center gap-4">
                {image.type.startsWith("image/") && (
                  <img
                    src={URL.createObjectURL(image)}
                    alt="preview"
                    className="w-24 rounded-xl"
                  />
                )}

                <div>
                  <p className="font-bold">{image.name}</p>
                  <p className="text-slate-400 text-sm">
                    Ready to upload
                  </p>
                </div>

                <button
                  onClick={() => setImage(null)}
                  className="ml-auto bg-red-500 px-3 py-2 rounded-xl"
                >
                  Remove
                </button>
              </div>
            )}

            <div className="flex gap-4">
              <textarea
                value={transcript || question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Ask homework question..."
                className="flex-1 bg-white/10 border border-white/10 rounded-2xl p-4 outline-none resize-none h-20"
              />

              <button
                onClick={() =>
                  SpeechRecognition.startListening({
                    continuous: false,
                  })
                }
                className={`px-5 rounded-2xl ${
                  listening ? "bg-red-500" : "bg-slate-700"
                }`}
              >
                🎤
              </button>

              <motion.button
                whileHover={{
                  scale: 1.05,
                }}
                whileTap={{
                  scale: 0.95,
                }}
                onClick={solveHomework}
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 px-6 rounded-2xl text-2xl"
              >
                <FaPaperPlane />
              </motion.button>
            </div>
          </div>
        </div>
      </div>
    </MathJaxContext>
  );
}