# word-search-system
📚 Word Search System
A fast and scalable word search system with auto-completion and dynamic ranking.


🚀 Features
🔍 Search Words by exact match
✨ Auto-Complete using prefix
📈 Rank Tracking — track and increment word frequency
⚡ Efficient for large word sets (up to 100k entries)


🧠 Data Structures Used
Structure	Purpose
Trie       	Efficient prefix-based search
Hash Map	Store and update word rank


🛠️ Core Methods
Method	            Description
Insert(word)	    Add a word to the system
Search(word)	    Search word and increment its rank
AutoComplete(pre)	Suggest words that start with pre
IncrementRank(w)	Increments the usage frequency of w
GetRank(w)	        Returns the current frequency of word w


📂 Input
.Accepts filename from user.
.File contains lowercase words, one per line.
.Word length ≤ 50 characters.


📈 Example
.Insert("apple")
.Insert("apex")
.Insert("app")
.AutoComplete("ap") → ["apple", "apex", "app"]
.Search("apple") → Rank of "apple" increases to 1
.GetRank("apple") → 1


💭 Thoughts
This system is designed with:
O(L) insert/search time (L = word length)
Memory-efficient nodes (only valid children stored)
Scalable to large word lists (100k+ words)


✨ Future Ideas
.Rank-based auto-complete suggestions (most frequent first)
.Persistent storage of ranks (save/load from file)
.Web UI to visualize Trie / search live

🧾 License
.Made by @iamaryankr 