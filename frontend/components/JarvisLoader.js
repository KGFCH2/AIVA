import { useEffect, useState } from "react";

export default function JarvisLoader({ onFinish }) {
  const bootSequence = [
    "ARC REACTOR ONLINE...",
    "BOOTING JARVIS AI...",
    "CALIBRATING HUD SENSORS...",
    "ENGAGING MARVEL PROTOCOLS...",
    "SUIT READY"
  ];
  // welcome flag is no longer used; loader text removed
  // const [showWelcome, setShowWelcome] = useState(true);

  const [line, setLine] = useState("");
  const [index, setIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [show3D, setShow3D] = useState(false);

  useEffect(() => {
    let char = 0;
    const currentText = bootSequence[index];
    if (index === 0) playSound('arc');
    else if (index === bootSequence.length - 2) playSound('hud');
    else if (index === bootSequence.length - 1) { setShow3D(true); playSound('suit'); }
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
            setProgress(100);
            try { await fetch("http://localhost:5000/health"); } catch (e) {}
            speakBoot();
            // welcome flag no longer tracked
            setTimeout(onFinish, 2000);
          }
        }, 900);
      }
    }, 35);
    return () => clearInterval(typer);
  }, [index]);

  // voice that plays at the end of the boot sequence; make the message descriptive
  const speakBoot = () => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      const utterance = new window.SpeechSynthesisUtterance(
        "AIVA is online and ready. Initialising interface now."
      );
      utterance.rate = 1.1;
      utterance.pitch = 1.2;
      utterance.volume = 1.0;
      window.speechSynthesis.speak(utterance);
    }
  };

  const playSound = (type) => {
    if (typeof window === "undefined") return;
    const ctx = window.AudioContext ? new window.AudioContext() : null;
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    if (type === 'arc') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(60, ctx.currentTime);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      osc.start();
      osc.frequency.linearRampToValueAtTime(440, ctx.currentTime + 0.7);
      gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.7);
      osc.stop(ctx.currentTime + 0.7);
    } else if (type === 'hud') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(120, ctx.currentTime);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      osc.start();
      osc.frequency.linearRampToValueAtTime(800, ctx.currentTime + 0.5);
      gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.5);
      osc.stop(ctx.currentTime + 0.5);
    } else if (type === 'suit') {
      osc.type = 'square';
      osc.frequency.setValueAtTime(200, ctx.currentTime);
      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      osc.start();
      osc.frequency.linearRampToValueAtTime(1200, ctx.currentTime + 0.4);
      gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.4);
      osc.stop(ctx.currentTime + 0.4);
    }
  };

  // (moved earlier)

  return (
    <div style={{
      width: "100vw",
      height: "100vh",
      position: "fixed",
      top: 0,
      left: 0,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      background: "radial-gradient(circle at 60% 40%, #0a1a2f 0%, #050a18 100%)",
      color: "#00ffe7",
      fontFamily: "Orbitron, Segoe UI, monospace",
      fontSize: "2.2rem",
      letterSpacing: "0.18em",
      zIndex: 9999,
      overflow: "hidden",
      boxShadow: "0 0 80px 10px #00ffe7, 0 0 0 8px #0ff2, 0 0 0 16px #0ff1",
      border: "3px solid #00ffe7",
      borderRadius: "32px"
    }}>
      {/* Holographic Scanlines */}
      <div style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        zIndex: 2,
        pointerEvents: "none",
        background: `repeating-linear-gradient(
          to bottom,
          rgba(0,255,231,0.08) 0px,
          rgba(0,255,231,0.08) 2px,
          transparent 2px,
          transparent 8px
        )`
      }} />
      {/* Animated Holographic Glow Overlay */}
      <div style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        zIndex: 3,
        pointerEvents: "none",
        background: "radial-gradient(circle at 60% 40%, rgba(0,255,231,0.12) 0%, transparent 70%)"
      }} />
      {/* loader welcome message removed earlier */}
      {/* Futuristic AI Core SVG */}
      {show3D && (
        <div style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          zIndex: 10000,
          pointerEvents: "none"
        }}>
          <svg width="260" height="260" viewBox="0 0 260 260">
            <defs>
              <radialGradient id="coreGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#00ffe7" stopOpacity="0.7" />
                <stop offset="100%" stopColor="#0a1a2f" stopOpacity="0" />
              </radialGradient>
              <linearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#00ffe7" />
                <stop offset="100%" stopColor="#0ff2" />
              </linearGradient>
            </defs>
            <circle cx="130" cy="130" r="110" fill="none" stroke="url(#ringGrad)" strokeWidth="6" opacity="0.18">
              <animateTransform attributeName="transform" type="rotate" from="0 130 130" to="360 130 130" dur="8s" repeatCount="indefinite" />
            </circle>
            <circle cx="130" cy="130" r="80" fill="none" stroke="#00ffe7" strokeWidth="2" opacity="0.12">
              <animateTransform attributeName="transform" type="rotate" from="360 130 130" to="0 130 130" dur="12s" repeatCount="indefinite" />
            </circle>
            <circle cx="130" cy="130" r="50" fill="url(#coreGlow)" />
            <g>
              <animateTransform attributeName="transform" type="rotate" from="0 130 130" to="360 130 130" dur="2.5s" repeatCount="indefinite" />
              <polygon points="130,40 150,130 130,220 110,130" fill="#00ffe7" opacity="0.13" />
            </g>
          </svg>
        </div>
      )}
      {/* Boot Sequence Text */}
      <div style={{
        marginBottom: 40,
        textShadow: "0 0 16px #00ffe7, 0 0 32px #0a1a2f",
        background: "rgba(10,30,50,0.92)",
        padding: "0.7em 1.5em",
        borderRadius: "14px",
        color: "#00ffe7",
        fontWeight: 700,
        fontSize: "2.3rem",
        zIndex: 4,
        border: "2px solid #00ffe7",
        boxShadow: "0 0 24px #00ffe7, 0 0 48px #0ff2"
      }}>
        <span>{line}</span>
      </div>
      {/* Progress Bar */}
      <div style={{
        width: "60vw",
        height: 12,
        background: "#0a1a2f",
        borderRadius: 8,
        overflow: "hidden",
        marginBottom: 30,
        boxShadow: "0 0 16px #00ffe7"
      }}>
        <div style={{
          width: `${progress}%`,
          height: "100%",
          background: "linear-gradient(90deg,#00ffe7 0%,#0ff2 100%)",
          transition: "width 0.3s",
          boxShadow: "0 0 12px #00ffe7"
        }} />
      </div>
      {/* Loader Label */}
      <div style={{
        fontSize: "1.3rem",
        opacity: 0.93,
        letterSpacing: "0.22em",
        textShadow: "0 0 12px #00ffe7, 0 0 24px #0a1a2f",
        fontWeight: 800,
        zIndex: 5
      }}>
        <span style={{ color: "#00ffe7", fontWeight: 900 }}>AIVA</span> <span style={{ color: "#0ff2", fontWeight: 700 }}>INTERFACE</span> <span style={{ color: "#b6c7e3", fontWeight: 700 }}>Loader</span>
      </div>
      {/* Animated Border SVG for extra Tron effect */}
      <svg width="100%" height="100%" style={{ position: "absolute", top: 0, left: 0, zIndex: 10, pointerEvents: "none" }}>
        <defs>
          <linearGradient id="borderGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#00ffe7" />
            <stop offset="100%" stopColor="#0ff2" />
          </linearGradient>
        </defs>
        <rect x="2%" y="2%" width="96%" height="96%" rx="32" fill="none" stroke="url(#borderGrad)" strokeWidth="4">
          <animate attributeName="stroke-dashoffset" from="0" to="1000" dur="6s" repeatCount="indefinite" />
        </rect>
      </svg>
    </div>
  );
}
