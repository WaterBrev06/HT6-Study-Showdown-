'use client';

import React, { useEffect, useState } from 'react';
import { FaHome, FaUser } from 'react-icons/fa';
import Image from 'next/image';
import defaultPicture from '../../public/images/default-pfp.png';
import { useUser } from '@auth0/nextjs-auth0/client';
import { getFirestore, collection, getDocs, query, where } from 'firebase/firestore';
import app from '../db/firebaseConfig';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

interface UserData {
  totalScore: number;
  averageScore: number;
  gamesPlayed: number;
  monthlyScores: number[];
  subjectDistribution: { [key: string]: number };
}

interface GameScore {
  recentScore: number;
  subject: string;
  userEmail: string;
  timestamp: any; // or use proper Firebase timestamp type if needed
}

const Dashboard = () => {
  const { user, isLoading: authLoading, error } = useUser();
  const [isLoading, setIsLoading] = useState(true);
  const [userData, setUserData] = useState<UserData>({
    totalScore: 0,
    averageScore: 0,
    gamesPlayed: 0,
    monthlyScores: [],
    subjectDistribution: {}
  });

  useEffect(() => {
    const fetchData = async () => {
      if (!user?.email) return;

      try {
        const db = getFirestore(app);
        const scoresCollection = collection(db, 'gameScores');
        const q = query(scoresCollection, where('userEmail', '==', user.email));
        const querySnapshot = await getDocs(q);
        
        let total = 0;
        let scores: number[] = [];
        let subjects: { [key: string]: number } = {};

        querySnapshot.forEach((doc) => {
          const data = doc.data() as GameScore;
          total += data.recentScore;
          scores.push(data.recentScore);
          
          // Count subject occurrences
          if (data.subject) {
            subjects[data.subject] = (subjects[data.subject] || 0) + 1;
          }
        });

        setUserData({
          totalScore: total,
          averageScore: total / (scores.length || 1),
          gamesPlayed: scores.length,
          monthlyScores: scores,
          subjectDistribution: subjects
        });

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

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false // Hide legend for cleaner look
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(255, 255, 255, 0.1)'
        },
        ticks: { 
          color: 'white', 
          font: { 
            family: 'brkreg',
            size: 14
          }
        }
      },
      x: {
        grid: {
          color: 'rgba(255, 255, 255, 0.1)'
        },
        ticks: { 
          color: 'white', 
          font: { 
            family: 'brkreg',
            size: 14
          }
        }
      }
    }
  };

  return (
    <div className="h-screen w-screen overflow-hidden bg-cover bg-center bg-no-repeat dark-overlay bg-[url('../public/images/study-showdown-wallpaper.png')]">
      <div className="dark-surround" />
      <div className="ambient-overlay" />

      <h1 className="md:text-7xl sm:text-6xl text-4xl font-bold font-brkreg text-stylized1 breathing text-center pt-8">
        Dashboard
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
        <a href="https://study-showdown.vercel.app">
          <FaHome size={40} className="rounded-2xl bg-black/50 p-2 text-white hover:text-black hover:bg-white ease-in-out duration-500 [filter:drop-shadow(2px_2px_0_black)]"/>
        </a>
        <a href="/api/auth/logout?returnTo=https://study-showdown.vercel.app">
          <FaUser size={40} className="rounded-2xl bg-black/50 p-2 text-white hover:text-black hover:bg-white ease-in-out duration-500 [filter:drop-shadow(2px_2px_0_black)]"/>
        </a>
      </div>

      <div className="container mx-auto px-4 mt-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="bg-black/50 backdrop-blur-sm rounded-xl p-4 floating-1">
            <h2 className="text-xl font-brkreg text-white mb-2">Total Score</h2>
            <p className="text-3xl font-bold font-brkreg text-white">{userData.totalScore.toLocaleString()}</p>
          </div>
          <div className="bg-black/50 backdrop-blur-sm rounded-xl p-4 floating-2">
            <h2 className="text-xl font-brkreg text-white mb-2">Average Score</h2>
            <p className="text-3xl font-bold font-brkreg text-white">{Math.round(userData.averageScore).toLocaleString()}</p>
          </div>
          <div className="bg-black/50 backdrop-blur-sm rounded-xl p-4 floating-3">
            <h2 className="text-xl font-brkreg text-white mb-2">Games Played</h2>
            <p className="text-3xl font-bold font-brkreg text-white">{userData.gamesPlayed}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-black/50 backdrop-blur-sm rounded-xl p-4 floating-2">
            <h2 className="text-xl font-brkreg text-white mb-4">Score History</h2>
            <div className="h-[300px]">
              <Line 
                data={{
                  labels: userData.monthlyScores.map((_, i) => `Game ${i + 1}`),
                  datasets: [{
                    label: 'Score',
                    data: userData.monthlyScores,
                    borderColor: 'rgb(75, 192, 192)',
                    backgroundColor: 'rgba(75, 192, 192, 0.2)',
                    tension: 0.1,
                    fill: true
                  }]
                }}
                options={chartOptions}
              />
            </div>
          </div>
          <div className="bg-black/50 backdrop-blur-sm rounded-xl p-4 floating-4">
            <h2 className="text-xl font-brkreg text-white mb-4">Subject Distribution</h2>
            <div className="h-[300px]">
              <Doughnut 
                data={{
                  labels: Object.keys(userData.subjectDistribution),
                  datasets: [{
                    data: Object.values(userData.subjectDistribution),
                    backgroundColor: [
                      'rgba(75, 192, 192, 0.8)',
                      'rgba(255, 206, 86, 0.8)',
                      'rgba(255, 99, 132, 0.8)',
                      'rgba(54, 162, 235, 0.8)',
                      'rgba(153, 102, 255, 0.8)',
                    ]
                  }]
                }}
                options={{
                  ...chartOptions,
                  plugins: {
                    legend: {
                      display: true,
                      position: 'right',
                      labels: {
                        color: 'white',
                        font: {
                          family: 'brkreg',
                          size: 12
                        }
                      }
                    }
                  }
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
