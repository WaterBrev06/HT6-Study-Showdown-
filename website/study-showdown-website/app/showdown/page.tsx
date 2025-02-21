'use client';

import React, { useEffect, useState } from 'react';
import { FaHome, FaUser } from 'react-icons/fa';
import Image from 'next/image';
import defaultPicture from '../../public/images/default-pfp.png';
import { useUser } from '@auth0/nextjs-auth0/client';
import { getFirestore, collection, getDocs, query, where } from 'firebase/firestore';
import app from '../db/firebaseConfig';

interface PlayerStats {
  totalScore: number;
  averageScore: number;
  gamesPlayed: number;
  winRate: number;
  bestSubject: string;
  recentScore: number;
}

const ShowdownPage = () => {
  const { user, isLoading: authLoading, error } = useUser();
  const [isLoading, setIsLoading] = useState(true);
  const [player1Stats, setPlayer1Stats] = useState<PlayerStats>({
    totalScore: 0,
    averageScore: 0,
    gamesPlayed: 0,
    winRate: 0,
    bestSubject: '',
    recentScore: 0
  });
  const [player2Stats, setPlayer2Stats] = useState<PlayerStats>({
    totalScore: 0,
    averageScore: 0,
    gamesPlayed: 0,
    winRate: 0,
    bestSubject: '',
    recentScore: 0
  });

  useEffect(() => {
    const fetchData = async () => {
      if (!user?.email) return;

      try {
        const db = getFirestore(app);
        const scoresCollection = collection(db, 'gameScores');
        
        // Fetch current user's stats
        const userQuery = query(scoresCollection, where('userEmail', '==', user.email));
        const userSnapshot = await getDocs(userQuery);
        
        // Calculate player 1 stats (current user)
        let total = 0;
        let scores: number[] = [];
        let subjects: { [key: string]: number } = {};
        
        userSnapshot.forEach((doc) => {
          const data = doc.data();
          total += data.recentScore;
          scores.push(data.recentScore);
          if (data.subject) {
            subjects[data.subject] = (subjects[data.subject] || 0) + 1;
          }
        });

        const bestSubject = Object.entries(subjects).reduce((a, b) => 
          subjects[a[0]] > subjects[b[0]] ? a : b, ['', 0])[0];

        setPlayer1Stats({
          totalScore: total,
          averageScore: total / (scores.length || 1),
          gamesPlayed: scores.length,
          winRate: (scores.filter(score => score > 5000).length / scores.length) * 100 || 0,
          bestSubject,
          recentScore: scores[scores.length - 1] || 0
        });

        // Simulate loading for 3 seconds
        setTimeout(() => setIsLoading(false), 3000);
      } catch (error) {
        console.error("Error fetching data:", error);
        setIsLoading(false);
      }
    };

    fetchData();
  }, [user]);

  if (isLoading || authLoading) {
    return (
      <div className="min-h-screen bg-cover bg-center bg-no-repeat dark-overlay bg-[url('../public/images/study-showdown-wallpaper.png')] flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-16 w-16 animate-spin rounded-full border-4 border-solid border-white border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
          <p className="mt-4 text-2xl font-brkreg text-white">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen overflow-hidden bg-cover bg-center bg-no-repeat dark-overlay bg-[url('../public/images/study-showdown-wallpaper.png')]">
      <div className="dark-surround" />
      <div className="ambient-overlay" />

      <h1 className="md:text-7xl sm:text-6xl text-4xl font-bold font-brkreg text-stylized1 breathing text-center pt-8">
        Showdown
      </h1>

      <div className="absolute top-0 right-0 m-4 flex gap-4">
        <a href="https://study-showdown.vercel.app">
          <FaHome size={40} className="rounded-2xl bg-black/50 p-2 text-white hover:text-black hover:bg-white ease-in-out duration-500 [filter:drop-shadow(2px_2px_0_black)]"/>
        </a>
        <a href="/api/auth/logout?returnTo=https://study-showdown.vercel.app">
          <FaUser size={40} className="rounded-2xl bg-black/50 p-2 text-white hover:text-black hover:bg-white ease-in-out duration-500 [filter:drop-shadow(2px_2px_0_black)]"/>
        </a>
      </div>

      <div className="container mx-auto px-4 mt-16">
        <div className="flex justify-between items-center gap-8">
          {/* Player 1 Stats (Left) */}
          <div className="flex-1 bg-blue-500/20 backdrop-blur-sm rounded-xl p-6 floating-1">
            <div className="flex justify-center mb-4">
              <Image 
                src={user?.picture ?? defaultPicture}
                alt="Player 1"
                className="w-24 h-24 rounded-full border-4 border-white [filter:drop-shadow(2px_2px_0_black)]"
                width={96}
                height={96}
              />
            </div>
            <h2 className="text-2xl font-brkreg text-white text-center mb-4">{user?.name || 'Player 1'}</h2>
            <div className="space-y-4">
              <StatRow label="Total Score" value={player1Stats.totalScore.toLocaleString()} />
              <StatRow label="Average Score" value={Math.round(player1Stats.averageScore).toLocaleString()} />
              <StatRow label="Games Played" value={player1Stats.gamesPlayed.toString()} />
              <StatRow label="Win Rate" value={`${Math.round(player1Stats.winRate)}%`} />
              <StatRow label="Best Subject" value={player1Stats.bestSubject || 'N/A'} />
              <StatRow label="Recent Score" value={player1Stats.recentScore.toLocaleString()} />
            </div>
          </div>

          {/* VS Logo */}
          <div className="text-8xl font-bold font-brkreg text-white [filter:drop-shadow(4px_4px_0_black)] breathing">
            VS
          </div>

          {/* Player 2 Stats (Right) */}
          <div className="flex-1 bg-red-500/20 backdrop-blur-sm rounded-xl p-6 floating-3">
            <div className="flex justify-center mb-4">
              <div className="w-24 h-24 rounded-full border-4 border-white bg-gray-700 flex items-center justify-center [filter:drop-shadow(2px_2px_0_black)]">
                <FaUser size={40} className="text-white" />
              </div>
            </div>
            <h2 className="text-2xl font-brkreg text-white text-center mb-4">Challenger</h2>
            <div className="space-y-4">
              <StatRow label="Total Score" value="?" />
              <StatRow label="Average Score" value="?" />
              <StatRow label="Games Played" value="?" />
              <StatRow label="Win Rate" value="?" />
              <StatRow label="Best Subject" value="?" />
              <StatRow label="Recent Score" value="?" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper component for stat rows
const StatRow = ({ label, value }: { label: string; value: string }) => (
  <div className="flex justify-between items-center">
    <span className="text-lg font-brkreg text-white">{label}</span>
    <span className="text-lg font-bold font-brkreg text-white">{value}</span>
  </div>
);

export default ShowdownPage;
