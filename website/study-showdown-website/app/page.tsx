'use client'

import { ReactTyped } from 'react-typed';
import Button from './components/Button';
import './globals.css';
import Navbar from './components/Navbar';
import SslogoWhite from './components/SslogoWhite';

export default function Home() {
  const handleSignIn = () => {
    console.log("Sign in button clicked");
    window.location.href = "api/auth/login?returnTo=http://localhost:3000/leaderboard"; {/* Change the "returnTo" URL to "https://study-showdown.vercel.app/leaderboard" once deployed */}
  }

  return (
    <div className="min-h-screen bg-cover bg-center bg-no-repeat dark-overlay bg-[url('../public/images/study-showdown-wallpaper.png')]">
      <div className="dark-surround" />
      <div className="ambient-overlay" />
      
      <Navbar />
      <div className="h-screen flex items-center justify-center">
        <div className='flex-col text-center floating'>
          <div className="relative inline-block">
            <h1 className='text-8xl font-bold tracking-wider font-brkreg text-stylized1 breathing'>
              Study Showdown
            </h1>
            <div className="absolute top-full -right-52 transform -translate-y-[55%] rotate-12 scale-50 [filter:drop-shadow(2px_2px_0_black)_drop-shadow(-2px_-2px_0_black)_drop-shadow(-2px_2px_0_black)_drop-shadow(2px_-2px_0_black)]">
              <SslogoWhite />
            </div>
          </div>
            
          <div className='mt-4 font-medium tracking-wider text-4xl'>
            <p className="font-brkreg">helping you</p>
            <ReactTyped className="pl-2 font-brkreg" 
                        strings={['get motivated', 'study better', 'build discipline', 'make studying fun again']} 
                        typeSpeed={75} backSpeed={75} loop />
          </div>
          <div className="mt-32 my-auto">
            <Button onClick={handleSignIn} buttonName={"Get Started"} />
          </div>
        </div>
      </div>
    </div>
  );
}
