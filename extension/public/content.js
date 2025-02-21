// Single GIF URL to be used throughout the bobbing phase
const SLOTH_GIF_URL = chrome.runtime.getURL("sloth-think.gif");
// GIF URL for the sloth during its initial flight and for flying away
const CLIMBING_SLOTH_GIF_URL = chrome.runtime.getURL("sloth-climb.gif");

// Guard against multiple injections
if (window.hasOwnProperty('SLOTH_GIF_URL')) {
  console.debug('Content script already loaded, skipping initialization');
} else {
  window.SLOTH_GIF_URL = chrome.runtime.getURL('sloth.gif');
  window.SLOTH_MAD_GIF_URL = chrome.runtime.getURL('sloth-mad.gif');
  
  let currentOwl = null;
  let madSloth = null;
  let thoughtBubble = null;
  let isShowingScore = false;
  let redirectTimer = null;

  // Append CSS for bobbing animation if not already present
  (function addBobbingAnimationCSS() {
    if (document.getElementById('bobbingAnimationStyle')) return;
    const styleElem = document.createElement('style');
    styleElem.id = 'bobbingAnimationStyle';
    styleElem.innerHTML = `
      @keyframes bob {
        0% { transform: translateY(0); }
        50% { transform: translateY(10px); }
        100% { transform: translateY(0); }
      }
    `;
    document.head.appendChild(styleElem);
  })();

  // Function to create and display a thought bubble next to the owl
  function addThoughtBubble(message) {
    console.log("addThoughtBubble called with message:", message);
    if (!currentOwl) {
      console.log("No owl found!");
      return;
    }
    
    // Remove any existing thought bubbles first
    removeThoughtBubble();
    
    thoughtBubble = document.createElement("div");
    thoughtBubble.id = "thoughtBubble";
    thoughtBubble.style.position = "fixed";
    thoughtBubble.style.padding = "15px";
    thoughtBubble.style.background = "#2a3b2a";
    thoughtBubble.style.border = "2px solid #ffffff20";
    thoughtBubble.style.borderRadius = "10px";
    thoughtBubble.style.color = "#9ba793";
    thoughtBubble.style.fontFamily = "'Press Start 2P', cursive";
    thoughtBubble.style.fontSize = "12px";
    thoughtBubble.style.zIndex = "999999999";
    thoughtBubble.style.minWidth = "200px";
    thoughtBubble.style.textAlign = "center";
    thoughtBubble.style.boxShadow = "0 0 10px rgba(0,0,0,0.5)";
    thoughtBubble.textContent = message;

    // Add the stem using a pseudo-element
    const styleSheet = document.createElement("style");
    styleSheet.textContent = `
      #thoughtBubble::before {
        content: '';
        position: absolute;
        right: -20px;
        top: 50%;
        border: 10px solid transparent;
        border-left-color: #2a3b2a;
        transform: translateY(-50%);
      }
      #thoughtBubble::after {
        content: '';
        position: absolute;
        right: -17px;
        top: 50%;
        border: 10px solid transparent;
        border-left-color: #2a3b2a;
        transform: translateY(-50%);
      }
    `;
    document.head.appendChild(styleSheet);

    // Position the bubble relative to the sloth - moved more to the left
    const slothRect = currentOwl.getBoundingClientRect();
    thoughtBubble.style.bottom = `${window.innerHeight - slothRect.top - 100}px`;
    thoughtBubble.style.right = `${window.innerWidth - slothRect.right + 125}px`; 

    document.body.appendChild(thoughtBubble);
    console.log("Thought bubble added to page with text:", message);
  }

  // Function to remove the thought bubble
  function removeThoughtBubble() {
    console.log("removeThoughtBubble called");
    // Remove any existing thought bubbles by ID
    const bubbles = document.querySelectorAll("#thoughtBubble");
    bubbles.forEach(bubble => bubble.remove());
    thoughtBubble = null;
  }

  // Function to make the owl fly in from the top-right corner
  function animateOwlIntoScreen() {
    if (currentOwl) {
      currentOwl.remove();
      currentOwl = null;
    }

    currentOwl = document.createElement("img");
    currentOwl.src = CLIMBING_SLOTH_GIF_URL;
    currentOwl.style.position = "fixed";
    currentOwl.style.top = "0px";
    currentOwl.style.right = "-200px"; 
    currentOwl.style.width = "150px";
    currentOwl.style.zIndex = "9999";
    currentOwl.style.transition = "top 0.75s ease-out, right 0.75s ease-out";

    document.body.appendChild(currentOwl);

    setTimeout(() => {
      currentOwl.style.top = "40px";
      currentOwl.style.right = "20px";

      currentOwl.addEventListener('transitionend', () => {
        setTimeout(() => {
          currentOwl.src = SLOTH_GIF_URL;
          currentOwl.style.transition = "";
          currentOwl.style.animation = "bob 2s infinite ease-in-out";
          
          // Only show "Hmm..." if we're not showing a score
          if (!isShowingScore) {
            addThoughtBubble("Hmm...");
          }
        }, 500);
      }, { once: true });
    }, 100);
  }

  // Function to animate the owl flying away to the right and disappearing with a flying GIF
  function animateOwlAway() {
    if (!currentOwl) return;
    
    // Animate thought bubble away with the sloth
    const bubbles = document.querySelectorAll("#thoughtBubble");
    bubbles.forEach(bubble => {
      bubble.style.transition = "right 1.5s ease-in, opacity 1.5s ease-in";
      bubble.style.right = "-300px";
      bubble.style.opacity = "0";
      
      bubble.addEventListener('transitionend', () => {
        bubble.remove();
      }, { once: true });
    });

    currentOwl.src = CLIMBING_SLOTH_GIF_URL;
    currentOwl.style.animation = "";
    currentOwl.style.transition = "right 1.5s ease-in, opacity 1.5s ease-in";
    currentOwl.style.right = "-300px";
    currentOwl.style.opacity = "0";

    currentOwl.addEventListener('transitionend', () => {
      if (currentOwl && currentOwl.parentElement) {
        currentOwl.parentElement.removeChild(currentOwl);
        currentOwl = null;
      }
    }, { once: true });
  }

  // Function to scan page content for keywords
  function parsePageForWord(searchWord) {
    try {
      // First check if game is still active
      chrome.storage.local.get(['gameActive', 'searchWord', 'score'], function(data) {
        if (!data.gameActive || !data.searchWord) {
          console.log('Game not active or no search word, skipping word search');
          return;
        }
        
        console.log("Searching for word:", searchWord);
        const escapedWord = searchWord.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const wordRegEx = new RegExp(`\\b${escapedWord}\\b`, 'gi');
        
        // Get text content in a safer way
        const pageText = document.body ? document.body.innerText || document.body.textContent || "" : "";
        console.log("Searching in text:", pageText);
        
        let matches = pageText.match(wordRegEx);
        const count = matches ? matches.length : 0;
        console.log(`Found ${count} matches for "${searchWord}"`);
        
        // Update score based on whether word was found
        const currentScore = data.score || 0;
        const newScore = count >= 5 ? currentScore + 5 : currentScore - 5;
        
        // Update the score in storage and thought bubble
        chrome.storage.local.set({ 
          score: newScore,
          lastSearchResult: {
            word: searchWord,
            count: count,
            timestamp: Date.now()
          }
        }, () => {
          console.log(`Score updated to ${newScore} (${count >= 5 ? '+5' : '-5'})`);
          
          // Update thought bubble with results
          removeThoughtBubble();
          if (count >= 5) {
            addThoughtBubble(`Found "${searchWord}" ${count} times! (+5)`);
          } else {
            addThoughtBubble(`Not enough matches for "${searchWord}" (${count} found) (-5)`);
            
            // Show mad sloth and redirect to Google search after delay
            setTimeout(() => {
              animateMadSloth();
              
              // Redirect to Google search after showing mad sloth
              setTimeout(() => {
                const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(searchWord)}`;
                window.location.href = searchUrl;
              }, 3000);
            }, 1000);
          }
        });
        
        // Send result back to background script
        chrome.runtime.sendMessage({
          action: 'wordSearchResult',
          found: count >= 5,
          count: count
        });
      });
    } catch (error) {
      console.log("Error parsing page:", error);
      return 0;
    }
  }

  function getRandomEducationalUrl() {
    const domains = [
      "https://www.khanacademy.org",
      "https://www.codecademy.com",
      "https://www.duolingo.com",
      "https://learning.linkedin.com",
      "https://www.skillshare.com"
    ];
    return domains[Math.floor(Math.random() * domains.length)];
  }

  function animateMadSloth() {
    // Remove existing mad sloth if any
    if (madSloth) {
      madSloth.remove();
    }

    // Create mad sloth element
    madSloth = document.createElement('img');
    madSloth.src = SLOTH_MAD_GIF_URL;
    madSloth.style.cssText = `
      position: fixed;
      left: 50%;
      width: 500px;
      height: 500px;
      z-index: 2147483647;
      transform: translate(-50%, 100%);
      transition: transform 1s ease-out;
      filter: drop-shadow(0 0 20px rgba(0,0,0,0.5));
    `;

    // Start from below the viewport
    madSloth.style.bottom = '-100px';
    document.body.appendChild(madSloth);

    // Trigger animation after a brief delay
    setTimeout(() => {
      madSloth.style.transform = 'translate(-50%, 10%)';
      madSloth.style.bottom = '0';
    }, 100);

    // Check game mode and redirect accordingly
    chrome.storage.local.get(['searchWord'], function(data) {
      setTimeout(() => {
        if (madSloth) {
          madSloth.style.transform = 'translate(-50%, 100%)';
          setTimeout(() => {
            if (madSloth) {
              madSloth.remove();
              madSloth = null;
              
              // Redirect based on game mode
              if (data.searchWord) {
                // Input game mode - redirect to Google search
                window.location.href = `https://www.google.com/search?q=${encodeURIComponent(data.searchWord)}`;
              } else {
                // No input game mode - redirect to random educational site
                window.location.href = getRandomEducationalUrl();
              }
            }
          }, 1000);
        }
      }, 3000);
    });
  }

  // Listen for messages from popup.js or background.js
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    try {
      if (message.action === "flyOwl") {
        console.log('Received message:', message); // Debug log
        
        // Check game state before proceeding
        chrome.storage.local.get(['gameActive', 'searchWord', 'lastSearchResult', 'score'], function(data) {
          if (!data.gameActive) {
            console.log('Game not active, skipping animation');
            return;
          }
          
          // Always remove existing owl and thought bubble before creating new ones
          if (currentOwl) {
            currentOwl.remove();
            currentOwl = null;
          }
          removeThoughtBubble();

          animateOwlIntoScreen();
          
          // Handle different game modes
          if (data.searchWord || message.word) {
            const searchWord = data.searchWord || message.word;
            
            // Prevent duplicate searches within a short time window
            const now = Date.now();
            if (data.lastSearchResult && 
                data.lastSearchResult.word === searchWord && 
                now - data.lastSearchResult.timestamp < 2000) {
              console.log('Skipping duplicate search');
              return;
            }
            
            // First show "Hmm..." message
            setTimeout(() => {
              addThoughtBubble("Hmm...");
              
              // Then after a delay, perform the word search
              setTimeout(() => {
                parsePageForWord(searchWord);
              }, 2000);
            }, 1000);
          } else if (!data.searchWord && data.gameActive) {
            // No-input game mode
            isShowingScore = true;
            setTimeout(() => {
              const score = message.currentScore || data.score || 0;
              console.log('Current score:', score, 'Score change:', message.scoreChange);
              
              // Handle score display
              if (message.scoreChange < 0) {
                console.log('Negative score change detected');
                addThoughtBubble(`Score: ${score}`);
                
                // Only show mad sloth if score is actually negative
                if (score < 0) {
                  console.log('Score is negative, showing mad sloth');
                  setTimeout(animateMadSloth, 2000);
                }
              } else {
                addThoughtBubble(`Score: ${score}`);
              }
            }, 1000);

            setTimeout(() => {
              isShowingScore = false;
            }, 3000);
          }
        });

        sendResponse({ status: "Message handled" });
      } else if (message.action === "flyOwlAway") {
        animateOwlAway();
        sendResponse({ status: "Owl fly-away animation triggered" });
      } else if (message.action === "removeThoughtBubble") {
        removeThoughtBubble();
        sendResponse({ status: "Thought bubble removed" });
      }
    } catch (error) {
      console.log("Error handling message:", error);
      sendResponse({ status: "Error occurred", error: error.message });
    }
    
    return true;
  });
}
