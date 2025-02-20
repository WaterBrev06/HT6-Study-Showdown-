import React from 'react';
import Link from 'next/link';

const Navbar = () => {
  return (
    <div className="">
      <div className="opacity-80 absolute inset-0 h-24 bg-black"></div>
      <nav className="fixed inset-x-0 z-50 border-b-4 border-black text-black">
        <div className="mx-auto w-full px-12">
          <div className="relative flex h-24 items-center justify-between">
            <nav className="font-brkreg text-neutral-300 flex w-full justify-center gap-2 text-4xl tracking-wide">
              <Link
                href="/testing"
                className="flex items-center px-16 py-8 duration-200 ease-in-out hover:bg-black hover:bg-opacity-50 hover:text-white"
                prefetch={false}
              >
                Dashboard
              </Link>

              <Link
                href="#"
                className="flex items-center px-16 py-8 duration-200 ease-in-out hover:bg-black hover:bg-opacity-50 hover:text-white"
                prefetch={false}
              >
                Showdown
              </Link>

              <Link
                href="#"
                className="flex items-center px-16 py-8 duration-200 ease-in-out hover:bg-black hover:bg-opacity-50 hover:text-white"
                prefetch={false}
              >
                Leaderboard
              </Link>
            </nav>
            {/* TODO: Add a profile section here */}
            {/* <div className="relative z-20 float-right flex place-items-end gap-4"></div> */}
          </div>
        </div>
      </nav>
    </div>
  );
};

export default Navbar;
