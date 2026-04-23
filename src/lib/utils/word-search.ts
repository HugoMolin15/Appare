import type { Word } from '$lib/types/word';

export function filterWords(words: Word[], query: string): Word[] {
	if (!query) return words;
	const q = query.toLowerCase();
	return words.filter(
		(w) =>
			w.italiano.toLowerCase().includes(q) ||
			(w.hiragana && w.hiragana.toLowerCase().includes(q)) ||
			(w.romaji && w.romaji.toLowerCase().includes(q)) ||
			(w.kanji && w.kanji.toLowerCase().includes(q)) ||
			(w.katakana && w.katakana.toLowerCase().includes(q))
	);
}
