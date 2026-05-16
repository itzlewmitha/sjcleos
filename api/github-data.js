// api/github-data.js
export default async function handler(req, res) {
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
  
  // GET - Load data
  if (req.method === 'GET') {
    try {
      const url = `https://api.github.com/repos/${REPO}/contents/data.json`;
      const response = await fetch(url, {
        headers: { 'Authorization': `token ${GITHUB_TOKEN}` }
      });
      
      if (response.status === 404) {
        return res.status(200).json({ 
          projects: [], gallery: [], team: [], 
          about: "<p>The Leo Club of St. Joseph's College...</p>",
          exists: false
        });
      }
      
      const data = await response.json();
      const content = JSON.parse(Buffer.from(data.content, 'base64').toString());
      
      return res.status(200).json({
        ...content,
        sha: data.sha,
        exists: true
      });
    } catch (error) {
      console.error('GET Error:', error);
      return res.status(500).json({ error: error.message });
    }
  }
  
  // POST - Save data
  if (req.method === 'POST') {
    try {
      const { projects, gallery, team, about, sha } = req.body;
      
      const dataToSave = {
        projects: projects || [],
        gallery: gallery || [],
        team: team || [],
        about: about || "",
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
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'GitHub API error');
      }
      
      const result = await response.json();
      
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
