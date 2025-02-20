'use client';

import React, { useEffect, useState } from 'react';
import { FaHome } from 'react-icons/fa';
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
  const { user, isLoading, error } = useUser();
  const [data, setData] = useState<GameScore[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const db = getFirestore(app);
        const scoresCollection = collection(db, 'gameScores');
        const scoresSnapshot = await getDocs(scoresCollection);
        const scoresList: GameScore[] = scoresSnapshot.docs.map(doc => doc.data() as GameScore);

        // Sort the scoresList by recentScore in descending order
        scoresList.sort((a, b) => b.recentScore - a.recentScore);

        setData(scoresList);
      } catch (error) {
        console.error("Error fetching data: ", error);
      }
    };
    fetchData();
  }, []);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error loading user</div>;
  }

  return (
    <div className='absolute inset-0 -z-10 h-full w-full bg-gradient-to-b from-[#f30303] to-[#2005f2] via-[#cf04ea] animate-gradient-xy text-white justify-center'>
      <h1 className="md:text-7xl sm:text-6xl text-4xl font-bold font-custom md:drop-shadow-[8px_0_0_rgba(0,0,0,1)] 
                                                                          sm:drop-shadow-[6px_0_0_rgba(0,0,0,1)] 
                                                                          drop-shadow-[4px_0_0_rgba(0,0,0,1)] text-center pt-14 my-8 md-8 h-18">
        {user ? `Welcome, ${user.name}` : 'Leaderboard'}
      </h1>
      <div className="absolute top-4 left-4">
        <Image 
          src={user?.picture ?? defaultPicture} 
          alt="" 
          className="w-24 h-24 rounded-full border-4 border-white" 
          width={96} 
          height={96}
        />
      </div>
      ```
            <a href="/api/auth/logout?returnTo=http://localhost:3000"> {/* Change the "returnTo" URL to your own domain once deployed */}
        <FaHome size={48} className='absolute top-0 right-0 m-4 rounded-2xl bg-black border-8 border-black hover:text-black hover:bg-white hover:border-white ease-in-out duration-500'/>
      </a>
      <LeaderboardTable data={data} />
    </div>
  );
};

export default LeaderboardPage;
