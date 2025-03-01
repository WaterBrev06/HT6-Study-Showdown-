/* global chrome */
let visitedUrls = new Set(); 
let bad = 0;
let siteTimer = null;  // Declare siteTimer at the top level
let gameTimerInterval = null;  // Make sure this is also declared
let lastUrl = '';

// Object to store educational domains and their visit counts
const educationalDomains = {
  "khanacademy.org": 0,
  "codecademy.com": 0,
  "duolingo.com": 0,
  "learning.linkedin.com": 0,
  "skillshare.com": 0,
  "udemy.com": 0,
  "coursera.org": 0,
  "edx.org": 0,
  "udacity.com": 0,
  "brilliant.org": 0,
  "ocw.mit.edu": 0,
  "scholar.google.com": 0,
  "quizlet.com": 0,
};


// Update helper function to check for default Chrome pages
function isDefaultChromePage(url) {
  const defaultPatterns = [
    'chrome://',
    'chrome-search://',
    'https://www.google.com/_/chrome/newtab',
    'chrome://newtab',
    'chrome://new-tab-page',
    'about:blank',
    'chrome-search://local-ntp'
  ];
  
  // Check if URL is undefined, null, empty, or matches any default patterns
  return !url || 
         url === '' || 
         defaultPatterns.some(pattern => url.startsWith(pattern));
}

// Helper function to safely send messages to tabs
function sendMessageToTab(tabId, message) {
  chrome.tabs.sendMessage(tabId, message, response => {
    if (chrome.runtime.lastError) {
      // Silently handle expected errors like closed/invalid tabs
      return;
    }
  });
}

function handleTabChange() {
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    if (tabs.length === 0) return;

    const activeTab = tabs[0];
    const url = activeTab.url;

    if (isDefaultChromePage(url)) return;

    chrome.storage.local.get(['searchWord', 'score', 'gameActive'], function(data) {
      if (!data.gameActive) return;
      if (data.searchWord) return;

      const currentScore = data.score || 0;
      const isEducational = Object.keys(educationalDomains).some((domain) => {
        if (url.includes(domain)) {
          educationalDomains[domain] += 1;
          return true;
        }
        return false;
      });

      if (isEducational) {
        if (!visitedUrls.has(url)) {
          visitedUrls.add(url);
          const newScore = currentScore + 10;
          chrome.storage.local.set({ score: newScore });
          sendMessageToTab(activeTab.id, { 
            action: "flyOwl", 
            scoreChange: 10,
            currentScore: newScore,
            message: `Score: ${newScore}`
          });
        }
      } else {
        const newScore = currentScore - 5;
        chrome.storage.local.set({ score: newScore });
        sendMessageToTab(activeTab.id, { 
          action: "flyOwl",
          type: "madSloth",
          scoreChange: -5,
          currentScore: newScore,
          message: `Score: ${newScore}`
        });
        bad += 1;
      }
    });
  });
}

function getUserInfo() {
  chrome.identity.getAuthToken({ interactive: true }, function (token) {
    if (chrome.runtime.lastError) {
      console.error(chrome.runtime.lastError);
      return;
    }

    fetch('https://www.googleapis.com/oauth2/v1/userinfo?alt=json', {
      headers: {
        'Authorization': 'Bearer ' + token
      }
    })
    .then(response => response.json())
    .then(data => {
      if (data.email && data.name) {
      chrome.storage.local.set({
        userEmail: data.email,
        userName: data.name
        });
      console.log('User Email:', data.email);
      console.log('User Name:', data.name);
      } else {
        console.error('Failed to retrieve email or name:', data);
      }
    })
    .catch(error => console.error('Error fetching user info:', error));
  });
}

function handleEndGame() {
  chrome.storage.local.get(['score', 'userEmail', 'userName'], function (data) {
    const recentScore = data.score || 0;
    const userEmail = data.userEmail || '';
    const userName = data.userName || '';

    // Save these values to Chrome's storage to be accessed by the popup
    chrome.storage.local.set({
      recentScore: recentScore,
      userEmail: userEmail,
      userName: userName
    });

    // Log the values for debugging
    console.log('Recent Score:', recentScore);
    console.log('User Email:', userEmail);
    console.log('User Name:', userName);
  });
}

// Add this function definition before it's used
function handleGameEnd() {
  chrome.storage.local.get(['score', 'userEmail', 'userName'], function(data) {
    const recentScore = data.score || 0;
    const userEmail = data.userEmail || '';
    const userName = data.userName || '';

    // Save these values to Chrome's storage
    chrome.storage.local.set({
      recentScore: recentScore,
      gameActive: false,
      searchWord: null,
      remainingTime: 0
    });

    // Clear all timers
    if (gameTimerInterval) {
      clearInterval(gameTimerInterval);
      gameTimerInterval = null;
    }
    if (siteTimer) {
      clearInterval(siteTimer);
      siteTimer = null;
    }

    // Send flyOwlAway message to all tabs
    chrome.tabs.query({}, tabs => {
      tabs.forEach(tab => {
        sendMessageToTab(tab.id, { action: "flyOwlAway" });
      });
    });

    // Log the values for debugging
    console.log('Recent Score:', recentScore);
    console.log('User Email:', userEmail);
    console.log('User Name:', userName);

    // Clear alarms when game ends
    chrome.alarms.clear('tenSecondUpdateTimer');
    chrome.alarms.clear('scoreUpdateTimer');
  });
}

// Listen for when the active tab changes
chrome.tabs.onActivated.addListener(function (activeInfo) {
  handleTabChange();
});

// Listen for when a tab's URL is updated
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete") {
    handleTabChange(); // Only log when the URL changes
  }
});

// Detect when a tab is updated (page load or reload)
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete" && tab.url) {
    chrome.storage.local.get(["gameActive", "searchWord"], function(data) {
      if (data.gameActive || data.searchWord) {
        chrome.tabs.sendMessage(tabId, { 
          action: "flyOwl",
          word: data.searchWord 
        }, (response) => {
          if (chrome.runtime.lastError) {
          }
        });
      }
    });
  }
});

// Detect when a new tab is created
chrome.tabs.onCreated.addListener((tab) => {
  chrome.storage.local.get("gameActive", function(data) {
    if (data.gameActive) {
      // Trigger owl animation on new tab
      chrome.tabs.sendMessage(tab.id, { action: "flyOwl" }, (response) => {
        if (chrome.runtime.lastError) {
        }
      });
    }
  });
});

// Detect when the user switches between tabs
chrome.tabs.onActivated.addListener((activeInfo) => {
  chrome.storage.local.get(["gameActive", "searchWord"], function(data) {
    if (data.gameActive || data.searchWord) {
      chrome.tabs.sendMessage(activeInfo.tabId, { 
        action: "flyOwl",
        word: data.searchWord 
      }, (response) => {
        if (chrome.runtime.lastError) {
        }
      });
    }
  });
});

// Timer management
let timerInterval;

function startTimer() {
  chrome.storage.local.get(['remainingTime'], function (data) {
    let remainingTime = data.remainingTime || 60;
    timerInterval = setInterval(() => {
      remainingTime -= 1;
      chrome.storage.local.set({ remainingTime });

      if (remainingTime <= 0) {
        clearInterval(timerInterval);
        chrome.storage.local.set({ gameActive: false, remainingTime: 60 });
        console.log("Game ended due to timer");
      }
    }, 1000);
  });
}

function stopTimer() {
  clearInterval(timerInterval);
  chrome.storage.local.set({ remainingTime: 60 });
}

// Listen for messages from the popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'startGame') {
    // Clear any existing timers
    if (gameTimerInterval) {
      clearInterval(gameTimerInterval);
      gameTimerInterval = null;
    }
    if (siteTimer) {
      clearInterval(siteTimer);
      siteTimer = null;
    }

    const durationInMinutes = message.duration || 1;
    const durationInSeconds = durationInMinutes * 60;
    let timeRemaining = durationInSeconds;
    
    // Reset score and store initial game state
    chrome.storage.local.get(['searchWord'], (data) => {
      chrome.storage.local.set({ 
        gameActive: true,
        remainingTime: durationInSeconds,
        duration: durationInMinutes,
        score: 0,
        searchWord: data.searchWord || null
      });
    });

    // Create both alarms when game starts
    chrome.alarms.create('scoreUpdateTimer', {
      periodInMinutes: 1
    });
    
    chrome.alarms.create('tenSecondUpdateTimer', {
      periodInMinutes: 1/6  // Exactly 10 seconds
    });

    if (message.searchWord) {
      // If there's a search word, show sloth immediately on all tabs
      chrome.tabs.query({}, (tabs) => {
        tabs.forEach((tab) => {
          chrome.tabs.sendMessage(tab.id, { 
            action: "flyOwl",
            word: message.searchWord
          }, (response) => {
            if (chrome.runtime.lastError) {
              console.error(`Error sending flyOwl to tab ${tab.id}:`, chrome.runtime.lastError);
            }
          });
        });
      });
    } else {
      // If no search word, reload the active tab
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]) {
          chrome.tabs.reload(tabs[0].id);
        }
      });
    }

    // Clear visited URLs when starting new game
    visitedUrls.clear();
    bad = 0;

    // Start timer countdown with the new interval
    gameTimerInterval = setInterval(() => {
      timeRemaining--;
      chrome.storage.local.set({ remainingTime: timeRemaining });

      if (timeRemaining <= 0) {
        clearInterval(gameTimerInterval);
        gameTimerInterval = null;
        handleGameEnd();
      }
    }, 1000);
  } else if (message.action === 'endGame') {
    // Clear timer when game ends
    if (gameTimerInterval) {
      clearInterval(gameTimerInterval);
      gameTimerInterval = null;
    }
    chrome.storage.local.set({ 
      gameActive: false,
      searchWord: null  // Explicitly ensure searchWord is cleared
    }, function () {
      stopTimer();
      handleEndGame();
    });
    chrome.alarms.clear('endGameTimer');
  }
});

// Make sure to clear interval when extension is unloaded
chrome.runtime.onSuspend.addListener(() => {
  if (gameTimerInterval) {
    clearInterval(gameTimerInterval);
    gameTimerInterval = null;
  }
});

// Clear visited URLs when game ends
chrome.storage.local.get("gameActive", function (data) {
  if (!data.gameActive) {
    visitedUrls.clear();
  }
});

// Get user info on startup
chrome.runtime.onStartup.addListener(() => {
  getUserInfo();
});

// Get user info when the extension is installed
chrome.runtime.onInstalled.addListener(() => {
  getUserInfo();
});

// Handle periodic score updates
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'scoreUpdateTimer') {
    chrome.tabs.query({ active: true, currentWindow: true }, async function(tabs) {
      if (!tabs[0] || !tabs[0].url) return;
      
      const data = await chrome.storage.local.get(['gameActive', 'score', 'searchWord']);
      if (!data.gameActive) return;

      const currentUrl = tabs[0].url;
      
      // Skip score updates for default Chrome pages
      if (isDefaultChromePage(currentUrl)) {
        return;
      }

      // Skip periodic updates if in word search mode
      if (data.searchWord) {
        return;
      }

      // Only apply periodic scoring in no-input mode
      const isEducational = Object.keys(educationalDomains).some(domain => 
        currentUrl.includes(domain)
      );

      const newScore = isEducational ? data.score + 5 : data.score - 5;
      
      await chrome.storage.local.set({ score: newScore });
      
      try {
        sendMessageToTab(tabs[0].id, { 
          action: "flyOwl",
          scoreChange: isEducational ? 5 : -5
        });
      } catch (error) {
        // Silently handle any remaining errors
      }
    });
  } else if (alarm.name === 'endGameTimer') {
    console.log('Timer ended, sending owl away on all tabs');
    // Send owl away on all tabs
    chrome.tabs.query({}, (tabs) => {
      tabs.forEach((tab) => {
        try {
          chrome.tabs.sendMessage(tab.id, { action: "flyOwlAway" }, (response) => {
            if (chrome.runtime.lastError) {
              console.error(`Error sending flyOwlAway to tab ${tab.id}:`, chrome.runtime.lastError);
            } else {
              console.log(`Owl flew away on tab ${tab.id}`);
            }
          });
        } catch (error) {
          console.error(`Error sending message to tab ${tab.id}:`, error);
        }
      });
    });
    
    // Reset game state
    chrome.storage.local.set({ 
      gameActive: false, 
      searchWord: null 
    }, () => {
      console.log('Game state reset after timer end');
    });
  } else if (alarm.name === 'tenSecondUpdateTimer') {
    chrome.tabs.query({ active: true, currentWindow: true }, async function(tabs) {
      if (!tabs[0] || !tabs[0].url) return;
      
      const data = await chrome.storage.local.get(['gameActive', 'score', 'searchWord']);
      if (!data.gameActive) return;

      const currentUrl = tabs[0].url;
      
      if (isDefaultChromePage(currentUrl)) return;
      if (data.searchWord) return;

      const isEducational = Object.keys(educationalDomains).some(domain => 
        currentUrl.includes(domain)
      );

      const currentScore = data.score || 0;
      
      if (isEducational) {
        const newScore = currentScore + 5;
        await chrome.storage.local.set({ score: newScore });
        
        chrome.tabs.sendMessage(tabs[0].id, { 
          action: "flyOwl",
          scoreChange: 5,
          currentScore: newScore,
          message: `Score: ${newScore}`
        });
      } else {
        const newScore = currentScore - 5;
        await chrome.storage.local.set({ score: newScore });
        
        chrome.tabs.sendMessage(tabs[0].id, { 
          action: "flyOwl",
          type: "madSloth",
          scoreChange: -5,
          currentScore: newScore,
          message: `Score: ${newScore}`
        });

        // Debug log
        console.log('Sending score update for mad sloth:', {
          newScore,
          currentScore,
          change: -5
        });
      }
    });
  }
});