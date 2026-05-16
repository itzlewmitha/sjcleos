// api/github-data.js - Handles all GitHub data operations
export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  const REPO = 'itzlewmitha/sjcleos';
  const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
  
  if (!GITHUB_TOKEN) {
    return res.status(500).json({ error: 'GitHub token not configured' });
  }
  
  // GET - Load data from GitHub
  if (req.method === 'GET') {
    try {
      const url = `https://raw.githubusercontent.com/${REPO}/main/data.json`;
      const response = await fetch(url);
      
      if (response.status === 404) {
        // No data file exists yet
        return res.status(200).json({ 
          projects: [],
          gallery: [],
          team: [],
          about: "<p>The Leo Club of St. Joseph's College, Anuradhapura...</p>",
          exists: false
        });
      }
      
      const data = await response.json();
      
      // Also get the SHA for updates
      const apiUrl = `https://api.github.com/repos/${REPO}/contents/data.json`;
      const apiResponse = await fetch(apiUrl, {
        headers: { 'Authorization': `token ${GITHUB_TOKEN}` }
      });
      const apiData = await apiResponse.json();
      
      return res.status(200).json({
        ...data,
        sha: apiData.sha,
        exists: true
      });
    } catch (error) {
      console.error('GET Error:', error);
      return res.status(500).json({ error: error.message });
    }
  }
  
  // POST - Save data to GitHub
  if (req.method === 'POST') {
    try {
      const { projects, gallery, team, about, sha } = req.body;
      
      const dataToSave = {
        projects,
        gallery,
        team,
        about,
        lastUpdated: new Date().toISOString()
      };
      
      const content = Buffer.from(JSON.stringify(dataToSave, null, 2)).toString('base64');
      
      const url = `https://api.github.com/repos/${REPO}/contents/data.json`;
      const body = {
        message: `Update website data - ${new Date().toLocaleString()}`,
        content: content,
        branch: 'main'
      };
      if (sha) body.sha = sha;
      
      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Authorization': `token ${GITHUB_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || 'GitHub API error');
      }
      
      return res.status(200).json({ 
        success: true, 
        sha: result.content.sha,
        message: 'Data saved successfully'
      });
    } catch (error) {
      console.error('POST Error:', error);
      return res.status(500).json({ error: error.message });
    }
  }
  
  return res.status(405).json({ error: 'Method not allowed' });
}
