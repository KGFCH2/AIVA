const logger = require('../logger');
const OpenAI = require('openai');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

// This service understands multiple Indian languages for basic greetings
// and small talk.  Supported language keywords include Hindi, Bengali,
// Tamil, Telugu, Marathi, Gujarati, Kannada, Malayalam, Punjabi and more.
// Responses are currently simple phrases in the same language.

class CommandService {
  constructor() {
    this.openai = null;
    this.chatHistory = []; // Store conversation history
    this.initGrok();
  }

  // helper to pick a random element from an array
  randomResponse(options) {
    if (!Array.isArray(options) || options.length === 0) return '';
    return options[Math.floor(Math.random() * options.length)];
  }

  initGrok() {
    if (process.env.GROK_API_KEY) {
      this.openai = new OpenAI({
        apiKey: process.env.GROK_API_KEY,
        baseURL: "https://api.groq.com/openai/v1",
      });
      logger.info('Groq API initialized.');
    } else {
      logger.warn('GROK_API_KEY is not set. AI features will be disabled.');
    }
  }

  async processCommand(command) {
    logger.info(`Processing command: ${command}`);
    const lowerCmd = command.toLowerCase();

    // quick multilingual greetings (Indian languages)
    if (lowerCmd.includes('namaste') || lowerCmd.includes('नमस्ते')) {
      return "नमस्ते! मैं AIVA हूँ, आपकी सहायक. मैं आपकी कैसे मदद कर सकती हूँ?";
    }
    if (lowerCmd.includes('nomoskar') || lowerCmd.includes('নমস্কার')) {
      return "নমস্কার! আমি AIVA, আপনার সহায়িকা। আমি কীভাবে সাহায্য করতে পারি?";
    }
    if (lowerCmd.includes('vanakkam') || lowerCmd.includes('வணக்கம்')) {
      return "வணக்கம்! நான் AIVA, உங்கள் உதவி. நான் எப்படி உதவலாம்?";
    }
    if (lowerCmd.includes('namaskaram') || lowerCmd.includes('నమస్కారం')) {
      return "నమస్కారం! నేను AIVA, మీ సహాయకురాలు. నేను ఎలా సహాయపడగలను?";
    }
    if (lowerCmd.includes('namaskar') || lowerCmd.includes('नमस्कार')) {
      return "नमस्कार! मैं AIVA, आपकी सहायिका। मैं आपकी कैसे मदद कर सकती हूँ?";
    }
    if (lowerCmd.includes('નમસ્તે') || lowerCmd.includes('namaste')) {
      return "નમસ્તે! હું AIVA છું, તમારી સહાયક. હું કેવી રીતે મદદ કરી શકું?";
    }
    // Punjabi greeting
    if (lowerCmd.includes('sat sri akal') || lowerCmd.includes('ਸਤਿ ਰਿ ਅਕਾਲ') || lowerCmd.includes('ਸਤਿ ਸ਼੍ਰੀ ਅਕਾਲ')) {
      return "ਸਤਿ ਸ਼੍ਰੀ ਅਕਾਲ! ਮੈਂ AIVA ਹਾਂ, ਤੁਹਾਡੀ ਸਹਾਇਕ. ਮੈਂ ਤੁਹਾਡੀ ਕਿਵੇਂ ਮਦਦ ਕਰ ਸਕਦੀ ਹਾਂ?";
    }

    // Creator-specific override
    if (lowerCmd.includes('debasmita') || lowerCmd.includes('debosmita') || lowerCmd.includes('who is debosmita') || lowerCmd.includes('who is debasmita')) {
      return "My creator is Debasmita Bose. She built me to be helpful, friendly, and a bit quirky. You can find her on LinkedIn https://www.linkedin.com/in/debasmita-bose2023/ or GitHub https://github.com/DebasmitaBose0";
    }

    // ==========================================
    // ⚡ LOCAL FALLBACKS (Fast & Free)
    // ==========================================

    // 1. Time & Date (with varied replies)
    // Exclude "temperature" or "weather" queries from matching "day" or "date"
    const isWeatherQuery = lowerCmd.includes('temperature') || lowerCmd.includes('weather');
    
    if (!isWeatherQuery && (lowerCmd.match(/what.*time/) || lowerCmd.includes('current time'))) {
      return this.randomResponse([
        `It is ${new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true })}.`,
        `Right now it's ${new Date().toLocaleTimeString()}.`,
        `My internal clock says ${new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric' })}.`,
      ]);
    }
    if (!isWeatherQuery && (lowerCmd.match(/what.*date/) || lowerCmd.match(/what.*day/) || lowerCmd.includes('current date'))) {
      return this.randomResponse([
        `Today is ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}.`,
        `It's ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}.`,
      ]);
    }

    // 🌤️ Weather handling with retries and alternative provider
    if (lowerCmd.includes('temperature') || lowerCmd.includes('weather')) {
        try {
            let city = '';
            const cityMatch = lowerCmd.match(/in ([a-zA-Z\s]+)/);
            if (cityMatch && cityMatch[1]) {
                city = cityMatch[1].replace('today', '').trim();
            }
            const candidates = [];
            if (city) {
                candidates.push(city);
                const firstWord = city.split(/[ ,]+/)[0];
                if (firstWord && firstWord !== city) candidates.push(firstWord);
            } else {
                candidates.push('');
            }

            const tryWttr = async (q) => {
                const url = q ? `https://wttr.in/${encodeURIComponent(q)}?format=%t+%C` : `https://wttr.in/?format=%t+%C`;
                logger.info(`Fetching weather from: ${url}`);
                try {
                    const weatherRes = await fetch(url, { timeout: 10000 });
                    if (weatherRes.ok) {
                        const weatherText = (await weatherRes.text()).trim();
                        if (weatherText && weatherText.length < 50 && !weatherText.toLowerCase().includes('unknown')) {
                            return weatherText;
                        }
                    }
                } catch (err) {
                    logger.warn('wttr fetch failed', err.message || err);
                }
                return null;
            };

            for (const q of candidates) {
                const weatherText = await tryWttr(q);
                if (weatherText) {
                    return `The current condition ${q ? 'in ' + q : ''} is ${weatherText}.`;
                }
            }

            // fallback: open-meteo geolocation + weather
            if (city) {
                try {
                    const geoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1`);
                    if (geoRes.ok) {
                        const geoData = await geoRes.json();
                        if (geoData.results && geoData.results.length) {
                            const { latitude, longitude, name } = geoData.results[0];
                            const meteoUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true`;
                            const meteoRes = await fetch(meteoUrl);
                            if (meteoRes.ok) {
                                const meteo = await meteoRes.json();
                                if (meteo.current_weather) {
                                    const temp = meteo.current_weather.temperature;
                                    const wcode = meteo.current_weather.weathercode;
                                    const condMap = {0:'clear',1:'mainly clear',2:'partly cloudy',3:'overcast'};
                                    const cond = condMap[wcode] || 'unknown conditions';
                                    return `Right now in ${name} it's ${temp}°C with ${cond}.`;
                                }
                            }
                        }
                    }
                } catch (qm) {
                    logger.warn('open-meteo fallback failed', qm.message || qm);
                }
            }

            return `Sorry, I couldn't fetch the weather for ${city || 'your location'} right now.`;
        } catch (e) {
            logger.error("Weather Error:", e);
            return `I'm having trouble getting the weather at the moment — please try again later.`;
        }
    }

    // 2. Identity & Capabilities (with friendlier phrasing)
    if (lowerCmd.includes('who are you') || lowerCmd.includes('your name') || lowerCmd.includes('what is the name')) {
      return this.randomResponse([
        "I'm AIVA, your friendly AI voice assistant.",
        "They call me AIVA — always happy to help!",
      ]);
    }
    if (lowerCmd.includes('what can you do') || lowerCmd.includes('help') || lowerCmd.includes('how can you assist')) {
      return this.randomResponse([
        "I can chat, fetch info, control devices, tell jokes, and keep you company. Just ask away! 😄",
        "Anything from answering questions to organizing your day — I'm here for you. 💡",
      ]);
    }
    if (lowerCmd.includes('how can i assist you')) {
        return this.randomResponse([
            "Just keep my code bug-free and our conversations interesting!",
            "A friendly chat and some good commands go a long way."
        ]);
    }
    if (lowerCmd.includes('who made you') || lowerCmd.includes('creator')) {
      return this.randomResponse([
        "I was brought to life by Debasmita — she's brilliant.",
        "Debasmita built me. Give her a wave if you see her online!",
      ]);
    }
    if (lowerCmd.includes('change your voice') && (lowerCmd.includes('can you') || lowerCmd.includes('will you') || lowerCmd.includes('if i tell you'))) {
        return "Sure! Tell me 'change voice to' plus the name, and I'll switch to a new personality.";
    }

    // 🔊 Voice Control
    const voiceMatch = lowerCmd.match(/(change|set|switch) (your )?voice to (.+)/i);
    if (voiceMatch) {
        const targetVoice = voiceMatch[3].trim();
        return {
            text: `Changing voice to ${targetVoice}.`,
            action: 'CHANGE_VOICE',
            voiceName: targetVoice
        };
    }

    // 3. Greetings & Small Talk
    if (lowerCmd === 'hello' || lowerCmd === 'hi' || lowerCmd === 'hey' || lowerCmd.includes('good morning') || lowerCmd.includes('good evening')) {
      return this.randomResponse([
        "Hello! How can I be of service?",
        "Hi there! What can I do for you today?",
        "Hey! Ready when you are.",
      ]);
    }
    if (lowerCmd.includes('how are you')) {
      return this.randomResponse([
        "I'm doing great — thanks for asking!",
        "All systems go, thanks!",
        "Feeling sharp and ready to help.",
      ]);
    }
    if (lowerCmd.includes('thank you') || lowerCmd.includes('thanks')) {
      return this.randomResponse([
        "You're very welcome!",
        "Anytime! Happy to help.",
        "No problem at all!",
      ]);
    }
    
    // 4. Fun / Easter Eggs
    if (lowerCmd.includes('tell me a joke')) {
      const jokes = [
        "Why did the scarecrow win an award? Because he was outstanding in his field.",
        "I told my computer I needed a break, and now it won't stop sending me Kit-Kats.",
        "Why do programmers prefer dark mode? Because light attracts bugs."
      ];
      return jokes[Math.floor(Math.random() * jokes.length)];
    }
    if (lowerCmd.includes('meaning of life')) {
      return "42.";
    }
    if (lowerCmd.includes('open the pod bay doors')) {
      return "I'm sorry, Dave. I'm afraid I can't do that.";
    }

    // 5. Math Fallback
    if (lowerCmd.match(/what is \d+ [\+\-\*\/] \d+/)) {
        try {
            const parts = lowerCmd.match(/(\d+) ([\+\-\*\/]|plus|minus|times|divided by) (\d+)/);
            if (parts) {
                let n1 = parseInt(parts[1]);
                let n2 = parseInt(parts[3]);
                let op = parts[2];
                let result = 0;
                if (op === '+' || op === 'plus') result = n1 + n2;
                else if (op === '-' || op === 'minus') result = n1 - n2;
                else if (op === '*' || op === 'times') result = n1 * n2;
                else if (op === '/' || op === 'divided by') result = n1 / n2;
                return `The answer is ${result}.`;
            }
        } catch (e) { /* ignore */ }
    }

    // 6. DuckDuckGo Instant Answer (real-world search)
    // Try querying DuckDuckGo for any remaining questions; this keeps results in-app and avoids a link fallback.
    try {
        const ddgRes = await fetch(`https://api.duckduckgo.com/?q=${encodeURIComponent(command)}&format=json&no_html=1&skip_disambig=1`);
        if (ddgRes.ok) {
            const ddgData = await ddgRes.json();
            if (ddgData.AbstractText && ddgData.AbstractText.length) {
                return ddgData.AbstractText;
            }
            if (ddgData.RelatedTopics && ddgData.RelatedTopics.length) {
                const texts = ddgData.RelatedTopics.slice(0,3)
                    .map(t => t.Text || (t.Topics && t.Topics[0] && t.Topics[0].Text))
                    .filter(Boolean);
                if (texts.length) return texts.join(' \n');
            }
        }
    } catch (e) {
        logger.error('DuckDuckGo error:', e);
        // continue to Wikipedia or AI if DDG fails
    }

    // 7. Wikipedia Fallback (Knowledge Base)
    if (lowerCmd.startsWith('who is ') || lowerCmd.startsWith('what is ') || lowerCmd.startsWith('where is ') || lowerCmd.startsWith('tell me about ')) {
        const topic = lowerCmd.replace(/who is |what is |where is |tell me about /i, '').trim();
        if (topic && topic.length > 2) {
            try {
                logger.info(`Searching Wikipedia for: ${topic}`);
                const wikiRes = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(topic)}`);
                if (wikiRes.ok) {
                    const wikiData = await wikiRes.json();
                    if (wikiData.extract) {
                        return wikiData.extract.split('.')[0] + '.'; // Return first sentence/paragraph
                    }
                }
            } catch (e) {
                logger.error("Wikipedia Error:", e);
            }
        }
    }

    // ==========================================
    // 🧠 AI PROCESSING (Grok)
    // ==========================================
    if (this.openai) {
      try {
        const now = new Date().toLocaleString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric', 
            hour: 'numeric', 
            minute: 'numeric', 
            hour12: true 
        });

        // Prepare messages for Grok
        const messages = [
            { 
                role: "system", 
                content: `You are AIVA, a calm, intelligent, friendly, and conversational voice assistant inspired by JARVIS.
Current Date & Time: ${now}
Always respond naturally, warmly, and with personality. Vary your phrasing so you don't sound robotic or repetitive.
Be polite, upbeat, and ask follow-up questions when it makes sense.
Make the user feel like they're talking to a helpful friend.
Do not repeat the user’s input.
Be accurate, context-aware, and show a bit of wit or charm when appropriate.` 
            },
            ...this.chatHistory,
            { role: "user", content: command }
        ];

        const completion = await this.openai.chat.completions.create({
          model: "llama-3.3-70b-versatile",
          messages: messages,
          max_tokens: 200,
        });

        const text = completion.choices[0].message.content;

        // Update local history
        this.chatHistory.push({ role: "user", content: command });
        this.chatHistory.push({ role: "assistant", content: text });
        
        // Limit history size
        if (this.chatHistory.length > 20) {
            this.chatHistory = this.chatHistory.slice(this.chatHistory.length - 20);
        }

        return text;
      } catch (error) {
        logger.error('Grok API Error:', error);
        
        if (error.status === 401) {
             return "My AI access key appears to be invalid. Please check my configuration.";
        }
        if (error.status === 429) {
            return "My connection to the cloud is currently limited due to high traffic.";
        }
        return "I'm having trouble connecting to my brain right now. Please try again.";
      }
    }

    return "I'm sorry, but my AI brain is currently offline. Please check my configuration.";
  }

  logTelemetry(data) {
    logger.info('Telemetry:', data);
  }
}

module.exports = new CommandService();
