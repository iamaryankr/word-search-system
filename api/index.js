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

// Configure multer with memory storage and size limits
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// Trie implementation
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
app.post('/api/upload', (req, res) => {
  // Use single upload with error handling
  upload.single('wordfile')(req, res, function(err) {
    if (err) {
      console.error("Multer error:", err);
      return res.status(400).json({ error: err.message });
    }
    
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    try {
      // Process the file from buffer
      const data = req.file.buffer.toString('utf8');
      const lines = data.split(/\r?\n/);
      
      // Clear previous trie
      trie.root = new TrieNode();
      
      let validCount = 0;
      let invalidCount = 0;
      
      lines.forEach(line => {
        const word = line.trim().toLowerCase();
        if (word && /^[a-z]{2,50}$/.test(word)) {
          trie.insert(word);
          validCount++;
        } else if (word) {
          invalidCount++;
        }
      });
      
      res.json({
        success: true,
        message: `Loaded ${validCount} valid words`,
        invalidCount: invalidCount
      });
    } catch (error) {
      console.error("Error processing file:", error);
      res.status(500).json({ error: 'Error processing file' });
    }
  });
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
