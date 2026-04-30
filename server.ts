import express from 'express';
import cors from 'cors';
import axios from 'axios';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  // API Route for YouTube Search and Extraction
  app.get('/api/youtube/search', async (req, res) => {
    const query = req.query.q as string;
    if (!query) {
      return res.status(400).json({ error: 'Query parameter "q" is required' });
    }

    try {
      const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
      const response = await axios.get(searchUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept-Language': 'en-US,en;q=0.9'
        }
      });

      const html = response.data;
      const videoIds: string[] = [];
      const seen = new Set<string>();

      // Try to find ytInitialData which contains the structured search results
      const ytInitialDataMatch = html.match(/var ytInitialData = (\{.*?\});/);
      if (ytInitialDataMatch) {
        try {
          const data = JSON.parse(ytInitialDataMatch[1]);
          const contents = data.contents?.twoColumnSearchResultsRenderer?.primaryContents?.sectionListRenderer?.contents;
          
          if (contents) {
            for (const section of contents) {
              const itemSection = section.itemSectionRenderer?.contents;
              if (itemSection) {
                for (const item of itemSection) {
                  const video = item.videoRenderer;
                  if (video && video.videoId) {
                    // Check if it's not a "Shorts" video by checking the length or other properties if possible
                    // For now, just collect the videoId
                    if (!seen.has(video.videoId)) {
                      videoIds.push(video.videoId);
                      seen.add(video.videoId);
                    }
                  }
                }
              }
            }
          }
        } catch (e) {
          console.error('Error parsing ytInitialData:', e);
        }
      }

      // Fallback to regex if JSON parsing failed or found nothing
      if (videoIds.length === 0) {
        const videoIdRegex = /\/watch\?v=([a-zA-Z0-9_-]{11})/g;
        const matches = html.matchAll(videoIdRegex);
        for (const match of matches) {
          const id = match[1];
          if (!seen.has(id)) {
            videoIds.push(id);
            seen.add(id);
          }
          if (videoIds.length >= 10) break;
        }
      }

      if (videoIds.length === 0) {
        return res.status(404).json({ error: 'No videos found' });
      }

      res.json({ videoIds: videoIds.slice(0, 10) });
    } catch (error: any) {
      console.error('YouTube Search Error:', error.message);
      res.status(500).json({ error: 'Failed to search YouTube' });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
