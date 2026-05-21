import {
  useState,
  useEffect,
  useRef,
} from "react";

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

import {
  MathJax,
  MathJaxContext,
} from "better-react-mathjax";

import {
  useDropzone,
} from "react-dropzone";

export default function App() {

  const [question, setQuestion] =
    useState("");

  const [messages, setMessages] =
    useState([]);

  const [loading, setLoading] =
    useState(false);

  const [xp, setXp] = useState(0);

  const [image, setImage] =
    useState(null);

  const [tutorStyle, setTutorStyle] =
    useState("friendly");

  const [loggedIn, setLoggedIn] =
    useState(
      !!localStorage.getItem(
        "homeworkUser"
      )
    );

  const messagesEndRef = useRef(null);

  const {
    transcript,
    listening,
    resetTranscript,
  } = useSpeechRecognition();

  // DRAG DROP
  const {
    getRootProps,
    getInputProps,
  } = useDropzone({
    onDrop: (acceptedFiles) => {
      setImage(acceptedFiles[0]);
    },
  });

  // AUTO SCROLL
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages]);

  // LOAD SAVED DATA
  useEffect(() => {

    const user =
      localStorage.getItem(
        "homeworkUser"
      );

    const savedMessages =
      localStorage.getItem(
        `chatHistory_${user}`
      );

    const savedXP =
      localStorage.getItem(
        `xp_${user}`
      );

    if (savedMessages) {
      setMessages(
        JSON.parse(savedMessages)
      );
    }

    if (savedXP) {
      setXp(Number(savedXP));
    }

  }, []);

  // SAVE DATA
  useEffect(() => {

    const user =
      localStorage.getItem(
        "homeworkUser"
      );

    localStorage.setItem(
      `chatHistory_${user}`,
      JSON.stringify(messages)
    );

    localStorage.setItem(
      `xp_${user}`,
      xp
    );

  }, [messages, xp]);

  // SPEAK TEXT
  const speakText = (text) => {

    // STOP PREVIOUS VOICE
    window.speechSynthesis.cancel();

    const speech =
      new SpeechSynthesisUtterance(
        text
      );

    speech.rate = 1;

    window.speechSynthesis.speak(
      speech
    );
  };

  // STOP SPEAKING
  const stopSpeaking = () => {

    window.speechSynthesis.cancel();

  };

  // SEND MESSAGE
  const solveHomework = async () => {

    if (!question && !image)
      return;

    const userMessage = {
      type: "user",
      text: question,
    };

    setMessages((prev) => [
      ...prev,
      userMessage,
    ]);

    try {

      setLoading(true);

      const formData =
        new FormData();

      formData.append(
        "question",
        question
      );

      formData.append(
        "tutorStyle",
        tutorStyle
      );

      if (image) {
        formData.append(
          "image",
          image
        );
      }

      const res =
        await axios.post(
          "http://localhost:5000/ai/solve",
          formData
        );

      const aiMessage = {
        type: "ai",
        text: res.data.answer,
      };

      setMessages((prev) => [
        ...prev,
        aiMessage,
      ]);

      setXp((prev) => prev + 10);

    } catch (err) {

      console.log(err);

    }

    setQuestion("");
    setLoading(false);
    resetTranscript();
  };

  // CLEAR CHAT
  const clearChat = () => {

    setMessages([]);

    const user =
      localStorage.getItem(
        "homeworkUser"
      );

    localStorage.removeItem(
      `chatHistory_${user}`
    );
  };

  // LOGIN
  if (!loggedIn) {
    return (
      <Login
        setLoggedIn={
          setLoggedIn
        }
      />
    );
  }

  // ACHIEVEMENTS
  const achievements = [
    {
      name:
        "Homework Beginner",
      unlocked: xp >= 50,
    },
    {
      name:
        "Study Master",
      unlocked: xp >= 200,
    },
  ];

  return (
    <MathJaxContext>

      <div className="min-h-screen bg-black text-white overflow-hidden relative">

        {/* GLOWS */}
        <div className="absolute w-[500px] h-[500px] bg-blue-600 opacity-20 blur-3xl rounded-full top-[-100px] left-[-100px]" />

        <div className="absolute w-[400px] h-[400px] bg-purple-600 opacity-20 blur-3xl rounded-full bottom-[-100px] right-[-100px]" />

        {/* MAIN */}
        <div className="relative z-10 flex flex-col h-screen">

          {/* HEADER */}
          <div className="flex items-center justify-between p-5 border-b border-white/10 bg-black/30 backdrop-blur-lg">

            <div className="flex items-center gap-4">

              <div className="bg-blue-600 p-4 rounded-2xl">
                <FaRobot size={28} />
              </div>

              <div>

                <h1 className="text-3xl font-bold">
                  Homework AI
                </h1>

                <p className="text-slate-400 text-sm">
                  Learn step-by-step
                </p>

              </div>

            </div>

            {/* RIGHT */}
            <div className="flex items-center gap-4">

              <select
                value={tutorStyle}
                onChange={(e) =>
                  setTutorStyle(
                    e.target.value
                  )
                }
                className="bg-black/40 border border-white/10 rounded-xl p-2"
              >

                <option value="friendly">
                  Friendly
                </option>

                <option value="strict">
                  Strict
                </option>

                <option value="fun">
                  Fun
                </option>

              </select>

              <div className="bg-yellow-500 text-black px-4 py-2 rounded-xl font-bold">
                XP: {xp}
              </div>

              <button
                onClick={clearChat}
                className="bg-red-500 p-3 rounded-xl"
              >
                <FaTrash />
              </button>

            </div>

          </div>

          {/* ACHIEVEMENTS */}
          <div className="p-4 flex gap-4 overflow-x-auto">

            {achievements.map(
              (a, i) => (

                <div
                  key={i}
                  className={`px-4 py-2 rounded-xl ${
                    a.unlocked
                      ? "bg-green-500"
                      : "bg-slate-700"
                  }`}
                >
                  🏆 {a.name}
                </div>

              )
            )}

          </div>

          {/* CHAT */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">

            {messages.map(
              (msg, index) => (

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
                    msg.type ===
                    "user"
                      ? "justify-end"
                      : "justify-start"
                  }`}
                >

                  <div
                    className={`max-w-[85%] md:max-w-[70%] rounded-3xl p-5 shadow-lg ${
                      msg.type ===
                      "user"
                        ? "bg-blue-600"
                        : "bg-white/10 backdrop-blur-lg border border-white/10"
                    }`}
                  >

                    <div className="flex items-center gap-3 mb-3">

                      {msg.type ===
                      "user" ? (
                        <FaUser />
                      ) : (
                        <FaRobot />
                      )}

                      <span className="font-bold">
                        {msg.type ===
                        "user"
                          ? "You"
                          : "Homework AI"}
                      </span>

                    </div>

                    <MathJax>
                      {msg.type ===
                      "ai" ? (

                        <Typewriter
                          words={[
                            msg.text,
                          ]}
                          loop={1}
                          cursor
                          typeSpeed={
                            15
                          }
                        />

                      ) : (

                        <ReactMarkdown>
                          {msg.text}
                        </ReactMarkdown>

                      )}
                    </MathJax>

                    {msg.type ===
                      "ai" && (

                      <div className="flex gap-3 mt-4">

                        {/* SPEAK */}
                        <button
                          onClick={() =>
                            speakText(
                              msg.text
                            )
                          }
                          className="bg-slate-700 hover:bg-slate-600 px-4 py-2 rounded-xl flex items-center gap-2"
                        >

                          <FaVolumeUp />

                          Speak

                        </button>

                        {/* STOP */}
                        <button
                          onClick={
                            stopSpeaking
                          }
                          className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded-xl flex items-center gap-2"
                        >

                          <FaStop />

                          Stop

                        </button>

                      </div>

                    )}

                  </div>

                </motion.div>

              )
            )}

            {/* LOADING */}
            {loading && (

              <div className="flex gap-2">

                <div className="w-3 h-3 bg-white rounded-full animate-bounce" />

                <div className="w-3 h-3 bg-white rounded-full animate-bounce delay-100" />

                <div className="w-3 h-3 bg-white rounded-full animate-bounce delay-200" />

              </div>

            )}

            <div ref={messagesEndRef} />

          </div>

          {/* INPUT */}
          <div className="p-5 border-t border-white/10 bg-black/30 backdrop-blur-lg">

            {/* DROPZONE */}
            <div
              {...getRootProps()}
              className="border-2 border-dashed border-white/20 rounded-2xl p-6 mb-4 cursor-pointer text-center"
            >

              <input
                {...getInputProps()}
              />

              <p>
                📸 Drag homework
                image here
              </p>

            </div>

            {image && (

              <img
                src={URL.createObjectURL(
                  image
                )}
                alt="preview"
                className="w-40 rounded-2xl mb-4"
              />

            )}

            {/* INPUT AREA */}
            <div className="flex gap-4">

              <textarea
                value={
                  transcript ||
                  question
                }
                onChange={(e) =>
                  setQuestion(
                    e.target.value
                  )
                }
                placeholder="Ask homework question..."
                className="flex-1 bg-white/10 border border-white/10 rounded-2xl p-4 outline-none resize-none h-20"
              />

              {/* MIC */}
              <button
                onClick={() =>
                  SpeechRecognition.startListening()
                }
                className={`px-5 rounded-2xl ${
                  listening
                    ? "bg-red-500"
                    : "bg-slate-700"
                }`}
              >
                🎤
              </button>

              {/* SEND */}
              <motion.button
                whileHover={{
                  scale: 1.05,
                }}
                whileTap={{
                  scale: 0.95,
                }}
                onClick={
                  solveHomework
                }
                className="bg-blue-600 hover:bg-blue-700 px-6 rounded-2xl text-2xl"
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