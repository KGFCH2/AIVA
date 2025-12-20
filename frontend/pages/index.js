import { useState, useEffect, useRef } from "react";
import Head from "next/head";
import JarvisLoader from "../components/JarvisLoader";

const API_KEY = process.env.NEXT_PUBLIC_API_KEY;

export default function Home() {
  const [status, setStatus] = useState("System Offline");
  const [lastCommand, setLastCommand] = useState("");
  const [response, setResponse] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState(null);
  const [isSupported, setIsSupported] = useState(true);
  const [voices, setVoices] = useState([]);
  const [selectedVoice, setSelectedVoice] = useState(null);
  const [systemStarted, setSystemStarted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // Ref to keep track of the selected voice in callbacks/closures
  const voiceRef = useRef(null);

  // Sync ref with state and update recognition language
  useEffect(() => {
    voiceRef.current = selectedVoice;
    if (recognition && selectedVoice) {
      // Map voice language to recognition language if needed, or use directly
      // Most voices have a lang property like 'en-US', 'hi-IN', etc.
      console.log("Setting recognition language to:", selectedVoice.lang);
      recognition.lang = selectedVoice.lang;
    }
  }, [selectedVoice, recognition]);

  // 🎙️ Setup Speech Recognition & Voices
  useEffect(() => {
    if (typeof window !== "undefined") {
      // Load Voices
      const loadVoices = () => {
        const availableVoices = window.speechSynthesis.getVoices();
        console.log("Voices loaded:", availableVoices.length);
        
        // Filter: Keep only English and Indian languages
        const filteredVoices = availableVoices.filter(voice => {
            const lang = voice.lang;
            return lang.includes('en') || // English
                   lang.includes('hi') || // Hindi
                   lang.includes('bn') || // Bengali
                   lang.includes('ta') || // Tamil
                   lang.includes('te') || // Telugu
                   lang.includes('mr') || // Marathi
                   lang.includes('gu') || // Gujarati
                   lang.includes('kn') || // Kannada
                   lang.includes('ml') || // Malayalam
                   lang.includes('IN');   // Generic Indian region
        });

        // Sort: Prioritize Indian accents/languages, then other English
        const sortedVoices = filteredVoices.sort((a, b) => {
            const aIsIndian = a.lang.includes('IN');
            const bIsIndian = b.lang.includes('IN');
            if (aIsIndian && !bIsIndian) return -1;
            if (!aIsIndian && bIsIndian) return 1;
            return 0;
        });

        setVoices(sortedVoices);
        
        // Check if any Indian voices were found
        const hasIndianVoices = sortedVoices.some(v => v.lang.includes('IN'));
        if (!hasIndianVoices && availableVoices.length > 0) {
            console.warn("No Indian voices found. Please install language packs in your OS settings.");
        }
        
        // Try to find a good "JARVIS" or "AI" voice (Prioritize Indian English if available)
        const preferredVoice = sortedVoices.find(v => 
          v.name.includes("Google US English") || 
          v.name.includes("Microsoft Zira") || 
          v.name.includes("Samantha")
        ) || sortedVoices[0];
        
        if (preferredVoice) {
          console.log("Selected voice:", preferredVoice.name);
          setSelectedVoice(preferredVoice);
        }
      };

      loadVoices();
      window.speechSynthesis.onvoiceschanged = loadVoices;

      // Setup Recognition
      if ("webkitSpeechRecognition" in window) {
        const rec = new window.webkitSpeechRecognition();
        rec.continuous = false;
        rec.interimResults = false;
        rec.lang = "en-US";

        rec.onstart = () => {
          console.log("Recognition started");
          setIsListening(true);
          setStatus("Listening...");
        };

        rec.onresult = (event) => {
          const command = event.results[0][0].transcript;
          console.log("Command received:", command);
          setLastCommand(command);
          setResponse(""); // Clear previous response
          setStatus("Processing...");
          processCommand(command);
        };

        rec.onend = () => {
          console.log("Recognition ended");
          setIsListening(false);
        };

        rec.onerror = (event) => {
          console.error("Speech recognition error", event.error);
          setStatus("System Online");
          setIsListening(false);
        };

        setRecognition(rec);
      } else {
        setIsSupported(false);
        setStatus("Voice Input Not Supported");
      }
    }
  }, []);

  // 🚀 Initialize System
  const initializeSystem = () => {
    setSystemStarted(true);
    setStatus("System Online");
    // Force a voice load check
    const availableVoices = window.speechSynthesis.getVoices();
    if (availableVoices.length > 0 && !selectedVoice) {
       setSelectedVoice(availableVoices[0]);
    }
    speakResponse("I am AIVA, made by Debasmita, how can I assist you?");
  };

  // Audio Context Ref
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const dataArrayRef = useRef(null);
  const sourceRef = useRef(null);
  const [volume, setVolume] = useState(0);

  // Initialize Audio Context
  const initAudio = async () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
      const bufferLength = analyserRef.current.frequencyBinCount;
      dataArrayRef.current = new Uint8Array(bufferLength);
    }
  };

  // Play UI Sound
  const playSound = (type) => {
    if (!audioContextRef.current) return;
    const osc = audioContextRef.current.createOscillator();
    const gain = audioContextRef.current.createGain();
    osc.connect(gain);
    gain.connect(audioContextRef.current.destination);

    if (type === 'start') {
      osc.frequency.setValueAtTime(440, audioContextRef.current.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, audioContextRef.current.currentTime + 0.1);
      gain.gain.setValueAtTime(0.1, audioContextRef.current.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioContextRef.current.currentTime + 0.1);
      osc.start();
      osc.stop(audioContextRef.current.currentTime + 0.1);
    } else if (type === 'end') {
      osc.frequency.setValueAtTime(880, audioContextRef.current.currentTime);
      osc.frequency.exponentialRampToValueAtTime(440, audioContextRef.current.currentTime + 0.1);
      gain.gain.setValueAtTime(0.1, audioContextRef.current.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioContextRef.current.currentTime + 0.1);
      osc.start();
      osc.stop(audioContextRef.current.currentTime + 0.1);
    }
  };

  // ▶ Start Listening
  const startListening = async () => {
    await initAudio();
    playSound('start');
    
    if (recognition) {
      try {
        recognition.start();
        
        // Start Audio Visualizer
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            sourceRef.current = audioContextRef.current.createMediaStreamSource(stream);
            sourceRef.current.connect(analyserRef.current);
            updateVolume();
        } catch (err) {
            console.error("Error accessing microphone for visualizer:", err);
        }

      } catch (e) {
        console.error("Start error:", e);
      }
    }
  };

  const updateVolume = () => {
    if (!analyserRef.current || !isListening) return;
    analyserRef.current.getByteFrequencyData(dataArrayRef.current);
    const avg = dataArrayRef.current.reduce((a, b) => a + b) / dataArrayRef.current.length;
    setVolume(avg);
    if (isListening) {
        requestAnimationFrame(updateVolume);
    }
  };

  // Stop Visualizer when listening stops
  useEffect(() => {
      if (!isListening) {
          if (sourceRef.current) {
              // sourceRef.current.disconnect(); // Optional: disconnect if needed
          }
          setVolume(0);
          if (audioContextRef.current && audioContextRef.current.state === 'running') {
             playSound('end');
          }
      } else {
          if (analyserRef.current) {
              updateVolume();
          }
      }
  }, [isListening]);

  // 🌐 Send command to backend
  const processCommand = async (command) => {
    try {
      console.log("Sending to backend...");
      const res = await fetch("/api/voice", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": API_KEY
        },
        body: JSON.stringify({ command })
      });

      const data = await res.json();
      console.log("Backend response:", data);

      if (res.ok) {
        setResponse(data.response);
        setStatus("Response Ready");
        speakResponse(data.response);
        setTimeout(() => setStatus("System Online"), 3000);
      } else {
        handleError("Error processing command");
      }
    } catch (error) {
      console.error("Fetch error:", error);
      handleError("Network error");
    }
  };

  // 🔊 Speak response
  const speakResponse = (text) => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      console.log("Speaking:", text);
      window.speechSynthesis.cancel(); // Stop previous speech

      const utterance = new SpeechSynthesisUtterance(text);
      
      // Use the ref to get the current selected voice, even inside stale closures
      const currentVoice = voiceRef.current;

      if (currentVoice) {
        utterance.voice = currentVoice;
      } else {
        // Fallback: try to get voices again
        const voices = window.speechSynthesis.getVoices();
        if (voices.length > 0) {
            utterance.voice = voices[0];
        }
      }

      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      
      utterance.onend = () => {
          console.log("Speech finished");
      };
      
      utterance.onerror = (e) => {
          console.error("Speech error:", e);
      };

      window.speechSynthesis.speak(utterance);
    } else {
        console.error("Speech synthesis not supported");
    }
  };

  // Typewriter Effect Hook
  const useTypewriter = (text, speed = 20) => {
    const [displayText, setDisplayText] = useState('');
    
    useEffect(() => {
      if (!text) {
        setDisplayText('');
        return;
      }
      
      let i = 0;
      setDisplayText('');
      
      const timer = setInterval(() => {
        if (i < text.length) {
          i++;
          setDisplayText(text.substring(0, i));
        } else {
          clearInterval(timer);
        }
      }, speed);

      return () => clearInterval(timer);
    }, [text, speed]);
    
    return displayText;
  };

  // Component for Typewriter Text
  const TypewriterText = ({ text }) => {
    const displayText = useTypewriter(text);
    return <span>{displayText}</span>;
  };

  // ❌ Error handler
  const handleError = (msg) => {
    setResponse(msg);
    setStatus("Error");
    speakResponse(msg);
    setTimeout(() => setStatus("System Online"), 3000);
  };

  return (
    <div className="container">
      <Head>
        <title>AIVA - Artificial Intelligence Voice Assistant</title>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
      </Head>
      
      {isLoading && <JarvisLoader onFinish={() => setIsLoading(false)} />}

      {/* HUD Corners */}
      <div className="hud-corner top-left">
        SYSTEM: ONLINE<br/>
        CPU: 12%<br/>
        MEM: 4.2GB
      </div>
      
      <div className="hud-corner bottom-left">
        PWR: 98%<br/>
        TMP: 34°C
      </div>
      <div className="hud-corner bottom-right">
        VER: 2.0.1<br/>
        BLD: ALPHA
      </div>

      {!systemStarted && (
        <div className="start-overlay">
          <button className="start-btn" onClick={initializeSystem}>
            INITIALIZE AIVA PROTOCOL
          </button>
        </div>
      )}

      <div className="voice-controls">
        <select 
          className="voice-select"
          onChange={(e) => {
            const voice = voices.find(v => v.name === e.target.value);
            setSelectedVoice(voice);
            const utterance = new SpeechSynthesisUtterance("Voice system updated.");
            utterance.voice = voice;
            window.speechSynthesis.speak(utterance);
          }}
          value={selectedVoice?.name || ""}
        >
          {voices.length === 0 && <option>Loading voices...</option>}
          {voices.map((voice) => (
            <option key={voice.name} value={voice.name}>
              {voice.name} ({voice.lang})
            </option>
          ))}
        </select>
        {voices.length > 0 && !voices.some(v => v.lang.includes('IN')) && (
            <div style={{fontSize: '0.7rem', color: 'rgba(0,255,255,0.5)', textAlign: 'right', marginTop: '5px'}}>
                * Install OS language packs for Indian voices
            </div>
        )}
      </div>

      <h1 className="title">AIVA</h1>
      <p className="subtitle">ARTIFICIAL INTELLIGENCE VOICE ASSISTANT</p>

      <div className="mic-container">
        <div className="arc-reactor">
            <div className="ring-1" style={{ transform: `scale(${1 + volume / 100})`, boxShadow: `0 0 ${20 + volume}px rgba(0, 255, 255, 0.5)` }}></div>
            <div className="ring-2" style={{ transform: `rotate(${Date.now() / 50}deg) scale(${1 + volume / 150})` }}></div>
            <div className="ring-3"></div>
        </div>
        <button
          className={`mic-button ${isListening ? "listening" : ""}`}
          onClick={startListening}
          disabled={!isSupported}
          style={{ transform: `scale(${1 + volume / 200})` }}
        >
          🎤
        </button>
      </div>

      <div className="status-display">
        [{status}]
      </div>

      {lastCommand && (
        <div className="glass-panel">
          <p style={{ color: 'rgba(0,255,255,0.7)', marginBottom: '10px' }}>
            &gt; USER_INPUT: {lastCommand}
          </p>
          {response && (
            <p style={{ color: '#fff', textShadow: '0 0 5px #00ffff', whiteSpace: 'pre-wrap' }}>
              &gt; AIVA_RESPONSE: {response}
            </p>
          )}
        </div>
      )}
      
      {!isSupported && (
        <p style={{color: 'red', marginTop: '20px'}}>
          CRITICAL ERROR: BROWSER NOT SUPPORTED
        </p>
      )}
    </div>
  );
}
