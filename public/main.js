// Theme toggle functionality
  document.addEventListener('DOMContentLoaded', () => {
    const themeToggle = document.getElementById('themeToggle');
    themeToggle.addEventListener('click', () => {
      document.body.classList.toggle('dark-mode');
      themeToggle.innerHTML = document.body.classList.contains('dark-mode') 
        ? '<i class="fas fa-sun"></i>' 
        : '<i class="fas fa-moon"></i>';
    });
  });
  
// File Upload Handler
  document.getElementById('uploadForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    const fileInput = document.getElementById('wordFile');
    const statusDiv = document.getElementById('uploadStatus');
    
    if (!fileInput.files[0]) {
      statusDiv.textContent = "Please select a file.";
      statusDiv.className = "status error";
      return;
    }
    
    const formData = new FormData();
    formData.append("wordfile", fileInput.files[0]);
    
    try {
      statusDiv.textContent = "Uploading...";
      statusDiv.className = "status";
      
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });
      
      const result = await response.json();
      if (response.ok) {
        statusDiv.textContent = `✅ ${result.message} (${result.invalidCount} invalid entries ignored)`;
        statusDiv.className = "status success";
      } else {
        statusDiv.textContent = `❌ ${result.error}`;
        statusDiv.className = "status error";
      }
    } catch (err) {
      console.error("Upload error:", err);
      statusDiv.textContent = "❌ Upload failed. Please try again.";
      statusDiv.className = "status error";
    }
  });
  
// Debounce utility for auto-complete
// used to limit the number of API calls made 
// will be used for auto-complete handler
  function debounce(func, delay) {
    let timeout;
    return function(...args) {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), delay);
    };
  }
  
// Auto-Complete Handler
  document.getElementById('prefixInput').addEventListener('input', debounce(async function(e) {
    const prefix = e.target.value;
    const suggestionsList = document.getElementById('suggestions');
    if (prefix.length < 1) {
      suggestionsList.innerHTML = "";
      return;
    }
    try {
      const response = await fetch(`/api/autocomplete?prefix=${encodeURIComponent(prefix)}`);
      const data = await response.json();
      suggestionsList.innerHTML = data.suggestions.map(word => `<li>${word}</li>`).join("");
      // Attach click events to suggestions
      Array.from(suggestionsList.getElementsByTagName('li')).forEach(item => {
        item.addEventListener('click', function() {
          document.getElementById('prefixInput').value = this.textContent;
          suggestionsList.innerHTML = "";
        });
      });
    } catch (err) {
      console.error("Error fetching suggestions:", err);
    }
  }, 300));
  
// Search Handler
  document.getElementById('searchBtn').addEventListener('click', async function() {
    const searchValue = document.getElementById('searchInput').value;
    const resultDiv = document.getElementById('searchResult');
    if (!searchValue) {
      resultDiv.textContent = "Please enter a word to search.";
      resultDiv.className = "result error";
      return;
    }
    try {
      const response = await fetch(`/api/search?word=${encodeURIComponent(searchValue)}`);
      const data = await response.json();
      if (data.exists) {
        resultDiv.textContent = `"${data.word}" found! Rank: ${data.rank}`;
        resultDiv.className = "result success";
      } else {
        resultDiv.textContent = `"${data.word}" not found.`;
        resultDiv.className = "result error";
      }
    } catch (err) {
      console.error("Search error:", err);
      resultDiv.textContent = "Search failed. Please try again.";
      resultDiv.className = "result error";
    }
  });
  
// Rank Check Handler
  document.getElementById('rankBtn').addEventListener('click', async function() {
    const rankValue = document.getElementById('rankInput').value;
    const rankResultDiv = document.getElementById('rankResult');
    if (!rankValue) {
      rankResultDiv.textContent = "Please enter a word to check rank.";
      rankResultDiv.className = "result error";
      return;
    }
    try {
      const response = await fetch(`/api/rank?word=${encodeURIComponent(rankValue)}`);
      if (response.ok) {
        const data = await response.json();
        rankResultDiv.textContent = `Rank of "${data.word}": ${data.rank}`;
        rankResultDiv.className = "result success";
      } else {
        rankResultDiv.textContent = `Word not found.`;
        rankResultDiv.className = "result error";
      }
    } catch (err) {
      console.error("Rank check error:", err);
      rankResultDiv.textContent = "Rank check failed. Please try again.";
      rankResultDiv.className = "result error";
    }
  });