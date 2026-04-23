const fs = require('fs');

const data = `Lezione 04	わたし	io	
Lezione 04	あなた	lei	
Lezione 04	なまえ	nome	
Lezione 04	がくせい	studente	
Lezione 04	せんせい	insegnante	
Lezione 04	にほんじん	giapponese	
Lezione 04	イタリアじん	itaiano	
Lezione 04	インドじん	indiano	
Lezione 04	フランスじん	francese	
Lezione 04	スペインじん	spagnolo	
Lezione 04	ちゅうごくじん	cinese	
Lezione 04	かんこくじん	coreano	
Lezione 04	アメリカじん	americano	
Lezione 04	りゅうがくせい	studente straniero	
Lezione 05	しゅっしん	luogo di provenienza	
Lezione 05	くに	nazione	
Lezione 07	たんじょうび	compleanno	
Lezione 08	なん / なに	che cosa	
Lezione 08	いつ	quando	
Lezione 08	どこ	dove	
Lezione 08	どちら	dove (formale)	
Lezione 08	だれ	chi	
Lezione 08	どなた	chi (formale)	
Lezione 08	しごと	lavoro	
Lezione 09	すき	piace	
Lezione 09	とくい	sapere fare	
Lezione 09	じょうず	essere bravo	
Lezione 09	しゅみ	hobby	
Lezione 09	ダンス	danza	
Lezione 09	くだもの	frutta	
Lezione 09	りんご	mela	
Lezione 09	たべもの	cibo	
Lezione 09	のみもの	bevande	
Lezione 09	やさい	verdura	
Lezione 09	えいが	film	
Lezione 09	おかし	dolce	
Lezione 09	アニメ	anime	
Lezione 09	マンガ	manga	
Lezione 09	ほん	libro	
Lezione 09	（お）さけ	bevande alcoliche	
Lezione 09	おんがく	musica	
Lezione 09	にほんりょうり	cucina giapponese	
Lezione 09	ちゅうごくりょうり	cutina cinese	
Lezione 09	イタリアりょうり	cucina italiana	
Lezione 09	フランスりょうり	cucina francese	
Lezione 10	えんぴつ	matita	
Lezione 10	いす	sedia	
Lezione 10	つくえ	scrivania	
Lezione 10	かさ	ombrello	
Lezione 10	けしゴム	gomma da cancellare	
Lezione 10	じしょ	dizionario	
Lezione 10	ほん	libro	
Lezione 10	かばん	borsa	
Lezione 10	ノート	quaderno	
Lezione 10	ボールペン	penna a sfera	
Lezione 10	パソコン	computer	
Lezione 11	ペン	penna	
Lezione 11	おんな	donna	
Lezione 11	おとこ	uomo	
Lezione 11	めがね	occhiali	
Lezione 11	ぼうし	cappello	
Lezione 11	じどうしゃ	macchina	
Lezione 11	とけい	orologio	
Lezione 11	だれ	chi	
Lezione 11	どなた	chi (formale)	
Lezione 11	ひと	persona	
Lezione 11	かた	persona (formale)	
Lezione 11	どれ	quale (tra i tanti)	
Lezione 12	ごぜん	AM	
Lezione 12	しょうご	PM	
Lezione 12	ごぜん　れいじ	mezzogiorno	
Lezione 12	いま	adesso	
Lezione 12	から	da	
Lezione 12	まで	fino a 	
Lezione 12	あさ	mattina	
Lezione 12	ひる	ora di pranzo	
Lezione 12	よる	sera, notte	
Lezione 13	うえ	sopra	
Lezione 13	した	sotto	
Lezione 13	なか	dentro	
Lezione 13	うしろ	dietro	
Lezione 13	まえ	davanti	
Lezione 13	ちかく / そば	vicino	
Lezione 13	よこ	lato	
Lezione 13	AとBの　あいだ	tra A e B	
Lezione 13	みぎ	destra	
Lezione 13	ひだり	sinistra	
Lezione 13	つくえ	scrivania	
Lezione 13	いす	sedia	
Lezione 13	はこ	scatola	
Lezione 13	テーブル	tavola	
Lezione 13	ざっし	rivista	
Lezione 14	ギター	chitarra	
Lezione 14	いぬ	cane	
Lezione 14	コップ	bicchiere	
Lezione 14	しゃしん	foto	
Lezione 14	カレンダー	calendario	
Lezione 14	けいたい	cellulare	
Lezione 14	ねこ	gatto	
Lezione 14	ぬいぐるみ	peluche	
Lezione 14	はな	fiore	
Lezione 14	スリッパ	pantofole	
Lezione 14	ごみばこ	cestino	
Lezione 14	ほんだな	libreria	
Lezione 14	ソファ	divano	
Lezione 14	まど	finestra	
Lezione 14	カーペット	tappeto	
Lezione 14	ベッド	letto	
Lezione 15	みかん	mandarino	
Lezione 15	いちご	fragola	
Lezione 15	かき	kaki	
Lezione 15	おとこのひと	uomo	
Lezione 15	おんなのひと	donna	
Lezione 15	こども	bambino	
Lezione 15	じどうしゃ	automobile	
Lezione 15	きっぷ	biglietto	
Lezione 15	テレビ	tv	
Lezione 15	きって	francobollo	
Lezione 15	ジュース	succo	
Lezione 15	おかね	soldi	
Lezione 15	ケーキ	torta	
Lezione 15	アイロン	ferro da stiro	
Lezione 15	りす	scoiattolo	
Lezione 15	じゃがいも	patata	
Lezione 15	にんじん	carota	
Lezione 15	はがき	cartolina	
Lezione 15	スパゲッティ	staghetti	
Lezione 15	てがみ	lettera	
Lezione 15	ふうとう	busta da lettera	
Lezione 15	おとこのこ	bambino maschio	
Lezione 15	おんなのこ	bambina	
Lezione 15	りんご	mela	
Lezione 15	たまご	uova	
Lezione 15	コップ	bicchiere	
Lezione 15	とけい	orologio	
Lezione 15	ぼうし	cappello	
Lezione 15	かみ	foglio	
Lezione 15	ハンカチ	fazzoletto	
Lezione 15	シャツ	camicia	
Lezione 15	さら	piatto	
Lezione 15	えんぴつ	matita	
Lezione 15	き	albero	
Lezione 15	バナナ	banana	
Lezione 15	カセットテープ	musicassetta	
Lezione 15	ビデオテープ	videocassetta	
Lezione 15	えいが	film	
Lezione 15	ほん	libro	
Lezione 15	ノート	quaderno	
Lezione 15	じしょ	dizionario	
Lezione 15	てちょう	taccuino	
Lezione 15	じてんしゃ	bicicletta	
Lezione 15	じどうしゃ	automobile	
Lezione 15	テレビ	tv	
Lezione 15	でんわ	telefono	
Lezione 15	みず	acqua	
Lezione 15	ビール	birra	
Lezione 15	いぬ	cane	
Lezione 15	むし	insetto	
Lezione 15	さかな	pesce	
Lezione 15	くつした	calzini	
Lezione 15	くつ	scarpe	
Lezione 15	サンダル	sandali	
Lezione 15	にほんのおかね	valuta usata in Giappone (yen)`;

const lines = data.split('\\n');
const lessons = new Set();
const words = [];

for (const line of lines) {
    if (!line.trim()) continue;
    const parts = line.split('\\t').map(s => s.trim());
    if (parts.length >= 3) {
        const lesson = parts[0];
        const hiraganaKatakana = parts[1];
        const italiano = parts[2];
        
        lessons.add(lesson);
        const folderIdVar = \`L\${lesson.split(' ')[1]}\`;
        
        // simple heuristic: if it contains katakana, it's katakana, else hiragana. 
        // We can just put it in hiragana and if it's katakana the user can fix, or we can use a basic regex.
        // Actually, let's just check if it has katakana characters (approx: \\u30A0-\\u30FF)
        const hasKatakana = /[\\u30A0-\\u30FF]/.test(hiraganaKatakana);
        const hiragana = hasKatakana ? '' : hiraganaKatakana;
        const katakana = hasKatakana ? hiraganaKatakana : '';
        
        words.push(\`\\t{ italiano: '\${italiano.replace(/'/g, "\\\\'")}', hiragana: '\${hiragana}', katakana: '\${katakana}', romaji: '', kanji: '', category: 'Sostantivo', folderId: \${folderIdVar} },\`);
    }
}

let folderExports = '';
let folderEntries = '';
let timestamp = 1713830400002;
for (const lesson of lessons) {
    const num = lesson.split(' ')[1];
    folderExports += \`export const SEED_FOLDER_L\${num} = 'seed-folder-l\${num}';\\n\`;
    folderEntries += \`\\t{
\\t\\tid: SEED_FOLDER_L\${num},
\\t\\tname: '\${lesson}',
\\t\\tcreatedAt: \${timestamp++}
\\t},\\n\`;
}

console.log("=== FOLDER CONSTANTS ===");
console.log(folderExports);
console.log("=== FOLDER ENTRIES ===");
console.log(folderEntries);
console.log("=== WORD ENTRIES ===");
console.log(words.join('\\n'));
