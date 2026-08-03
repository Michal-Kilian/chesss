import trieData from "../data/openingTrie.json";

type TrieNode = {
    name?: string;
    eco?: string;
    children: Record<string, TrieNode>;
};

export type OpeningMatch = {
    name: string;
    eco?: string;
    matchedPly: number;
};

const trie: TrieNode = trieData as TrieNode;

export const findOpening = (moves: Array<string>): OpeningMatch | undefined => {
    let node: TrieNode = trie;
    let best: OpeningMatch | undefined;

    for (let i = 0; i < moves.length; i++) {
        const next = node.children[moves[i]];
        if (!next) break;
        node = next;
        if (node.name) {
            best = {
                name: node.name,
                eco: node.eco,
                matchedPly: i + 1,
            };
        }
    }

    return best;
};