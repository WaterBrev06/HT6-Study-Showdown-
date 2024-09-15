/* global chrome */
import "./css/App.css";
import { Container } from "./components/Container";
import React, { useState, useEffect } from "react";
import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  addDoc,
  serverTimestamp,
  query,
  where,
  getDocs,
  updateDoc,
  doc,
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

function App() {
  const [activeTabUrl, setActiveTabUrl] = useState("No URL captured yet.");
  const [game, setGame] = useState(false);
  const [score, setScore] = useState(0);
  const [recentScore, setRecentScore] = useState(0);
  const [remainingTime, setRemainingTime] = useState(60);
  const [userEmail, setUserEmail] = useState("");
  const [userName, setUserName] = useState("");

  useEffect(() => {
    chrome.storage.local.get(
      [
        "activeTabUrl",
        "gameActive",
        "score",
        "recentScore",
        "userEmail",
        "userName",
        "remainingTime",
      ],
      function (data) {
        if (data.activeTabUrl) setActiveTabUrl(data.activeTabUrl);
        if (data.gameActive !== undefined) setGame(data.gameActive);
        if (data.score !== undefined) setScore(data.score);
        if (data.recentScore !== undefined) setRecentScore(data.recentScore);
        if (data.userEmail) setUserEmail(data.userEmail);
        if (data.userName) setUserName(data.userName);
        if (data.remainingTime !== undefined)
          setRemainingTime(data.remainingTime);
      }
    );

    // Listen for updates to the game state
    chrome.storage.onChanged.addListener((changes) => {
      if (changes.remainingTime)
        setRemainingTime(changes.remainingTime.newValue);
      if (changes.gameActive) setGame(changes.gameActive.newValue);
      if (changes.score) setScore(changes.score.newValue);
      if (changes.recentScore) setRecentScore(changes.recentScore.newValue);
    });
  }, []);

  async function handleEnd() {
    try {
      chrome.storage.local.get(
        ["score", "userEmail", "userName"],
        async function (data) {
          const recentScore = data.score || 0;
          const userEmail = data.userEmail || "";
          const userName = data.userName || "";

          // Check if a document with the same email already exists
          const q = query(
            collection(db, "gameScores"),
            where("userEmail", "==", userEmail)
          );
          const querySnapshot = await getDocs(q);

          if (!querySnapshot.empty) {
            // Document exists, so compare scores and update if the new score is higher
            querySnapshot.forEach(async (docSnapshot) => {
              const docRef = doc(db, "gameScores", docSnapshot.id);
              const existingData = docSnapshot.data();

              if (recentScore > existingData.recentScore) {
                await updateDoc(docRef, {
                  recentScore: recentScore,
                  timestamp: serverTimestamp(),
                });
                console.log("Game data updated in Firestore successfully!");
              } else {
                console.log(
                  "New score is not higher than the existing score. No update made."
                );
              }
            });
          } else {
            // Document does not exist, so create a new one
            const gameData = {
              userEmail: userEmail,
              userName: userName,
              recentScore: recentScore,
              timestamp: serverTimestamp(),
            };
            await addDoc(collection(db, "gameScores"), gameData);
            console.log("Game data saved to Firestore successfully!");
          }

          chrome.runtime.sendMessage({ action: "endGame" });
        }
      );
    } catch (error) {
      console.error("Error saving game data to Firestore:", error);
    }
  }

  function handleStart() {
    chrome.runtime.sendMessage({ action: "startGame" });
  }

  return (
    <div>
      {game ? (
        <Container.Outer>
          <Container.Inner>
            <h2 className="text-black text-center">Welcome to the game!</h2>
            <p className="text-black text-center">Score: {score}</p>
            <p className="text-black text-center">
              Time Remaining: {Math.floor(remainingTime / 60)}:
              {remainingTime % 60 < 10 ? "0" : ""}
              {remainingTime % 60}
            </p>
            <div className="flex justify-center mt-4">
              <button
                onClick={handleEnd}
                className="inline-flex items-center justify-center rounded-md border border-transparent bg-red-600 px-3 py-2 text-sm font-medium leading-4 text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                End Game
              </button>
            </div>
          </Container.Inner>
        </Container.Outer>
      ) : (
        <Container.Outer>
          <Container.Inner>
            <h2 className="text-black text-center">
              An engaging way to study! Try your best to get the highest score
              on the leaderboards!
            </h2>
            <p className="text-black text-center">
              Recent Score: {recentScore}
            </p>
            <div className="flex justify-center mt-4">
              <button
                onClick={handleStart}
                className="inline-flex items-center justify-center rounded-md border border-transparent bg-green-600 px-3 py-2 text-sm font-medium leading-4 text-white shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                Start Game
              </button>
            </div>
            <p className="text-black text-center">
              Visit the{" "}
              <a
                href="https://localhost:3000/leaderboard" /* Change the URL to "https://study-showdown.vercel.app/leaderboard" once deployed */
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-700 underline hover:text-blue-800"
              >
                leaderboard
              </a>{" "}
              to see how you rank!
            </p>
          </Container.Inner>
        </Container.Outer>
      )}
    </div>
  );
}

export default App;
