import { useState, useEffect, useRef } from "react";
import axios from "axios";
import {
  motion,
  useMotionValue,
  useSpring,
} from "framer-motion";
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
  FaBolt,
  FaBookOpen,
  FaStar,
  FaRocket,
  FaMagic,
  FaGem,
} from "react-icons/fa";

import Login from "./Login";
import { Typewriter } from "react-simple-typewriter";

import SpeechRecognition, {
  useSpeechRecognition,
} from "react-speech-recognition";

import { MathJax, MathJaxContext } from "better-react-mathjax";
import { useDropzone } from "react-dropzone";

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

  const cursorX = useMotionValue(-100);
  const cursorY = useMotionValue(-100);

  const smoothX = useSpring(cursorX, {
    stiffness: 500,
    damping: 40,
  });

  const smoothY = useSpring(cursorY, {
    stiffness: 500,
    damping: 40,
  });

  const { transcript, listening, resetTranscript } =
    useSpeechRecognition();

  const tutorModes = [
    {
      id: "friendly",
      name: "Friendly",
      icon: <FaSmile />,
      gradient: "from-blue-500 to-cyan-400",
      desc: "Chill helper",
    },
    {
      id: "strict",
      name: "Strict",
      icon: <FaChalkboardTeacher />,
      gradient: "from-red-500 to-orange-400",
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
      name: "Exam Coach",
      icon: <FaGraduationCap />,
      gradient: "from-yellow-400 to-orange-500",
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

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 3800);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const moveCursor = (e) => {
      cursorX.set(e.clientX);
      cursorY.set(e.clientY);
    };

    window.addEventListener("mousemove", moveCursor);

    return () => {
      window.removeEventListener("mousemove", moveCursor);
    };
  }, [cursorX, cursorY]);

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
    const savedMode = localStorage.getItem(`mode_${user}`);

    if (savedMessages) {
      setMessages(JSON.parse(savedMessages));
    }

    if (savedXP) {
      setXp(Number(savedXP));
    }

    if (savedMode) {
      setTutorStyle(savedMode);
    }
  }, []);

  useEffect(() => {
    const user = localStorage.getItem("homeworkUser");

    if (!user) return;

    localStorage.setItem(`chatHistory_${user}`, JSON.stringify(messages));
    localStorage.setItem(`xp_${user}`, xp.toString());
    localStorage.setItem(`mode_${user}`, tutorStyle);
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
      const aiMessage = {
        type: "ai",
        text:
          "# Creator\n\nI was created by **Mithun**.\n\nThis app was built by **Mithun** to help students learn homework step-by-step.",
      };

      setMessages((prev) => [...prev, aiMessage]);
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

          body {
            overflow: hidden;
          }

          .animated-grid {
            background-image:
              linear-gradient(rgba(255,255,255,0.045) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.045) 1px, transparent 1px);
            background-size: 46px 46px;
          }

          .text-glow {
            text-shadow:
              0 0 20px rgba(96,165,250,0.8),
              0 0 40px rgba(168,85,247,0.6),
              0 0 80px rgba(236,72,153,0.4);
          }
        `}
      </style>

      {/* Smooth cursor glow, no glitch */}
      <motion.div
        className="fixed top-0 left-0 w-12 h-12 rounded-full pointer-events-none z-[9999] hidden md:block"
        style={{
          x: smoothX,
          y: smoothY,
          translateX: "-50%",
          translateY: "-50%",
        }}
      >
        <motion.div
          animate={{
            scale: [1, 1.35, 1],
            opacity: [0.55, 0.2, 0.55],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="w-full h-full rounded-full border border-blue-300/60 shadow-[0_0_30px_rgba(96,165,250,0.8)]"
        />
      </motion.div>

      <motion.div
        className="fixed top-0 left-0 w-3 h-3 rounded-full pointer-events-none z-[9999] bg-cyan-300 hidden md:block shadow-[0_0_20px_rgba(103,232,249,1)]"
        style={{
          x: cursorX,
          y: cursorY,
          translateX: "-50%",
          translateY: "-50%",
        }}
      />
    </>
  );

  const SplashStar = ({ delay, left, top, size = "text-xl" }) => (
    <motion.div
      initial={{
        opacity: 0,
        scale: 0,
        rotate: 0,
      }}
      animate={{
        opacity: [0, 1, 1, 0],
        scale: [0, 1.4, 1, 0],
        rotate: [0, 180, 360, 540],
        y: [0, -40, -90],
        x: [0, 20, -20],
      }}
      transition={{
        duration: 3.5,
        repeat: Infinity,
        delay,
        ease: "easeInOut",
      }}
      className={`absolute ${size} text-yellow-300 drop-shadow-[0_0_18px_rgba(253,224,71,1)]`}
      style={{
        left,
        top,
      }}
    >
      <FaStar />
    </motion.div>
  );

  if (showSplash) {
    return (
      <>
        <GlobalEffects />

        <div className="min-h-screen bg-black text-white flex items-center justify-center overflow-hidden relative animated-grid">
          <motion.div
            animate={{
              backgroundPosition: ["0px 0px", "160px 160px"],
            }}
            transition={{
              duration: 6,
              repeat: Infinity,
              ease: "linear",
            }}
            className="absolute inset-0 animated-grid opacity-40"
          />

          {/* Insane aurora background */}
          <motion.div
            animate={{
              x: [0, 130, -90, 0],
              y: [0, -100, 70, 0],
              scale: [1, 1.35, 0.85, 1],
            }}
            transition={{
              duration: 7,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="absolute w-[760px] h-[760px] bg-blue-600 opacity-30 blur-3xl rounded-full"
          />

          <motion.div
            animate={{
              x: [0, -120, 90, 0],
              y: [0, 90, -70, 0],
              scale: [1, 0.75, 1.4, 1],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="absolute w-[620px] h-[620px] bg-purple-600 opacity-25 blur-3xl rounded-full bottom-10 right-10"
          />

          <motion.div
            animate={{
              x: [0, 70, -80, 0],
              y: [0, 80, -90, 0],
              scale: [1, 1.2, 0.9, 1],
            }}
            transition={{
              duration: 9,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="absolute w-[500px] h-[500px] bg-pink-500 opacity-20 blur-3xl rounded-full top-20 right-20"
          />

          {/* Rotating energy rings */}
          {[900, 720, 540, 360].map((size, i) => (
            <motion.div
              key={size}
              animate={{
                rotate: i % 2 === 0 ? 360 : -360,
                scale: [1, 1.04, 1],
              }}
              transition={{
                rotate: {
                  duration: 14 + i * 5,
                  repeat: Infinity,
                  ease: "linear",
                },
                scale: {
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut",
                },
              }}
              className="absolute rounded-full border border-white/10"
              style={{
                width: size,
                height: size,
              }}
            />
          ))}

          {/* Better insane stars */}
          <SplashStar delay={0.1} left="12%" top="22%" size="text-2xl" />
          <SplashStar delay={0.5} left="80%" top="18%" size="text-xl" />
          <SplashStar delay={0.9} left="18%" top="72%" size="text-xl" />
          <SplashStar delay={1.3} left="74%" top="70%" size="text-3xl" />
          <SplashStar delay={1.7} left="50%" top="14%" size="text-lg" />
          <SplashStar delay={2.1} left="42%" top="80%" size="text-xl" />

          {/* Particles */}
          {[...Array(42)].map((_, i) => (
            <motion.div
              key={i}
              initial={{
                opacity: 0,
                y: 140,
              }}
              animate={{
                opacity: [0, 1, 0],
                y: [-20, -320],
                x: [0, i % 2 === 0 ? 80 : -80],
                scale: [0.7, 1.6, 0.3],
              }}
              transition={{
                duration: 3 + (i % 7),
                repeat: Infinity,
                delay: i * 0.09,
                ease: "easeOut",
              }}
              className="absolute w-2 h-2 bg-white/50 rounded-full"
              style={{
                left: `${4 + i * 2.25}%`,
                bottom: "10%",
              }}
            />
          ))}

          {/* Main splash card */}
          <motion.div
            initial={{
              opacity: 0,
              scale: 0.55,
              y: 100,
              rotateX: 35,
            }}
            animate={{
              opacity: 1,
              scale: 1,
              y: 0,
              rotateX: 0,
            }}
            transition={{
              duration: 1,
              ease: "easeOut",
            }}
            className="relative z-10 text-center bg-white/10 border border-white/10 backdrop-blur-2xl rounded-[2.8rem] px-14 py-12 shadow-[0_0_150px_rgba(147,51,234,0.45)]"
          >
            <motion.div
              animate={{
                y: [0, -20, 0],
                rotate: [0, 8, -8, 0],
                scale: [1, 1.04, 1],
              }}
              transition={{
                duration: 2.5,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="relative mx-auto mb-8 w-36 h-36 rounded-[2.3rem] bg-gradient-to-br from-cyan-400 via-blue-600 to-purple-700 flex items-center justify-center shadow-[0_0_100px_rgba(59,130,246,1)]"
            >
              <FaBrain size={68} />

              <motion.div
                animate={{
                  scale: [1, 1.55, 1],
                  opacity: [0.8, 0, 0.8],
                }}
                transition={{
                  duration: 1.8,
                  repeat: Infinity,
                  ease: "easeOut",
                }}
                className="absolute inset-0 rounded-[2.3rem] border-4 border-cyan-300"
              />

              <motion.div
                animate={{
                  scale: [1, 2.1, 1],
                  opacity: [0.45, 0, 0.45],
                  rotate: [0, 180, 360],
                }}
                transition={{
                  duration: 2.8,
                  repeat: Infinity,
                  ease: "easeOut",
                }}
                className="absolute inset-0 rounded-[2.3rem] border-2 border-pink-300"
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 25 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="flex justify-center gap-5 text-yellow-300 mb-5 text-2xl"
            >
              {[FaBolt, FaBookOpen, FaStar, FaRocket, FaGem].map((Icon, i) => (
                <motion.div
                  key={i}
                  animate={{
                    y: [0, -10, 0],
                    rotate: [0, 15, -15, 0],
                    scale: [1, 1.25, 1],
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    delay: i * 0.2,
                  }}
                  className="drop-shadow-[0_0_18px_rgba(253,224,71,1)]"
                >
                  <Icon />
                </motion.div>
              ))}
            </motion.div>

            <motion.h1
              initial={{
                opacity: 0,
                y: 25,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              transition={{ delay: 0.35 }}
              className="text-6xl md:text-8xl font-black bg-gradient-to-r from-cyan-300 via-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent text-glow"
            >
              Homework AI
            </motion.h1>

            <motion.p
              initial={{
                opacity: 0,
                y: 15,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              transition={{ delay: 0.65 }}
              className="text-slate-200 mt-5 text-xl"
            >
              Made by Mithun
            </motion.p>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.95 }}
              className="text-slate-400 mt-2 text-sm"
            >
              Igniting your step-by-step AI tutor engine...
            </motion.p>

            <div className="flex justify-center gap-3 mt-9">
              <div className="w-3 h-3 bg-cyan-300 rounded-full animate-bounce" />
              <div className="w-3 h-3 bg-purple-400 rounded-full animate-bounce delay-100" />
              <div className="w-3 h-3 bg-pink-400 rounded-full animate-bounce delay-200" />
            </div>

            <div className="mt-9 w-80 h-3 bg-white/10 rounded-full overflow-hidden mx-auto shadow-[0_0_30px_rgba(255,255,255,0.15)]">
              <motion.div
                initial={{ width: "0%" }}
                animate={{ width: "100%" }}
                transition={{
                  duration: 3.4,
                  ease: "easeInOut",
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

      <div className="min-h-screen bg-black text-white overflow-hidden relative animated-grid">
        <motion.div
          animate={{
            backgroundPosition: ["0px 0px", "100px 100px"],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "linear",
          }}
          className="absolute inset-0 animated-grid opacity-20"
        />

        <motion.div
          animate={{
            x: [0, 60, -40, 0],
            y: [0, -40, 30, 0],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute w-[500px] h-[500px] bg-blue-600 opacity-20 blur-3xl rounded-full top-[-100px] left-[-100px]"
        />

        <motion.div
          animate={{
            x: [0, -50, 40, 0],
            y: [0, 40, -30, 0],
          }}
          transition={{
            duration: 9,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute w-[400px] h-[400px] bg-purple-600 opacity-20 blur-3xl rounded-full bottom-[-100px] right-[-100px]"
        />

        <div className="relative z-10 flex flex-col h-screen">
          <motion.div
            initial={{
              opacity: 0,
              y: -40,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            transition={{
              duration: 0.7,
            }}
            className="flex items-center justify-between p-5 border-b border-white/10 bg-black/30 backdrop-blur-lg"
          >
            <div className="flex items-center gap-4">
              <motion.div
                whileHover={{
                  rotate: 10,
                  scale: 1.1,
                }}
                whileTap={{
                  scale: 0.9,
                }}
                className="bg-blue-600 p-4 rounded-2xl shadow-[0_0_30px_rgba(37,99,235,0.8)]"
              >
                <FaBrain size={28} />
              </motion.div>

              <div>
                <motion.h1
                  initial={{
                    opacity: 0,
                    x: -20,
                  }}
                  animate={{
                    opacity: 1,
                    x: 0,
                  }}
                  className="text-3xl font-bold"
                >
                  Homework AI
                </motion.h1>

                <div className="flex items-center gap-2 text-slate-400 text-sm">
                  <FaCode />
                  <p>Made by Mithun</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <motion.div
                whileHover={{
                  scale: 1.08,
                }}
                animate={{
                  boxShadow: [
                    "0 0 10px rgba(234,179,8,0.3)",
                    "0 0 28px rgba(234,179,8,0.8)",
                    "0 0 10px rgba(234,179,8,0.3)",
                  ],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                }}
                className="bg-yellow-500 text-black px-4 py-2 rounded-xl font-bold"
              >
                XP: {xp}
              </motion.div>

              <motion.button
                whileHover={{
                  scale: 1.1,
                  rotate: 5,
                }}
                whileTap={{
                  scale: 0.9,
                }}
                onClick={clearChat}
                className="bg-red-500 hover:bg-red-600 p-3 rounded-xl shadow-[0_0_20px_rgba(239,68,68,0.5)]"
              >
                <FaTrash />
              </motion.button>

              <motion.button
                whileHover={{
                  scale: 1.08,
                  y: -2,
                }}
                whileTap={{
                  scale: 0.95,
                }}
                onClick={logout}
                className="bg-slate-700 hover:bg-slate-600 px-4 py-3 rounded-xl font-bold"
              >
                Logout
              </motion.button>
            </div>
          </motion.div>

          <motion.div
            initial={{
              opacity: 0,
              y: -20,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            transition={{
              delay: 0.2,
            }}
            className="p-4 border-b border-white/5 bg-black/20"
          >
            <p className="text-sm text-slate-400 mb-3 flex items-center gap-2">
              <FaBrain />
              Choose AI Mode
            </p>

            <div className="flex gap-4 overflow-x-auto pb-2">
              {tutorModes.map((mode) => {
                const selected = tutorStyle === mode.id;

                return (
                  <motion.button
                    key={mode.id}
                    onClick={() => setTutorStyle(mode.id)}
                    whileHover={{
                      scale: 1.08,
                      y: -5,
                    }}
                    whileTap={{
                      scale: 0.92,
                    }}
                    animate={
                      selected
                        ? {
                            y: [0, -4, 0],
                            boxShadow: [
                              "0 0 0px rgba(255,255,255,0.2)",
                              "0 0 28px rgba(255,255,255,0.35)",
                              "0 0 0px rgba(255,255,255,0.2)",
                            ],
                          }
                        : {}
                    }
                    transition={{
                      duration: 1.8,
                      repeat: selected ? Infinity : 0,
                    }}
                    className={`min-w-[150px] p-4 rounded-2xl border transition relative overflow-hidden ${
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

                    {selected && (
                      <motion.div
                        layoutId="modeGlow"
                        className="absolute inset-0 rounded-2xl border border-white/40"
                      />
                    )}

                    <div className="relative z-10">
                      <motion.div
                        animate={
                          selected
                            ? {
                                rotate: [0, 8, -8, 0],
                                scale: [1, 1.15, 1],
                              }
                            : {}
                        }
                        transition={{
                          duration: 1.5,
                          repeat: selected ? Infinity : 0,
                        }}
                        className="text-2xl mb-2"
                      >
                        {mode.icon}
                      </motion.div>
                      <p className="font-bold">{mode.name}</p>
                      <p className="text-xs text-slate-300">{mode.desc}</p>
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </motion.div>

          <div className="p-4 flex gap-4 overflow-x-auto">
            {achievements.map((a, i) => (
              <motion.div
                key={i}
                initial={{
                  opacity: 0,
                  scale: 0.8,
                }}
                animate={{
                  opacity: 1,
                  scale: 1,
                }}
                transition={{
                  delay: i * 0.15,
                }}
                whileHover={{
                  scale: 1.08,
                  y: -4,
                }}
                className={`px-4 py-2 rounded-xl whitespace-nowrap ${
                  a.unlocked
                    ? "bg-green-500 shadow-[0_0_25px_rgba(34,197,94,0.6)]"
                    : "bg-slate-700"
                }`}
              >
                🏆 {a.name}
              </motion.div>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {messages.length === 0 && (
              <motion.div
                initial={{
                  opacity: 0,
                  y: 30,
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                }}
                className="text-center text-slate-400 mt-20"
              >
                <motion.h2
                  animate={{
                    scale: [1, 1.03, 1],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                  }}
                  className="text-3xl font-bold mb-3 text-white"
                >
                  Ask your first homework question
                </motion.h2>
                <p>Type a question, use the mic, or upload homework.</p>
                <p className="mt-3 text-sm text-slate-500">
                  Made by Mithun
                </p>
              </motion.div>
            )}

            {messages.map((msg, index) => (
              <motion.div
                key={index}
                initial={{
                  opacity: 0,
                  y: 30,
                  scale: 0.95,
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                  scale: 1,
                }}
                transition={{
                  duration: 0.4,
                  type: "spring",
                }}
                className={`flex ${
                  msg.type === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <motion.div
                  whileHover={{
                    scale: 1.01,
                  }}
                  className={`max-w-[85%] md:max-w-[70%] rounded-3xl p-5 shadow-lg ${
                    msg.type === "user"
                      ? "bg-blue-600 shadow-[0_0_25px_rgba(37,99,235,0.4)]"
                      : "bg-white/10 backdrop-blur-lg border border-white/10 shadow-[0_0_25px_rgba(255,255,255,0.08)]"
                  }`}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <motion.div
                      animate={
                        msg.type === "ai"
                          ? {
                              rotate: [0, 10, -10, 0],
                            }
                          : {}
                      }
                      transition={{
                        duration: 2,
                        repeat: msg.type === "ai" ? Infinity : 0,
                      }}
                    >
                      {msg.type === "user" ? <FaUser /> : <FaBrain />}
                    </motion.div>

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
                          cursor={false}
                          typeSpeed={10}
                        />
                      </div>
                    ) : (
                      <ReactMarkdown>{msg.text}</ReactMarkdown>
                    )}
                  </MathJax>

                  {msg.type === "ai" && (
                    <div className="flex gap-3 mt-4">
                      <motion.button
                        whileHover={{
                          scale: 1.08,
                          y: -2,
                        }}
                        whileTap={{
                          scale: 0.92,
                        }}
                        onClick={() => speakText(msg.text)}
                        className="bg-slate-700 hover:bg-slate-600 px-4 py-2 rounded-xl flex items-center gap-2"
                      >
                        <FaVolumeUp />
                        Speak
                      </motion.button>

                      <motion.button
                        whileHover={{
                          scale: 1.08,
                          y: -2,
                        }}
                        whileTap={{
                          scale: 0.92,
                        }}
                        onClick={stopSpeaking}
                        className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded-xl flex items-center gap-2"
                      >
                        <FaStop />
                        Stop
                      </motion.button>
                    </div>
                  )}
                </motion.div>
              </motion.div>
            ))}

            {loading && (
              <motion.div
                initial={{
                  opacity: 0,
                  scale: 0.8,
                }}
                animate={{
                  opacity: 1,
                  scale: 1,
                }}
                className="flex items-center gap-3 bg-white/10 border border-white/10 rounded-2xl w-fit px-5 py-4"
              >
                <FaBrain />
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
              y: 40,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            transition={{
              delay: 0.3,
            }}
            className="p-5 border-t border-white/10 bg-black/30 backdrop-blur-lg"
          >
            <motion.div
              {...getRootProps()}
              whileHover={{
                scale: 1.01,
              }}
              animate={
                isDragActive
                  ? {
                      scale: 1.03,
                    }
                  : {}
              }
              className={`border-2 border-dashed rounded-2xl p-4 mb-4 cursor-pointer text-center transition ${
                isDragActive
                  ? "border-blue-400 bg-blue-500/20"
                  : "border-white/20 hover:bg-white/5"
              }`}
            >
              <input {...getInputProps()} />

              <motion.p
                animate={{
                  y: [0, -3, 0],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                }}
              >
                📸 Drag homework image/PDF here or click to upload
              </motion.p>
            </motion.div>

            {image && (
              <motion.div
                initial={{
                  opacity: 0,
                  scale: 0.9,
                  y: 15,
                }}
                animate={{
                  opacity: 1,
                  scale: 1,
                  y: 0,
                }}
                className="mb-4 bg-white/10 rounded-2xl p-3 flex items-center gap-4"
              >
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

                <motion.button
                  whileHover={{
                    scale: 1.08,
                  }}
                  whileTap={{
                    scale: 0.92,
                  }}
                  onClick={() => setImage(null)}
                  className="ml-auto bg-red-500 px-3 py-2 rounded-xl"
                >
                  Remove
                </motion.button>
              </motion.div>
            )}

            <div className="flex gap-4">
              <motion.textarea
                whileFocus={{
                  scale: 1.01,
                }}
                value={transcript || question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Ask homework question..."
                className="flex-1 bg-white/10 border border-white/10 rounded-2xl p-4 outline-none resize-none h-20 focus:border-blue-400 transition"
              />

              <motion.button
                whileHover={{
                  scale: 1.1,
                  rotate: listening ? 0 : 5,
                }}
                whileTap={{
                  scale: 0.9,
                }}
                animate={
                  listening
                    ? {
                        scale: [1, 1.15, 1],
                        boxShadow: [
                          "0 0 0px rgba(239,68,68,0.5)",
                          "0 0 30px rgba(239,68,68,0.9)",
                          "0 0 0px rgba(239,68,68,0.5)",
                        ],
                      }
                    : {}
                }
                transition={{
                  duration: 1,
                  repeat: listening ? Infinity : 0,
                }}
                onClick={() =>
                  SpeechRecognition.startListening({
                    continuous: false,
                  })
                }
                className={`px-5 rounded-2xl ${
                  listening
                    ? "bg-red-500"
                    : "bg-slate-700 hover:bg-slate-600"
                }`}
              >
                🎤
              </motion.button>

              <motion.button
                whileHover={{
                  scale: 1.12,
                  rotate: -5,
                }}
                whileTap={{
                  scale: 0.9,
                }}
                animate={
                  !loading
                    ? {
                        boxShadow: [
                          "0 0 10px rgba(37,99,235,0.5)",
                          "0 0 35px rgba(37,99,235,0.9)",
                          "0 0 10px rgba(37,99,235,0.5)",
                        ],
                      }
                    : {}
                }
                transition={{
                  duration: 1.8,
                  repeat: Infinity,
                }}
                onClick={solveHomework}
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 px-6 rounded-2xl text-2xl"
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