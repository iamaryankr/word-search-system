const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Basic middleware
app.use(express.json());
app.use(express.static('public'));

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function(req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

// Create uploads directory if it doesn't exist
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}

const upload = multer({ storage: storage });

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

// File upload endpoint
app.post('/api/upload', upload.single('wordfile'), (req, res) => {
  console.log("Upload request received");
  console.log("Request file:", req.file);
  
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  
  try {
    const data = fs.readFileSync(req.file.path, 'utf8');
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
    
    // Clean up the uploaded file
    fs.unlinkSync(req.file.path);
    
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

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
