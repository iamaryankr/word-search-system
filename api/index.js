const express = require('express');
const multer = require('multer');
const path = require('path');

const app = express();

// Basic middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// Serve index.html for the root route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public', 'index.html'));
});

// Configure multer with memory storage and explicit limits
const storage = multer.memoryStorage();

const upload = multer({ 
  storage: storage,
  limits: { 
    fileSize: 2 * 1024 * 1024, // 2MB limit
    files: 1
  }
});

// Making the data-structure TRIE
class TrieNode {
  constructor() {
    this.children = {};
    this.isEndOfWord = false;
    this.rank = 0;
  }
}

class Trie {
  constructor() {
    this.root = new TrieNode();
  }
  
  insert(word) {
    let node = this.root;
    for (let char of word) {
      if (!node.children[char]) {
        node.children[char] = new TrieNode();
      }
      node = node.children[char];
    }
    node.isEndOfWord = true;
  }
  
  search(word) {
    let node = this.root;
    for (let char of word) {
      if (!node.children[char]) {
        return false;
      }
      node = node.children[char];
    }
    if (node.isEndOfWord) {
      node.rank++;
      return true;
    }
    return false;
  }
  
  getRank(word) {
    let node = this.root;
    for (let char of word) {
      if (!node.children[char]) {
        return 0;
      }
      node = node.children[char];
    }
    return node.isEndOfWord ? node.rank : 0;
  }
  
  autoComplete(prefix) {
    let node = this.root;
    for (let char of prefix) {
      if (!node.children[char]) {
        return [];
      }
      node = node.children[char];
    }
    
    const results = [];
    this._dfs(node, prefix, results);
    return results;
  }
  
  _dfs(node, prefix, results) {
    if (node.isEndOfWord) {
      results.push(prefix);
    }
    
    for (let char in node.children) {
      this._dfs(node.children[char], prefix + char, results);
    }
  }
}

// Global trie instance
const trie = new Trie();

// File upload endpoint with error handling
app.post('/api/upload', async (req, res) => {
  try {
    // Handle the upload with proper error handling
    const uploadMiddleware = upload.single('wordfile');
    
    uploadMiddleware(req, res, async function(err) {
      if (err) {
        console.error("Upload error:", err.message);
        return res.status(400).json({ error: `Upload error: ${err.message}` });
      }
      
      if (!req.file || !req.file.buffer) {
        return res.status(400).json({ error: 'No file uploaded or empty file' });
      }
      
      try {
        // Get file content as string
        const fileContent = req.file.buffer.toString('utf8');
        
        if (!fileContent || fileContent.length === 0) {
          return res.status(400).json({ error: 'Empty file content' });
        }
        
        // Process the file
        const lines = fileContent.split(/\r?\n/);
        
        // Reset the trie
        trie.root = new TrieNode();
        
        let validCount = 0;
        let invalidCount = 0;
        
        // Process each line
        for (const line of lines) {
          const word = line.trim().toLowerCase();
          if (word && /^[a-z]{2,50}$/.test(word)) {
            trie.insert(word);
            validCount++;
          } else if (word) {
            invalidCount++;
          }
        }
        
        // Send success response
        return res.status(200).json({
          success: true,
          message: `Loaded ${validCount} valid words`,
          invalidCount: invalidCount
        });
      } catch (error) {
        console.error("File processing error:", error);
        return res.status(500).json({ error: `Processing error: ${error.message}` });
      }
    });
  } catch (outerError) {
    console.error("Outer error:", outerError);
    return res.status(500).json({ error: `Server error: ${outerError.message}` });
  }
});

// Auto-complete endpoint
app.get('/api/autocomplete', (req, res) => {
  const prefix = (req.query.prefix || '').toLowerCase().substring(0, 20);
  if (!/^[a-z]{1,20}$/.test(prefix)) {
    return res.status(400).json({ error: 'Invalid prefix' });
  }
  
  const suggestions = trie.autoComplete(prefix);
  res.json({ suggestions });
});

// Search endpoint
app.get('/api/search', (req, res) => {
  const word = (req.query.word || '').toLowerCase().substring(0, 50);
  if (!/^[a-z]{2,50}$/.test(word)) {
    return res.status(400).json({ error: 'Invalid word' });
  }
  
  const exists = trie.search(word);
  res.json({ 
    word, 
    exists, 
    rank: exists ? trie.getRank(word) : undefined 
  });
});

// Rank endpoint
app.get('/api/rank', (req, res) => {
  const word = (req.query.word || '').toLowerCase().substring(0, 50);
  if (!/^[a-z]{2,50}$/.test(word)) {
    return res.status(400).json({ error: 'Invalid word' });
  }
  
  const rank = trie.getRank(word);
  if (rank > 0) {
    res.json({ word, rank });
  } else {
    res.status(404).json({ error: 'Word not found' });
  }
});

// Handle all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public', 'index.html'));
});

// For local development
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

// Export the Express API for Vercel
module.exports = app;
