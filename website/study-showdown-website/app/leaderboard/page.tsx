'use client';

import React, { useEffect, useState } from 'react';
import { FaHome, FaUser } from 'react-icons/fa';
import Image from 'next/image';
import defaultPicture from '../../public/images/default-pfp.png';
import { useUser } from '@auth0/nextjs-auth0/client';
import LeaderboardTable from '../components/Leaderboard'; 
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import app from '../db/firebaseConfig'; 
import firebase from 'firebase/compat/app';

interface GameScore {
  recentScore: number;
  timestamp: firebase.firestore.Timestamp;
  userEmail: string;
  userName: string;
}

const LeaderboardPage = () => {
  const { user, isLoading: authLoading, error } = useUser();
  const [data, setData] = useState<GameScore[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const db = getFirestore(app);
        const scoresCollection = collection(db, 'gameScores');
        const scoresSnapshot = await getDocs(scoresCollection);
        const scoresList: GameScore[] = scoresSnapshot.docs.map(doc => doc.data() as GameScore);

        // Sort the scoresList by recentScore in descending order
        scoresList.sort((a, b) => b.recentScore - a.recentScore);

        // Set minimum loading time to 3 seconds
        setTimeout(() => {
          setData(scoresList);
          setIsLoading(false);
        }, 1000);

      } catch (error) {
        console.error("Error fetching data: ", error);
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

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

  if (error) {
    return (
      <div className="min-h-screen bg-cover bg-center bg-no-repeat dark-overlay bg-[url('../public/images/study-showdown-wallpaper.png')] flex items-center justify-center">
        <div className="text-2xl font-brkreg text-red-500">Error loading user</div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen overflow-hidden bg-cover bg-center bg-no-repeat dark-overlay bg-[url('../public/images/study-showdown-wallpaper.png')]">
      <div className="dark-surround" />
      <div className="ambient-overlay" />
      
      <h1 className="md:text-7xl sm:text-6xl text-4xl font-bold font-brkreg text-stylized1 breathing text-center pt-8">
        {user ? `Welcome, ${user.name}` : 'Leaderboard'}
      </h1>
      
      <div className="absolute top-4 left-4">
        <Image 
          src={user?.picture ?? defaultPicture} 
          alt="" 
          className="w-20 h-20 rounded-full border-4 border-white [filter:drop-shadow(2px_2px_0_black)]" 
          width={80} 
          height={80}
        />
      </div>
      
      <div className="absolute top-0 right-0 m-4 flex gap-4">
        <a href="http://localhost:3000">
          <FaHome size={40} className="rounded-2xl bg-black/50 p-2 text-white hover:text-black hover:bg-white ease-in-out duration-500 [filter:drop-shadow(2px_2px_0_black)]"/>
        </a>
        <a href="/api/auth/logout?returnTo=http://localhost:3000">
          <FaUser size={40} className="rounded-2xl bg-black/50 p-2 text-white hover:text-black hover:bg-white ease-in-out duration-500 [filter:drop-shadow(2px_2px_0_black)]"/>
        </a>
      </div>
      
      <div className="flex-1 flex items-center justify-center px-4">
        <div className="w-full max-h-[70vh] overflow-y-auto mt-16 floating">
          <LeaderboardTable data={data} />
        </div>
      </div>
    </div>
  );
};

export default LeaderboardPage;
