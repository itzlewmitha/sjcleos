// api/upload-image.js - Handles image uploads to GitHub
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  const REPO = 'itzlewmitha/sjcleos';
  const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
  
  if (!GITHUB_TOKEN) {
    return res.status(500).json({ error: 'GitHub token not configured' });
  }
  
  try {
    const { imageData, folder, filename } = req.body;
    
    // Generate unique filename
    const timestamp = Date.now();
    const cleanFilename = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
    const finalFilename = `${timestamp}_${cleanFilename}`;
    const path = `assets/${folder}/${finalFilename}`;
    
    // Remove base64 prefix if present
    const base64Data = imageData.includes('base64,') 
      ? imageData.split('base64,')[1] 
      : imageData;
    
    const url = `https://api.github.com/repos/${REPO}/contents/${path}`;
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Authorization': `token ${GITHUB_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: `Upload ${folder} image: ${finalFilename}`,
        content: base64Data,
        branch: 'main'
      })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Upload failed');
    }
    
    const result = await response.json();
    const imageUrl = `https://raw.githubusercontent.com/${REPO}/main/${path}`;
    
    return res.status(200).json({ 
      success: true, 
      url: imageUrl,
      path: path
    });
  } catch (error) {
    console.error('Upload Error:', error);
    return res.status(500).json({ error: error.message });
  }
}
