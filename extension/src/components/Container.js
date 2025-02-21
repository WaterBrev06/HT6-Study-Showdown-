/* global chrome */
import { forwardRef } from "react";
import clsx from "clsx";

const OuterContainer = forwardRef(function OuterContainer(
  { className, children, ...props },
  ref
) {
  return (
    <div
      ref={ref}
      className={clsx(
        "min-h-full flex items-center justify-center overflow-hidden relative",
        className
      )}
      style={{
        backgroundImage: `url(${chrome.runtime.getURL('study-showdown-wallpaper.png')})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        width: '100%',
        height: '100%'
      }}
      {...props}
    >
      <div className="bg-[#2a3b2a]/80 backdrop-blur-sm border-4 border-[#ffffff20] shadow-lg p-6 w-full rounded-lg">
        <div className="flex items-center justify-center gap-2 mb-4">
          <h1 className="text-center text-2xl font-pixel text-white tracking-wider">STUDY SHOWDOWN</h1>
          <img 
            src={chrome.runtime.getURL('ss-logo.png')} 
            alt="Study Showdown Logo" 
            className="absolute h-16 w-16 right-[calc(30%-4.5rem)] top-[1.25rem] rotate-[-25deg]"
          />
        </div>
        <div className="bg-[#1a2e1a]/90 rounded p-4 w-full border-2 border-[#ffffff15]">{children}</div>
      </div>
    </div>
  );
});

const InnerContainer = forwardRef(function InnerContainer(
  { className, children, ...props },
  ref
) {
  return (
    <div
      ref={ref}
      className={clsx(
        "flex flex-col m-3 space-y-5 min-w-[15rem] h-full rounded-2xl",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
});

const ScoreDisplay = ({ score }) => (
  <div className="text-center mb-4 animate-pulse">
    <div className={`text-4xl font-pixel ${score < 0 ? 'text-red-400' : 'text-green-400'} mb-2 glow-text`}>
      {score}
    </div>
    <div className="text-sm font-pixel text-white/80">
      POINTS
    </div>
  </div>
);

export const Container = forwardRef(function Container(
  { children, score, ...props },
  ref
) {
  return (
    <OuterContainer ref={ref} {...props}>
      <InnerContainer>
        {score !== undefined && <ScoreDisplay score={score} />}
        {children}
      </InnerContainer>
    </OuterContainer>
  );
});

Container.Outer = OuterContainer;
Container.Inner = InnerContainer;
