
import commandService from '../../services/commandService';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Auth Check
  const apiKey = req.headers['x-api-key'];
  // In Vercel, set API_KEY in environment variables. 
  // If not set, we might want to skip check for dev, but better to be safe.
  if (process.env.API_KEY && apiKey !== process.env.API_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const { command } = req.body;

    if (!command) {
      return res.status(400).json({ error: "No command provided" });
    }

    const response = await commandService.processCommand(command);
    res.status(200).json({ response });
  } catch (error) {
    console.error("Error processing command:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
}
