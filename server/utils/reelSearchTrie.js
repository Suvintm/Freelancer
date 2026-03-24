/**
 * ReelSearchTrie - A Prefix TRIE Data Structure for O(L) Autocomplete.
 * ─────────────────────────────────────────────────────────────────────────────
 * This structure indexes hashtags, titles, and usernames to provide
 * near-instant search suggestions as the user types.
 * 
 * Performance:
 * - Insert: O(L) where L is word length.
 * - Suggest: O(P + S) where P is prefix length and S is number of descendants.
 */

class TrieNode {
    constructor() {
        this.children = {}; // Map of char -> TrieNode
        this.isEndOfWord = false;
        this.metadata = []; // Array of { id, type, display } to handle collisions (same word, different reels)
    }
}

class ReelSearchTrie {
    constructor() {
        this.root = new TrieNode();
    }

    /**
     * Inserts a word and its associated metadata into the Trie.
     * @param {string} word - The keyword to index (e.g., "#nature")
     * @param {object} metadata - { id, type, display }
     */
    insert(word, metadata) {
        if (!word) return;
        let node = this.root;
        const cleanWord = word.toLowerCase().trim();

        for (const char of cleanWord) {
            if (!node.children[char]) {
                node.children[char] = new TrieNode();
            }
            node = node.children[char];
        }

        node.isEndOfWord = true;
        
        // Avoid duplicate metadata for same ID/Word
        const exists = node.metadata.find(m => m.id === metadata.id && m.type === metadata.type);
        if (!exists) {
            node.metadata.push(metadata);
        }
    }

    /**
     * Finds all words in the Trie that start with the given prefix.
     * @param {string} prefix 
     * @param {number} limit - Max suggestions to return
     * @returns {Array} List of metadata objects
     */
    suggest(prefix, limit = 10) {
        if (!prefix) return [];
        let node = this.root;
        const cleanPrefix = prefix.toLowerCase().trim();

        // 1. Traverse to the end of the prefix
        for (const char of cleanPrefix) {
            if (!node.children[char]) return [];
            node = node.children[char];
        }

        // 2. Perform DFS to find all descendant words
        const results = [];
        this._dfs(node, results, limit);
        return results;
    }

    _dfs(node, results, limit) {
        if (results.length >= limit) return;

        if (node.isEndOfWord) {
            for (const m of node.metadata) {
                if (results.length < limit) {
                    results.push(m);
                }
            }
        }

        // Sort children keys to keep results deterministic
        const keys = Object.keys(node.children).sort();
        for (const char of keys) {
            this._dfs(node.children[char], results, limit);
            if (results.length >= limit) break;
        }
    }

    /**
     * Clear the entire Trie
     */
    clear() {
        this.root = new TrieNode();
    }
}

// Singleton instance for the application
const trieInstance = new ReelSearchTrie();
export default trieInstance;
export { ReelSearchTrie };
