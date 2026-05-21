import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { motion, useMotionValue, useSpring } from "framer-motion";
import ReactMarkdown from "react-markdown";

import {
  FaBrain,
  FaUser,
  FaPaperPlane,
  FaVolumeUp,
  FaTrash,
  FaStop,
  FaCode,
  FaSmile,
  FaChalkboardTeacher,
  FaGamepad,
  FaGraduationCap,
  FaLightbulb,
  FaStar,
  FaRocket,
  FaBookOpen,
  FaMagic,
} from "react-icons/fa";

import Login from "./Login";
import { Typewriter } from "react-simple-typewriter";

import SpeechRecognition, {
  useSpeechRecognition,
} from "react-speech-recognition";

import { MathJax, MathJaxContext } from "better-react-mathjax";
import { useDropzone } from "react-dropzone";
import { supabase } from "./supabase";

const API_URL = "https://homework-ai-app-jgsw.onrender.com/ai/solve";

export default function App() {
  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined" && window.innerWidth < 768
  );

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

  const cursorX = useMotionValue(-100);
  const cursorY = useMotionValue(-100);

  const smoothX = useSpring(cursorX, {
    stiffness: 420,
    damping: 38,
  });

  const smoothY = useSpring(cursorY, {
    stiffness: 420,
    damping: 38,
  });

  const { transcript, listening, resetTranscript } = useSpeechRecognition();

  const tutorModes = [
    {
      id: "friendly",
      name: "Friendly",
      icon: <FaSmile />,
      gradient: "from-cyan-400 to-blue-600",
      desc: "Chill helper",
    },
    {
      id: "strict",
      name: "Strict",
      icon: <FaChalkboardTeacher />,
      gradient: "from-red-500 to-orange-500",
      desc: "Teacher mode",
    },
    {
      id: "fun",
      name: "Fun",
      icon: <FaGamepad />,
      gradient: "from-purple-500 to-pink-500",
      desc: "Fun examples",
    },
    {
      id: "exam",
      name: "Exam",
      icon: <FaGraduationCap />,
      gradient: "from-yellow-300 to-orange-500",
      desc: "Exam focus",
    },
    {
      id: "simple",
      name: "Simple",
      icon: <FaLightbulb />,
      gradient: "from-green-400 to-emerald-600",
      desc: "Easy words",
    },
  ];

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
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

  const getUserId = () => {
    return localStorage.getItem("homeworkUser") || "guest";
  };

  const loadFromSupabase = async () => {
    try {
      const username = getUserId();

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("username", username)
        .single();

      if (error && error.code !== "PGRST116") {
        console.log("Supabase load error:", error);
        loadFromLocalStorage();
        return;
      }

      if (data) {
        setMessages(data.messages || []);
        setXp(data.xp || 0);
        setTutorStyle(data.tutor_style || "friendly");
      } else {
        loadFromLocalStorage();
      }
    } catch (err) {
      console.log("Supabase load failed:", err);
      loadFromLocalStorage();
    }
  };

  const saveToSupabase = async (newMessages, newXP, newMode) => {
    try {
      const username = getUserId();

      const { error } = await supabase.from("profiles").upsert({
        username,
        messages: newMessages,
        xp: newXP,
        tutor_style: newMode,
        updated_at: new Date().toISOString(),
      });

      if (error) {
        console.log("Supabase save error:", error);
      }
    } catch (err) {
      console.log("Supabase save failed:", err);
    }
  };

  const loadFromLocalStorage = () => {
    const user = localStorage.getItem("homeworkUser");

    if (!user) return;

    const savedMessages = localStorage.getItem(`chatHistory_${user}`);
    const savedXP = localStorage.getItem(`xp_${user}`);
    const savedMode = localStorage.getItem(`mode_${user}`);

    if (savedMessages) setMessages(JSON.parse(savedMessages));
    if (savedXP) setXp(Number(savedXP));
    if (savedMode) setTutorStyle(savedMode);
  };

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, isMobile ? 1200 : 2800);

    return () => clearTimeout(timer);
  }, [isMobile]);

  useEffect(() => {
    if (isMobile) return;

    const moveCursor = (e) => {
      cursorX.set(e.clientX);
      cursorY.set(e.clientY);
    };

    window.addEventListener("mousemove", moveCursor);

    return () => window.removeEventListener("mousemove", moveCursor);
  }, [cursorX, cursorY, isMobile]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: isMobile ? "auto" : "smooth",
    });
  }, [messages, isMobile]);

  useEffect(() => {
    if (!loggedIn) return;

    loadFromSupabase();
  }, [loggedIn]);

  useEffect(() => {
    const user = localStorage.getItem("homeworkUser");

    if (!user) return;

    localStorage.setItem(`chatHistory_${user}`, JSON.stringify(messages));
    localStorage.setItem(`xp_${user}`, xp.toString());
    localStorage.setItem(`mode_${user}`, tutorStyle);

    saveToSupabase(messages, xp, tutorStyle);
  }, [messages, xp, tutorStyle]);

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

    const lowerQuestion = finalQuestion.toLowerCase();

    const creatorQuestions = [
      "who created you",
      "who made you",
      "who is your creator",
      "who built you",
      "who developed you",
      "who created this app",
      "who made this app",
      "who built this app",
      "who is the creator",
      "who owns you",
      "who is mithun",
      "your creator",
      "made by who",
      "built by who",
    ];

    const isCreatorQuestion = creatorQuestions.some((q) =>
      lowerQuestion.includes(q)
    );

    const userMessage = {
      type: "user",
      text: finalQuestion || `Uploaded file: ${image?.name}`,
    };

    setMessages((prev) => [...prev, userMessage]);

    if (isCreatorQuestion) {
      setMessages((prev) => [
        ...prev,
        {
          type: "ai",
          text:
            "# Creator\n\nI was created by **Mithun**.\n\nThis app was built by **Mithun** to help students learn homework step-by-step.",
        },
      ]);

      setXp((prev) => prev + 5);
      setQuestion("");
      setImage(null);
      resetTranscript();
      return;
    }

    try {
      setLoading(true);

      const formData = new FormData();

      formData.append("question", finalQuestion);
      formData.append("tutorStyle", tutorStyle);

      if (image) {
        formData.append("image", image);
      }

      const res = await axios.post(API_URL, formData);

      setMessages((prev) => [
        ...prev,
        {
          type: "ai",
          text: res.data.answer || "No answer received.",
        },
      ]);

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

  const clearChat = async () => {
    setMessages([]);

    const user = localStorage.getItem("homeworkUser");

    if (user) {
      localStorage.removeItem(`chatHistory_${user}`);
    }

    try {
      await saveToSupabase([], xp, tutorStyle);
    } catch (err) {
      console.log("Clear Supabase failed:", err);
    }
  };

  const logout = () => {
    window.speechSynthesis.cancel();
    localStorage.removeItem("homeworkUser");
    setLoggedIn(false);
  };

  const GlobalEffects = () => (
    <>
      <style>
        {`
          *::-webkit-scrollbar {
            width: 0px;
            height: 0px;
          }

          * {
            scrollbar-width: none;
            -ms-overflow-style: none;
          }

          html,
          body {
            overflow: hidden;
            background: black;
          }

          .app-height {
            height: 100vh;
            height: 100dvh;
          }

          .animated-grid {
            background-image:
              linear-gradient(rgba(255,255,255,0.035) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.035) 1px, transparent 1px);
            background-size: 46px 46px;
          }

          .text-glow {
            text-shadow:
              0 0 18px rgba(103,232,249,0.75),
              0 0 34px rgba(168,85,247,0.55),
              0 0 60px rgba(236,72,153,0.35);
          }

          @media (max-width: 768px) {
            .custom-cursor {
              display: none;
            }

            .desktop-only {
              display: none;
            }

            .mobile-soft-blur {
              filter: blur(32px);
            }
          }
        `}
      </style>

      {!isMobile && (
        <>
          <motion.div
            className="custom-cursor fixed top-0 left-0 w-10 h-10 rounded-full pointer-events-none z-[9999]"
            style={{
              x: smoothX,
              y: smoothY,
              translateX: "-50%",
              translateY: "-50%",
            }}
          >
            <motion.div
              animate={{
                scale: [1, 1.25, 1],
                opacity: [0.45, 0.2, 0.45],
              }}
              transition={{
                duration: 1.4,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="w-full h-full rounded-full border border-cyan-300/70 shadow-[0_0_30px_rgba(103,232,249,0.9)]"
            />
          </motion.div>

          <motion.div
            className="custom-cursor fixed top-0 left-0 w-2.5 h-2.5 rounded-full pointer-events-none z-[9999] bg-cyan-300 shadow-[0_0_20px_rgba(103,232,249,1)]"
            style={{
              x: cursorX,
              y: cursorY,
              translateX: "-50%",
              translateY: "-50%",
            }}
          />
        </>
      )}
    </>
  );

  const AnimatedBackground = () => (
    <>
      {!isMobile && (
        <motion.div
          animate={{
            backgroundPosition: ["0px 0px", "140px 140px"],
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: "linear",
          }}
          className="absolute inset-0 animated-grid opacity-25"
        />
      )}

      <motion.div
        animate={
          isMobile
            ? {}
            : {
                x: [0, 80, -50, 0],
                y: [0, -70, 40, 0],
                scale: [1, 1.25, 0.9, 1],
              }
        }
        transition={{
          duration: 9,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="mobile-soft-blur absolute w-[310px] h-[310px] md:w-[620px] md:h-[620px] bg-cyan-500 opacity-20 blur-3xl rounded-full top-[-120px] left-[-120px]"
      />

      <motion.div
        animate={
          isMobile
            ? {}
            : {
                x: [0, -70, 60, 0],
                y: [0, 60, -50, 0],
                scale: [1, 0.85, 1.2, 1],
              }
        }
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="mobile-soft-blur absolute w-[300px] h-[300px] md:w-[520px] md:h-[520px] bg-purple-600 opacity-20 blur-3xl rounded-full bottom-[-120px] right-[-120px]"
      />

      {!isMobile && (
        <>
          <motion.div
            animate={{
              rotate: 360,
            }}
            transition={{
              duration: 25,
              repeat: Infinity,
              ease: "linear",
            }}
            className="absolute top-1/2 left-1/2 w-[900px] h-[900px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-cyan-400/10"
          />

          <motion.div
            animate={{
              rotate: -360,
            }}
            transition={{
              duration: 34,
              repeat: Infinity,
              ease: "linear",
            }}
            className="absolute top-1/2 left-1/2 w-[650px] h-[650px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-purple-400/10"
          />

          {[...Array(16)].map((_, i) => (
            <motion.div
              key={i}
              animate={{
                opacity: [0, 1, 0],
                y: [40, -160],
                scale: [0.4, 1.2, 0.3],
              }}
              transition={{
                duration: 4 + (i % 5),
                repeat: Infinity,
                delay: i * 0.25,
              }}
              className="absolute w-1.5 h-1.5 bg-white/60 rounded-full"
              style={{
                left: `${5 + i * 6}%`,
                bottom: "10%",
              }}
            />
          ))}
        </>
      )}
    </>
  );

  if (showSplash) {
    return (
      <>
        <GlobalEffects />

        <div className="app-height bg-black text-white flex items-center justify-center overflow-hidden relative px-4">
          <AnimatedBackground />

          <motion.div
            initial={{
              opacity: 0,
              scale: 0.75,
              y: 60,
            }}
            animate={{
              opacity: 1,
              scale: 1,
              y: 0,
            }}
            transition={{
              duration: isMobile ? 0.45 : 0.9,
              ease: "easeOut",
            }}
            className="relative z-10 text-center bg-white/10 border border-white/10 backdrop-blur-xl rounded-[2rem] px-6 md:px-12 py-8 md:py-10 shadow-[0_0_90px_rgba(147,51,234,0.32)] w-full max-w-lg overflow-hidden"
          >
            {!isMobile && (
              <motion.div
                animate={{
                  x: ["-120%", "120%"],
                }}
                transition={{
                  duration: 2.4,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="absolute inset-y-0 w-1/2 bg-gradient-to-r from-transparent via-white/15 to-transparent skew-x-12"
              />
            )}

            <motion.div
              animate={
                isMobile
                  ? {}
                  : {
                      y: [0, -14, 0],
                      rotate: [0, 7, -7, 0],
                      scale: [1, 1.04, 1],
                    }
              }
              transition={{
                duration: 2.4,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="relative mx-auto mb-7 w-24 h-24 md:w-32 md:h-32 rounded-[2rem] bg-gradient-to-br from-cyan-400 via-blue-600 to-purple-700 flex items-center justify-center shadow-[0_0_70px_rgba(59,130,246,0.8)]"
            >
              <FaBrain size={50} />

              {!isMobile && (
                <>
                  <motion.div
                    animate={{
                      scale: [1, 1.55, 1],
                      opacity: [0.7, 0, 0.7],
                    }}
                    transition={{
                      duration: 1.9,
                      repeat: Infinity,
                    }}
                    className="absolute inset-0 rounded-[2rem] border-4 border-cyan-300"
                  />

                  <motion.div
                    animate={{
                      scale: [1, 2.1, 1],
                      opacity: [0.35, 0, 0.35],
                    }}
                    transition={{
                      duration: 2.6,
                      repeat: Infinity,
                    }}
                    className="absolute inset-0 rounded-[2rem] border-2 border-pink-300"
                  />
                </>
              )}
            </motion.div>

            <div className="flex justify-center gap-5 text-yellow-300 mb-5 text-xl md:text-2xl">
              {[FaBookOpen, FaStar, FaRocket, FaMagic].map((Icon, i) => (
                <motion.div
                  key={i}
                  animate={
                    isMobile
                      ? {}
                      : {
                          y: [0, -9, 0],
                          rotate: [0, 14, -14, 0],
                          scale: [1, 1.2, 1],
                        }
                  }
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    delay: i * 0.2,
                  }}
                  className="drop-shadow-[0_0_16px_rgba(253,224,71,1)]"
                >
                  <Icon />
                </motion.div>
              ))}
            </div>

            <motion.h1
              initial={{
                opacity: 0,
                y: 20,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              transition={{
                delay: 0.2,
              }}
              className="text-5xl md:text-7xl font-black bg-gradient-to-r from-cyan-300 via-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent text-glow"
            >
              Homework AI
            </motion.h1>

            <motion.p
              initial={{
                opacity: 0,
                y: 12,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              transition={{
                delay: 0.4,
              }}
              className="text-slate-200 mt-4 text-lg"
            >
              Made by Mithun
            </motion.p>

            <p className="text-slate-400 mt-2 text-sm">
              Loading your AI tutor...
            </p>

            <div className="flex justify-center gap-3 mt-7">
              <div className="w-3 h-3 bg-cyan-300 rounded-full animate-bounce" />
              <div className="w-3 h-3 bg-purple-400 rounded-full animate-bounce delay-100" />
              <div className="w-3 h-3 bg-pink-400 rounded-full animate-bounce delay-200" />
            </div>

            <div className="mt-8 w-full max-w-xs h-3 bg-white/10 rounded-full overflow-hidden mx-auto">
              <motion.div
                initial={{ width: "0%" }}
                animate={{ width: "100%" }}
                transition={{
                  duration: isMobile ? 1 : 2.2,
                }}
                className="h-full bg-gradient-to-r from-cyan-400 via-blue-500 via-purple-500 to-pink-500 rounded-full"
              />
            </div>
          </motion.div>
        </div>
      </>
    );
  }

  if (!loggedIn) {
    return (
      <>
        <GlobalEffects />
        <Login setLoggedIn={setLoggedIn} />
      </>
    );
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
      <GlobalEffects />

      <div className="app-height bg-black text-white overflow-hidden relative">
        <AnimatedBackground />

        <div className="relative z-10 flex flex-col app-height">
          <motion.div
            initial={{
              opacity: 0,
              y: -25,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            transition={{
              duration: isMobile ? 0.25 : 0.6,
            }}
            className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 p-3 md:p-5 border-b border-white/10 bg-black/30 backdrop-blur-lg"
          >
            <div className="flex items-center gap-3">
              <motion.div
                whileTap={{
                  scale: 0.92,
                }}
                whileHover={
                  isMobile
                    ? {}
                    : {
                        rotate: 10,
                        scale: 1.08,
                      }
                }
                className="bg-gradient-to-br from-cyan-500 to-blue-700 p-3 md:p-4 rounded-2xl shadow-[0_0_25px_rgba(37,99,235,0.6)]"
              >
                <FaBrain size={24} />
              </motion.div>

              <div>
                <h1 className="text-xl md:text-3xl font-bold">Homework AI</h1>

                <div className="flex items-center gap-2 text-slate-400 text-xs md:text-sm">
                  <FaCode />
                  <p>Made by Mithun</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap justify-center md:justify-end">
              <div className="bg-yellow-500 text-black px-3 md:px-4 py-2 rounded-xl font-bold text-sm md:text-base">
                XP: {xp}
              </div>

              <motion.button
                whileTap={{
                  scale: 0.92,
                }}
                whileHover={
                  isMobile
                    ? {}
                    : {
                        scale: 1.08,
                        rotate: 4,
                      }
                }
                onClick={clearChat}
                className="bg-red-500 hover:bg-red-600 p-3 rounded-xl"
              >
                <FaTrash />
              </motion.button>

              <motion.button
                whileTap={{
                  scale: 0.95,
                }}
                whileHover={
                  isMobile
                    ? {}
                    : {
                        scale: 1.05,
                        y: -2,
                      }
                }
                onClick={logout}
                className="bg-slate-700 hover:bg-slate-600 px-3 md:px-4 py-3 rounded-xl font-bold text-sm"
              >
                Logout
              </motion.button>
            </div>
          </motion.div>

          <div className="p-3 md:p-4 border-b border-white/5 bg-black/20">
            <p className="text-xs md:text-sm text-slate-400 mb-2 flex items-center gap-2">
              <FaBrain />
              Choose AI Mode
            </p>

            <div className="flex gap-3 md:gap-4 overflow-x-auto pb-1">
              {tutorModes.map((mode, index) => {
                const selected = tutorStyle === mode.id;

                return (
                  <motion.button
                    key={mode.id}
                    initial={{
                      opacity: 0,
                      y: 20,
                      scale: 0.9,
                    }}
                    animate={
                      selected && !isMobile
                        ? {
                            opacity: 1,
                            y: [0, -3, 0],
                            scale: 1,
                          }
                        : {
                            opacity: 1,
                            y: 0,
                            scale: 1,
                          }
                    }
                    transition={{
                      duration: isMobile ? 0.15 : 1.8,
                      repeat: selected && !isMobile ? Infinity : 0,
                      delay: isMobile ? 0 : index * 0.08,
                    }}
                    onClick={() => setTutorStyle(mode.id)}
                    whileTap={{
                      scale: 0.94,
                    }}
                    whileHover={
                      isMobile
                        ? {}
                        : {
                            scale: 1.05,
                            y: -3,
                          }
                    }
                    className={`min-w-[118px] md:min-w-[150px] p-3 md:p-4 rounded-2xl border relative overflow-hidden ${
                      selected
                        ? "border-white/40 bg-white/15"
                        : "border-white/10 bg-white/5 hover:bg-white/10"
                    }`}
                  >
                    <div
                      className={`absolute inset-0 bg-gradient-to-br ${
                        mode.gradient
                      } ${selected ? "opacity-30" : "opacity-10"}`}
                    />

                    {selected && !isMobile && (
                      <motion.div
                        layoutId="activeMode"
                        className="absolute inset-0 rounded-2xl border border-white/40 shadow-[0_0_25px_rgba(103,232,249,0.3)]"
                      />
                    )}

                    <div className="relative z-10">
                      <div className="text-xl md:text-2xl mb-1 md:mb-2">
                        {mode.icon}
                      </div>
                      <p className="font-bold text-sm md:text-base">
                        {mode.name}
                      </p>
                      <p className="text-[11px] md:text-xs text-slate-300">
                        {mode.desc}
                      </p>
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </div>

          <div className="px-3 md:px-4 py-2 md:py-3 flex gap-3 md:gap-4 overflow-x-auto">
            {achievements.map((a, i) => (
              <motion.div
                key={i}
                initial={{
                  opacity: 0,
                  scale: 0.9,
                }}
                animate={{
                  opacity: 1,
                  scale: 1,
                }}
                transition={{
                  delay: isMobile ? 0 : i * 0.08,
                }}
                className={`px-3 md:px-4 py-2 rounded-xl whitespace-nowrap text-xs md:text-base ${
                  a.unlocked
                    ? "bg-green-500 shadow-[0_0_14px_rgba(34,197,94,0.4)]"
                    : "bg-slate-700"
                }`}
              >
                🏆 {a.name}
              </motion.div>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto p-3 md:p-6 space-y-5">
            {messages.length === 0 && (
              <motion.div
                initial={{
                  opacity: 0,
                  y: 25,
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                }}
                className="text-center text-slate-400 mt-12 md:mt-20"
              >
                <motion.h2
                  animate={
                    isMobile
                      ? {}
                      : {
                          scale: [1, 1.025, 1],
                        }
                  }
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                  }}
                  className="text-2xl md:text-3xl font-bold mb-3 text-white"
                >
                  Ask your first homework question
                </motion.h2>
                <p className="text-sm md:text-base">
                  Type a question, use the mic, or upload homework.
                </p>
                <p className="mt-3 text-xs md:text-sm text-slate-500">
                  Made by Mithun
                </p>
              </motion.div>
            )}

            {messages.map((msg, index) => (
              <motion.div
                key={index}
                initial={{
                  opacity: 0,
                  y: isMobile ? 12 : 28,
                  scale: 0.96,
                  rotateX: isMobile ? 0 : 8,
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                  scale: 1,
                  rotateX: 0,
                }}
                transition={{
                  duration: isMobile ? 0.18 : 0.45,
                  type: "spring",
                  stiffness: 160,
                }}
                className={`flex ${
                  msg.type === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[94%] md:max-w-[70%] rounded-3xl p-4 md:p-5 shadow-lg text-sm md:text-base relative overflow-hidden ${
                    msg.type === "user"
                      ? "bg-blue-600 shadow-[0_0_18px_rgba(37,99,235,0.35)]"
                      : "bg-white/10 md:backdrop-blur-lg border border-white/10 shadow-[0_0_25px_rgba(147,197,253,0.12)]"
                  }`}
                >
                  {!isMobile && msg.type === "ai" && (
                    <motion.div
                      animate={{
                        x: ["-130%", "130%"],
                      }}
                      transition={{
                        duration: 3.5,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                      className="absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-12"
                    />
                  )}

                  <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-3">
                      <div>
                        {msg.type === "user" ? <FaUser /> : <FaBrain />}
                      </div>

                      <span className="font-bold">
                        {msg.type === "user" ? "You" : "Homework AI"}
                      </span>
                    </div>

                    {isMobile ? (
                      <ReactMarkdown>{msg.text}</ReactMarkdown>
                    ) : (
                      <MathJax>
                        {msg.type === "ai" ? (
                          <div className="prose prose-invert max-w-none text-sm md:text-base">
                            <Typewriter
                              words={[msg.text]}
                              loop={1}
                              cursor={false}
                              typeSpeed={8}
                            />
                          </div>
                        ) : (
                          <ReactMarkdown>{msg.text}</ReactMarkdown>
                        )}
                      </MathJax>
                    )}

                    {msg.type === "ai" && (
                      <div className="flex gap-3 mt-4 flex-wrap">
                        <motion.button
                          whileTap={{
                            scale: 0.94,
                          }}
                          whileHover={
                            isMobile
                              ? {}
                              : {
                                  scale: 1.06,
                                  y: -2,
                                }
                          }
                          onClick={() => speakText(msg.text)}
                          className="bg-slate-700 hover:bg-slate-600 px-4 py-2 rounded-xl flex items-center gap-2 text-sm"
                        >
                          <FaVolumeUp />
                          Speak
                        </motion.button>

                        <motion.button
                          whileTap={{
                            scale: 0.94,
                          }}
                          whileHover={
                            isMobile
                              ? {}
                              : {
                                  scale: 1.06,
                                  y: -2,
                                }
                          }
                          onClick={stopSpeaking}
                          className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded-xl flex items-center gap-2 text-sm"
                        >
                          <FaStop />
                          Stop
                        </motion.button>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}

            {loading && (
              <motion.div
                initial={{
                  opacity: 0,
                  scale: 0.9,
                  y: 10,
                }}
                animate={{
                  opacity: 1,
                  scale: 1,
                  y: 0,
                }}
                className="flex items-center gap-3 bg-white/10 border border-white/10 rounded-2xl w-fit px-5 py-4"
              >
                <motion.div
                  animate={
                    isMobile
                      ? {}
                      : {
                          rotate: [0, 10, -10, 0],
                          scale: [1, 1.15, 1],
                        }
                  }
                  transition={{
                    duration: 1.2,
                    repeat: Infinity,
                  }}
                >
                  <FaBrain />
                </motion.div>

                <span className="text-sm text-slate-300">Thinking</span>

                <div className="flex gap-2">
                  <div className="w-3 h-3 bg-blue-400 rounded-full animate-bounce" />
                  <div className="w-3 h-3 bg-purple-400 rounded-full animate-bounce delay-100" />
                  <div className="w-3 h-3 bg-pink-400 rounded-full animate-bounce delay-200" />
                </div>
              </motion.div>
            )}

            <div ref={messagesEndRef} />
          </div>

          <motion.div
            initial={{
              opacity: 0,
              y: 25,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            transition={{
              delay: isMobile ? 0 : 0.2,
            }}
            className="p-3 md:p-5 border-t border-white/10 bg-black/30 backdrop-blur-lg"
          >
            <motion.div
              {...getRootProps()}
              whileTap={{
                scale: 0.98,
              }}
              animate={
                isDragActive
                  ? {
                      scale: 1.02,
                    }
                  : {}
              }
              className={`border-2 border-dashed rounded-2xl p-3 md:p-4 mb-3 cursor-pointer text-center text-xs md:text-base ${
                isDragActive
                  ? "border-blue-400 bg-blue-500/20"
                  : "border-white/20 hover:bg-white/5"
              }`}
            >
              <input {...getInputProps()} />

              <p>📸 Upload homework image/PDF</p>
            </motion.div>

            {image && (
              <motion.div
                initial={{
                  opacity: 0,
                  scale: 0.95,
                  y: 10,
                }}
                animate={{
                  opacity: 1,
                  scale: 1,
                  y: 0,
                }}
                className="mb-3 bg-white/10 rounded-2xl p-3 flex items-center gap-3"
              >
                {image.type.startsWith("image/") && (
                  <img
                    src={URL.createObjectURL(image)}
                    alt="preview"
                    className="w-16 md:w-24 rounded-xl"
                  />
                )}

                <div className="min-w-0">
                  <p className="font-bold text-xs md:text-base truncate">
                    {image.name}
                  </p>
                  <p className="text-slate-400 text-xs">Ready to upload</p>
                </div>

                <button
                  onClick={() => setImage(null)}
                  className="ml-auto bg-red-500 px-3 py-2 rounded-xl text-xs md:text-sm"
                >
                  Remove
                </button>
              </motion.div>
            )}

            <div className="flex gap-2 md:gap-4">
              <textarea
                value={transcript || question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Ask homework question..."
                className="flex-1 bg-white/10 border border-white/10 rounded-2xl p-3 md:p-4 outline-none resize-none h-14 md:h-20 focus:border-blue-400 transition text-sm md:text-base"
              />

              <motion.button
                whileTap={{
                  scale: 0.9,
                }}
                animate={
                  listening && !isMobile
                    ? {
                        scale: [1, 1.12, 1],
                        boxShadow: [
                          "0 0 0px rgba(239,68,68,0.5)",
                          "0 0 25px rgba(239,68,68,0.9)",
                          "0 0 0px rgba(239,68,68,0.5)",
                        ],
                      }
                    : {}
                }
                transition={{
                  duration: 1,
                  repeat: listening && !isMobile ? Infinity : 0,
                }}
                onClick={() =>
                  SpeechRecognition.startListening({
                    continuous: false,
                  })
                }
                className={`px-4 md:px-5 rounded-2xl ${
                  listening
                    ? "bg-red-500"
                    : "bg-slate-700 hover:bg-slate-600"
                }`}
              >
                🎤
              </motion.button>

              <motion.button
                whileTap={{
                  scale: 0.9,
                }}
                whileHover={
                  isMobile
                    ? {}
                    : {
                        scale: 1.08,
                        rotate: -3,
                      }
                }
                animate={
                  !loading && !isMobile
                    ? {
                        scale: [1, 1.04, 1],
                        rotate: [0, -3, 3, 0],
                        boxShadow: [
                          "0 0 8px rgba(37,99,235,0.5)",
                          "0 0 30px rgba(37,99,235,0.95)",
                          "0 0 8px rgba(37,99,235,0.5)",
                        ],
                      }
                    : {}
                }
                transition={{
                  duration: 1.8,
                  repeat: !isMobile ? Infinity : 0,
                }}
                onClick={solveHomework}
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 px-4 md:px-6 rounded-2xl text-lg md:text-2xl"
              >
                <FaPaperPlane />
              </motion.button>
            </div>
          </motion.div>
        </div>
      </div>
    </MathJaxContext>
  );
}