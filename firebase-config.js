// Expose Firebase configuration as globals for non-module script tags.
// Do not add imports here; index.html loads Firebase SDK as ES modules separately.
window.firebaseConfig = {
  apiKey: "AIzaSyB8bnMtpfuJSA-SdRMnAwhr9d7oqUuSy3U",
  authDomain: "cardiolink-214bc.firebaseapp.com",
  projectId: "cardiolink-214bc",
  storageBucket: "cardiolink-214bc.firebasestorage.app",
  messagingSenderId: "321461622986",
  appId: "1:321461622986:web:861ca0592262ccbb42bc33",
  measurementId: "G-H66W5DN354"
};

// Gemini direct-call (browser) API key. Hard-coding here will expose the key to anyone who can load the page.
// Replace the placeholder with your actual key only if you accept that risk.
window.geminiApiKey = "AIzaSyA5r0aFE7hzwbOpNqGAnwC8JLEq6aWjpE0";

// Optional proxy (not used); keep blank to force direct API key usage in-browser.
window.geminiProxyUrl = "";