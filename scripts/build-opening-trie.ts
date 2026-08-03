import fs from "node:fs";
import path from "node:path";

type EcoFileEntry = {
    src: string;
    eco: string;
    moves: string;
    name: string;
    scid?: string;
    aliases?: Record<string, string>;
};

type EcoFileShape = Record<string, EcoFileEntry>;

type EcoEntry = {
    eco: string;
    name: string;
    moves: string;
};

type TrieNode = {
    name?: string;
    eco?: string;
    children: Record<string, TrieNode>;
};

const normalize = (move: string): string => {
    return move.replace(/[+#]/g, "");
};

const parseMoves = (movesStr: string): Array<string> => {
    return movesStr
        .replace(/\d+\.(\.\.)?/g, "")
        .trim()
        .split(/\s+/)
        .filter(Boolean)
        .map(normalize);
};

const normalizeEntries = (parsed: EcoFileShape): Array<EcoEntry> => {
    return Object.values(parsed).map((entry) => ({
        eco: entry.eco,
        name: entry.name,
        moves: entry.moves,
    }));
};

const buildTrie = (entries: Array<EcoEntry>): TrieNode => {
    const root: TrieNode = { children: {} };

    for (const entry of entries) {
        const moves = parseMoves(entry.moves);
        let node = root;

        for (const move of moves) {
            if (!node.children[move]) {
                node.children[move] = { children: {} };
            }
            node = node.children[move];
        }

        node.name = entry.name;
        node.eco = entry.eco;
    }

    return root;
};

const ECO_FILES: Array<string> = [
    "ecoA.json",
    "ecoB.json",
    "ecoC.json",
    "ecoD.json",
    "ecoE.json",
];

const loadAllEntries = (dataDir: string): Array<EcoEntry> => {
    const entries: Array<EcoEntry> = [];

    for (const file of ECO_FILES) {
        const filePath = path.join(dataDir, file);
        const raw = fs.readFileSync(filePath, "utf-8");
        const parsed: EcoFileShape = JSON.parse(raw);
        entries.push(...normalizeEntries(parsed));
    }

    return entries;
};

function main() {
    const dataDir = path.resolve("src/data");
    const outputPath = path.resolve("src/data/openingTrie.json");

    const entries = loadAllEntries(dataDir);
    const trie = buildTrie(entries);

    fs.writeFileSync(outputPath, JSON.stringify(trie), "utf-8");

    const jsonSize = fs.statSync(outputPath).size;
    console.log(
        `Built trie from ${entries.length} entries across ${ECO_FILES.length} files -> ${outputPath}`,
    );
    console.log(`Output size: ${(jsonSize / 1024).toFixed(1)} KB`);
}

main();