import { useState } from "react";
import { motion } from "framer-motion";

export default function Login({
  setLoggedIn,
}) {

  const [username, setUsername] =
    useState("");

  const login = () => {

    if (!username) return;

    localStorage.setItem(
      "homeworkUser",
      username
    );

    setLoggedIn(true);
  };

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-6">

      <motion.div
        initial={{
          opacity: 0,
          y: 40,
        }}
        animate={{
          opacity: 1,
          y: 0,
        }}
        className="w-full max-w-md bg-white/10 backdrop-blur-lg border border-white/10 rounded-3xl p-8"
      >

        <h1 className="text-4xl font-bold mb-2">
          Homework AI
        </h1>

        <p className="text-slate-400 mb-8">
          Login to continue
        </p>

        <input
          type="text"
          placeholder="Enter username"
          value={username}
          onChange={(e) =>
            setUsername(e.target.value)
          }
          className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 outline-none"
        />

        <button
          onClick={login}
          className="w-full mt-6 bg-blue-600 hover:bg-blue-700 transition p-4 rounded-2xl font-bold"
        >
          Continue
        </button>

      </motion.div>

    </div>
  );
}