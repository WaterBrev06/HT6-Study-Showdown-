/* global chrome */
import "./css/App.css";
import { Container } from "./components/Container";
import React, { useState, useEffect } from "react";
import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, serverTimestamp, query, where, getDocs, updateDoc, doc } from "firebase/firestore";

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
  const [userEmail, setUserEmail] = useState('');
  const [userName, setUserName] = useState('');
  const [word, setWord] = useState('');

  useEffect(() => {
    chrome.storage.local.get(
      ["activeTabUrl", "gameActive", "score", "recentScore", "userEmail", "userName", "remainingTime"],
      function (data) {
        if (data.activeTabUrl) setActiveTabUrl(data.activeTabUrl);
        if (data.gameActive !== undefined) setGame(data.gameActive);
        if (data.score !== undefined) setScore(data.score);
        if (data.recentScore !== undefined) setRecentScore(data.recentScore);
        if (data.userEmail) setUserEmail(data.userEmail);
        if (data.userName) setUserName(data.userName);
        if (data.remainingTime !== undefined) setRemainingTime(data.remainingTime);
      }
    );

    chrome.storage.onChanged.addListener((changes) => {
      if (changes.remainingTime) setRemainingTime(changes.remainingTime.newValue);
      if (changes.gameActive) setGame(changes.gameActive.newValue);
      if (changes.score) setScore(changes.score.newValue);
      if (changes.recentScore) setRecentScore(changes.recentScore.newValue);
    });
  }, []);

  function handleStart() {
    // Check if word is empty
    if (!word.trim()) {
      console.log("No word entered, starting game normally");
      chrome.runtime.sendMessage({ action: 'startGame' });
      return;
    }

    // Store the word in chrome storage for use with new tabs
    chrome.storage.local.set({ searchWord: word }, () => {
      // If we have a word, send it with the owl message
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]) {
          // Check if we're on a chrome:// page
          if (tabs[0].url.startsWith('chrome://')) {
            chrome.runtime.sendMessage({ action: 'startGame' });
            return;
          }

          chrome.tabs.sendMessage(
            tabs[0].id,
            { 
              action: "flyOwl",
              word: word 
            },
            (response) => {
              if (chrome.runtime.lastError) {
                console.error("Error sending owl message:", chrome.runtime.lastError);
              }
            }
          );

          // Start game as normal
          chrome.runtime.sendMessage({ action: 'startGame' });
        }
      });
    });
  }

  // This function will be injected into the page
  function parsePageForWord(searchWord) {
    console.log("Searching for word:", searchWord); // Debug log inside injected script
    
    // Create regex to find the word
    const wordRegEx = new RegExp(searchWord, 'gim');
    
    // Parse word from the HTML of the page
    let matches = document.body.innerText.match(wordRegEx);
    const count = matches ? matches.length : 0;
    
    console.log(`Found ${count} matches for "${searchWord}"`); // Debug log inside injected script
    return count;
  }

  async function handleEnd() {
    try {
      // First send message to remove owls from all tabs
      chrome.tabs.query({}, (tabs) => {
        tabs.forEach((tab) => {
          chrome.tabs.sendMessage(
            tab.id,
            { action: "flyOwlAway" },
            () => {
              if (chrome.runtime.lastError) {
                console.error(`Error sending owl away message to tab ${tab.id}:`, chrome.runtime.lastError);
              }
            }
          );
        });
      });

      // Then handle the game end
      chrome.storage.local.get(["score", "userEmail", "userName"], async function (data) {
        const recentScore = data.score || 0;
        const userEmail = data.userEmail || '';
        const userName = data.userName || '';

        console.log("Attempting to update Firebase with:", {
          recentScore,
          userEmail,
          userName
        });

        const q = query(collection(db, "gameScores"), where("userEmail", "==", userEmail));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          querySnapshot.forEach(async (docSnapshot) => {
            const docRef = doc(db, "gameScores", docSnapshot.id);
            const existingData = docSnapshot.data();

            if (recentScore > existingData.recentScore) {
              await updateDoc(docRef, {
                recentScore: recentScore,
                timestamp: serverTimestamp(),
              });
              console.log("Game data updated in Firestore successfully!");
            }
          });
        } else {
          const gameData = {
            userEmail: userEmail,
            userName: userName,
            recentScore: recentScore,
            timestamp: serverTimestamp(),
          };
          await addDoc(collection(db, "gameScores"), gameData);
          console.log("New game data saved to Firestore successfully!");
        }

        chrome.runtime.sendMessage({ action: 'endGame' });
      });
    } catch (error) {
      console.error("Error saving game data to Firestore:", error);
    }
  }

  return (
    <div>
      {game ? (
        <Container score={score}>
          <p className="text-[#9ba793] text-center font-pixel">
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
        </Container>
      ) : (
        <Container>
          <h2 className="text-[#9ba793] text-center font-pixel">
            An engaging way to study! Try your best to get the highest score
            on the leaderboards!
          </h2>
          <div className="text-center mb-4">
            <p className="text-[#9ba793] text-center font-pixel mb-2">Recent Score:</p>
            <div className="text-3xl font-pixel text-green-400 glow-text">
              {recentScore}
            </div>
          </div>
          <input
            type="text"
            value={word}
            onChange={(e) => setWord(e.target.value)}
            placeholder="Enter a word..."
            className="w-full px-4 py-2 bg-[#2a3b2a] border-2 border-[#ffffff20] rounded-lg text-[#9ba793] font-pixel placeholder-[#9ba793]/60 focus:outline-none focus:border-[#ffffff40] transition-colors"
          />
          <div className="flex justify-center mt-4">
            <button
              onClick={handleStart}
              className="inline-flex items-center justify-center rounded-md border border-transparent bg-green-600 px-3 py-2 text-sm font-medium leading-4 text-white shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              Start Game
            </button>
          </div>
          <p className="text-[#9ba793] text-center font-pixel">
            Visit the{" "}
            <a
              href="https://studyshowdown.com/leaderboard"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 underline hover:text-blue-400"
            >
              leaderboard
            </a>{" "}
            to see how you rank!
          </p>
        </Container>
      )}
    </div>
  );
}

export default App;