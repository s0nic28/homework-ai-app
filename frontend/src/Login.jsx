import { useState } from "react";
import { motion } from "framer-motion";
import {
  FaBrain,
  FaRocket,
  FaCode,
  FaUserAstronaut,
  FaStar,
} from "react-icons/fa";

export default function Login({ setLoggedIn }) {
  const [username, setUsername] = useState("");

  const login = () => {
    if (!username.trim()) return;

    localStorage.setItem("homeworkUser", username.trim());
    setLoggedIn(true);
  };

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-4 overflow-hidden relative">
      <style>
        {`
          body {
            overflow: hidden;
          }

          *::-webkit-scrollbar {
            width: 0px;
            height: 0px;
          }

          * {
            scrollbar-width: none;
            -ms-overflow-style: none;
          }

          .login-grid {
            background-image:
              linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px);
            background-size: 42px 42px;
          }
        `}
      </style>

      {/* Grid */}
      <motion.div
        animate={{
          backgroundPosition: ["0px 0px", "120px 120px"],
        }}
        transition={{
          duration: 7,
          repeat: Infinity,
          ease: "linear",
        }}
        className="absolute inset-0 login-grid opacity-30"
      />

      {/* Glowing blobs */}
      <motion.div
        animate={{
          x: [0, 80, -60, 0],
          y: [0, -70, 50, 0],
          scale: [1, 1.25, 0.9, 1],
        }}
        transition={{
          duration: 7,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute w-[420px] h-[420px] md:w-[650px] md:h-[650px] bg-blue-600 opacity-30 blur-3xl rounded-full"
      />

      <motion.div
        animate={{
          x: [0, -70, 50, 0],
          y: [0, 60, -40, 0],
          scale: [1, 0.85, 1.3, 1],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute w-[350px] h-[350px] md:w-[520px] md:h-[520px] bg-purple-600 opacity-25 blur-3xl rounded-full bottom-[-80px] right-[-80px]"
      />

      {/* Stars */}
      {[...Array(18)].map((_, i) => (
        <motion.div
          key={i}
          initial={{
            opacity: 0,
            scale: 0,
          }}
          animate={{
            opacity: [0, 1, 0],
            scale: [0, 1.4, 0],
            rotate: [0, 180, 360],
            y: [0, -80],
          }}
          transition={{
            duration: 3 + (i % 5),
            repeat: Infinity,
            delay: i * 0.18,
            ease: "easeInOut",
          }}
          className="absolute text-yellow-300 drop-shadow-[0_0_15px_rgba(253,224,71,1)]"
          style={{
            left: `${8 + i * 5}%`,
            top: `${12 + (i % 6) * 12}%`,
          }}
        >
          <FaStar />
        </motion.div>
      ))}

      {/* Login card */}
      <motion.div
        initial={{
          opacity: 0,
          scale: 0.8,
          y: 60,
        }}
        animate={{
          opacity: 1,
          scale: 1,
          y: 0,
        }}
        transition={{
          duration: 0.8,
          ease: "easeOut",
        }}
        className="relative z-10 w-full max-w-md bg-white/10 backdrop-blur-2xl border border-white/10 rounded-[2rem] p-6 md:p-8 shadow-[0_0_100px_rgba(59,130,246,0.35)]"
      >
        {/* Icon */}
        <motion.div
          animate={{
            y: [0, -10, 0],
            rotate: [0, 5, -5, 0],
          }}
          transition={{
            duration: 2.5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="mx-auto mb-6 w-24 h-24 rounded-[2rem] bg-gradient-to-br from-cyan-400 via-blue-600 to-purple-700 flex items-center justify-center shadow-[0_0_70px_rgba(59,130,246,0.9)] relative"
        >
          <FaBrain size={45} />

          <motion.div
            animate={{
              scale: [1, 1.5, 1],
              opacity: [0.7, 0, 0.7],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
            }}
            className="absolute inset-0 rounded-[2rem] border-4 border-cyan-300"
          />
        </motion.div>

        <motion.div
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
          className="text-center"
        >
          <h1 className="text-4xl md:text-5xl font-black bg-gradient-to-r from-cyan-300 via-blue-400 to-purple-400 bg-clip-text text-transparent">
            Homework AI
          </h1>

          <p className="text-slate-400 mt-3">
            Your personal step-by-step AI tutor
          </p>

          <p className="text-slate-500 mt-2 text-sm flex items-center justify-center gap-2">
            <FaCode />
            Made by Mithun
          </p>
        </motion.div>

        <div className="mt-8 space-y-4">
          <div className="flex items-center gap-3 bg-black/40 border border-white/10 rounded-2xl p-4">
            <FaUserAstronaut className="text-blue-300" />

            <input
              type="text"
              placeholder="Enter your username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") login();
              }}
              className="w-full bg-transparent outline-none text-white placeholder:text-slate-500"
            />
          </div>

          <motion.button
            whileHover={{
              scale: 1.04,
              y: -3,
            }}
            whileTap={{
              scale: 0.95,
            }}
            animate={{
              boxShadow: [
                "0 0 15px rgba(37,99,235,0.4)",
                "0 0 45px rgba(37,99,235,0.9)",
                "0 0 15px rgba(37,99,235,0.4)",
              ],
            }}
            transition={{
              duration: 1.8,
              repeat: Infinity,
            }}
            onClick={login}
            className="w-full bg-blue-600 hover:bg-blue-700 transition p-4 rounded-2xl font-bold flex items-center justify-center gap-3"
          >
            <FaRocket />
            Enter App
          </motion.button>
        </div>

        <p className="text-xs text-center text-slate-500 mt-6">
          Login saves your XP, chat history, and AI mode on this device.
        </p>
      </motion.div>
    </div>
  );
}