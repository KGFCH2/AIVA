import { useEffect, useState } from "react";

export default function JarvisLoader({ onFinish }) {
  const bootSequence = [
    "INITIALIZING AIVA CORE...",
    "LOADING NEURAL MODULES...",
    "SYNCHRONIZING VOICE MATRIX...",
    "ESTABLISHING SECURE CHANNEL...",
    "SYSTEM ONLINE"
  ];

  const [line, setLine] = useState("");
  const [index, setIndex] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let char = 0;
    const currentText = bootSequence[index];
    
    // Calculate progress based on current step
    const stepProgress = (index / (bootSequence.length - 1)) * 100;
    setProgress(stepProgress);

    const typer = setInterval(() => {
      if (char <= currentText.length) {
        setLine(currentText.slice(0, char));
        char++;
      } else {
        clearInterval(typer);
        setTimeout(async () => {
          if (index < bootSequence.length - 1) {
            setIndex(index + 1);
            setLine("");
          } else {
            // Final step
            setProgress(100);
            try {
                await fetch("http://localhost:5000/health");
            } catch (e) {
                console.warn("Backend not ready yet");
            }
            
            speakBoot();
            setTimeout(onFinish, 1500);
          }
        }, 800);
      }
    }, 30);

    return () => clearInterval(typer);
  }, [index]);

  const speakBoot = () => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      const utterance = new SpeechSynthesisUtterance(
        "System online. Awaiting commands."
      );
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.volume = 0.8;
      
      const voices = window.speechSynthesis.getVoices();
      const preferredVoice = voices.find(v => 
          v.name.includes("Google US English") || 
          v.name.includes("Microsoft Zira") || 
          v.name.includes("Samantha")
        );
      if (preferredVoice) utterance.voice = preferredVoice;

      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <div className="jarvis-loader">
      <div className="scanlines"></div>
      
      <div className="reactor-container">
        <div className="reactor-ring ring-1"></div>
        <div className="reactor-ring ring-2"></div>
        <div className="reactor-ring ring-3"></div>
        <div className="reactor-core"></div>
      </div>

      <div className="loader-status">
        <div className="boot-text">
            <span className="prefix">{">"}</span> {line}
            <span className="blinking-cursor">_</span>
        </div>
        <div className="progress-bar-container">
            <div className="progress-bar-fill" style={{ width: `${progress}%` }}></div>
        </div>
        <div className="system-details">
            <span>CPU: OPTIMAL</span>
            <span>MEM: 64TB</span>
            <span>NET: SECURE</span>
        </div>
      </div>
    </div>
  );
}
