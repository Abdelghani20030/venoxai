/**
 * Pronunciation.jsx
 * ─────────────────────────────────────────────────────────────────────
 * A full LanGeek-style Pronunciation section for the Venoxa app.
 *
 * HOW TO INTEGRATE:
 *   1. Import this file in App.jsx:
 *        import Pronunciation from './Pronunciation';
 *
 *   2. Add to navItems (inside the skills_group items array, or as a
 *      standalone nav entry):
 *        { id: 'pronunciation', label: _resolveTranslation(lang, 'النطق', 'Pronunciation'), icon: Volume2 }
 *
 *      OR add it as a sub-item inside the skills_group:
 *        { id: 'pronunciation', label: _resolveTranslation(lang, 'النطق', 'Pronunciation'), icon: Volume2 }
 *
 *   3. Add to renderContent() switch:
 *        case 'pronunciation':
 *          return <Pronunciation lang={lang} theme={theme} AI_KEY={AI_KEY} />;
 *
 *   4. Make sure Volume2 is imported from lucide-react (it already is).
 * ─────────────────────────────────────────────────────────────────────
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Volume2, BookmarkPlus, Bookmark, CheckCircle, CheckCircle2,
  ChevronRight, ChevronLeft, X, Search, Filter, Star, Mic, Info,
  RefreshCw, Play, RotateCcw
} from 'lucide-react';

// ─── Mini Flag SVGs (mirrors what App.jsx uses) ──────────────────────────────
const GBFlagMini = () => (
  <svg viewBox="0 0 60 30" xmlns="http://www.w3.org/2000/svg" style={{ width: 20, height: 12, display: 'inline-block', borderRadius: 2, flexShrink: 0 }}>
    <rect width="60" height="30" fill="#012169"/>
    <line x1="0" y1="0" x2="60" y2="30" stroke="white" strokeWidth="10"/>
    <line x1="60" y1="0" x2="0" y2="30" stroke="white" strokeWidth="10"/>
    <polygon points="0,0 3,0 30,13.5 27,15 0,3" fill="#C8102E"/>
    <polygon points="57,0 60,0 60,3 33,15 30,13.5" fill="#C8102E"/>
    <polygon points="30,16.5 60,27 60,30 57,30" fill="#C8102E"/>
    <polygon points="27,15 30,16.5 3,30 0,30 0,27" fill="#C8102E"/>
    <rect x="23" y="0" width="14" height="30" fill="white"/>
    <rect x="0" y="11" width="60" height="8" fill="white"/>
    <rect x="25.5" y="0" width="9" height="30" fill="#C8102E"/>
    <rect x="0" y="12.5" width="60" height="5" fill="#C8102E"/>
  </svg>
);
const USFlagMini = () => {
  const sh = 30 / 13;
  return (
    <svg viewBox="0 0 60 30" xmlns="http://www.w3.org/2000/svg" style={{ width: 20, height: 12, display: 'inline-block', borderRadius: 2, flexShrink: 0 }}>
      {Array.from({ length: 13 }).map((_, i) => (
        <rect key={i} x="0" y={i * sh} width="60" height={sh} fill={i % 2 === 0 ? '#B22234' : 'white'} />
      ))}
      <rect x="0" y="0" width="24" height={7 * sh} fill="#3C3B6E"/>
    </svg>
  );
};

// ─── DATA ────────────────────────────────────────────────────────────────────

const ALPHABET_DATA = [
  { id: 'A', letter: 'A a', name: 'The Letter A', sounds: ['/eɪ/', '/æ/', '/ɑː/', '/ə/', '/ɔː/'], examples: { us: [{ word: 'name', ipa: '/neɪm/' }, { word: 'cat', ipa: '/kæt/' }, { word: 'father', ipa: '/ˈfɑːðər/' }], uk: [{ word: 'name', ipa: '/neɪm/' }, { word: 'cat', ipa: '/kæt/' }, { word: 'bath', ipa: '/bɑːθ/' }] }, hasBritish: true, desc: 'The letter A represents multiple sounds — from the long /eɪ/ in "name" to the short /æ/ in "cat". In unstressed syllables it often becomes the schwa /ə/.' },
  { id: 'B', letter: 'B b', name: 'The Letter B', sounds: ['/b/'], examples: { us: [{ word: 'book', ipa: '/bʊk/' }, { word: 'robot', ipa: '/ˈroʊbɑːt/' }, { word: 'bomb', ipa: '/bɑːm/' }], uk: [{ word: 'book', ipa: '/bʊk/' }, { word: 'robot', ipa: '/ˈrəʊbɒt/' }, { word: 'bomb', ipa: '/bɒm/' }] }, hasBritish: false, desc: 'B is usually pronounced /b/, but is silent in words ending in -mb (lamb, bomb) or -bt (debt, doubt).' },
  { id: 'C', letter: 'C c', name: 'The Letter C', sounds: ['/k/', '/s/'], examples: { us: [{ word: 'cat', ipa: '/kæt/' }, { word: 'city', ipa: '/ˈsɪti/' }, { word: 'clock', ipa: '/klɑːk/' }], uk: [{ word: 'cat', ipa: '/kæt/' }, { word: 'city', ipa: '/ˈsɪti/' }, { word: 'clock', ipa: '/klɒk/' }] }, hasBritish: false, desc: 'C sounds like /k/ before a, o, u (cat, cod, cut) and like /s/ before e, i, y (city, cycle, cent).' },
  { id: 'D', letter: 'D d', name: 'The Letter D', sounds: ['/d/'], examples: { us: [{ word: 'dog', ipa: '/dɔːɡ/' }, { word: 'ladder', ipa: '/ˈlædər/' }, { word: 'loved', ipa: '/lʌvd/' }], uk: [{ word: 'dog', ipa: '/dɒɡ/' }, { word: 'ladder', ipa: '/ˈlædə/' }, { word: 'loved', ipa: '/lʌvd/' }] }, hasBritish: false, desc: 'D is always /d/ in standard English. In American English, the medial -t- and -d- often sound similar (flapping).' },
  { id: 'E', letter: 'E e', name: 'The Letter E', sounds: ['/iː/', '/e/', '/ə/', '/silent/'], examples: { us: [{ word: 'even', ipa: '/ˈiːvən/' }, { word: 'bed', ipa: '/bed/' }, { word: 'the', ipa: '/ðə/' }], uk: [{ word: 'even', ipa: '/ˈiːvən/' }, { word: 'bed', ipa: '/bed/' }, { word: 'the', ipa: '/ðə/' }] }, hasBritish: true, desc: 'E can be /iː/ in "even", /e/ in "bed", the schwa /ə/ in "the", or completely silent at the end of words (name, time).' },
  { id: 'F', letter: 'F f', name: 'The Letter F', sounds: ['/f/'], examples: { us: [{ word: 'fish', ipa: '/fɪʃ/' }, { word: 'off', ipa: '/ɔːf/' }, { word: 'phone', ipa: '/foʊn/' }], uk: [{ word: 'fish', ipa: '/fɪʃ/' }, { word: 'off', ipa: '/ɒf/' }, { word: 'phone', ipa: '/fəʊn/' }] }, hasBritish: false, desc: 'F is always /f/. Note: -gh in words like "laugh" and "rough" also produces /f/.' },
  { id: 'G', letter: 'G g', name: 'The Letter G', sounds: ['/ɡ/', '/dʒ/'], examples: { us: [{ word: 'go', ipa: '/ɡoʊ/' }, { word: 'gem', ipa: '/dʒem/' }, { word: 'ghost', ipa: '/ɡoʊst/' }], uk: [{ word: 'go', ipa: '/ɡəʊ/' }, { word: 'gem', ipa: '/dʒem/' }, { word: 'ghost', ipa: '/ɡəʊst/' }] }, hasBritish: false, desc: 'G is /ɡ/ before a, o, u (go, game) and /dʒ/ before e, i, y (gem, giraffe). Sometimes it is silent (ghost, gnome).' },
  { id: 'H', letter: 'H h', name: 'The Letter H', sounds: ['/h/', '/silent/'], examples: { us: [{ word: 'hat', ipa: '/hæt/' }, { word: 'hour', ipa: '/aʊər/' }, { word: 'vehicle', ipa: '/ˈviːɪkəl/' }], uk: [{ word: 'hat', ipa: '/hæt/' }, { word: 'hour', ipa: '/ˈaʊə/' }, { word: 'vehicle', ipa: '/ˈviːɪkəl/' }] }, hasBritish: true, desc: 'H is pronounced /h/ at the start of stressed syllables. It is silent in "hour", "honest", "heir" and in some unstressed pronouns in fast speech.' },
  { id: 'I', letter: 'I i', name: 'The Letter I', sounds: ['/aɪ/', '/ɪ/', '/iː/', '/ə/'], examples: { us: [{ word: 'time', ipa: '/taɪm/' }, { word: 'sit', ipa: '/sɪt/' }, { word: 'machine', ipa: '/məˈʃiːn/' }], uk: [{ word: 'time', ipa: '/taɪm/' }, { word: 'sit', ipa: '/sɪt/' }, { word: 'machine', ipa: '/məˈʃiːn/' }] }, hasBritish: false, desc: 'I can be the diphthong /aɪ/ in "time", the short /ɪ/ in "sit", or /iː/ in words like "machine". In unstressed syllables it may reduce to /ə/.' },
  { id: 'J', letter: 'J j', name: 'The Letter J', sounds: ['/dʒ/'], examples: { us: [{ word: 'jump', ipa: '/dʒʌmp/' }, { word: 'enjoy', ipa: '/ɪnˈdʒɔɪ/' }, { word: 'jelly', ipa: '/ˈdʒeli/' }], uk: [{ word: 'jump', ipa: '/dʒʌmp/' }, { word: 'enjoy', ipa: '/ɪnˈdʒɔɪ/' }, { word: 'jelly', ipa: '/ˈdʒeli/' }] }, hasBritish: false, desc: 'J is always /dʒ/ in English. It shares this sound with the letter G before e, i, y (gel, giant).' },
  { id: 'K', letter: 'K k', name: 'The Letter K', sounds: ['/k/', '/silent/'], examples: { us: [{ word: 'key', ipa: '/kiː/' }, { word: 'know', ipa: '/noʊ/' }, { word: 'black', ipa: '/blæk/' }], uk: [{ word: 'key', ipa: '/kiː/' }, { word: 'know', ipa: '/nəʊ/' }, { word: 'black', ipa: '/blæk/' }] }, hasBritish: false, desc: 'K is /k/ but is silent before N at the start of words: know, knife, knight, knock.' },
  { id: 'L', letter: 'L l', name: 'The Letter L', sounds: ['/l/', '/silent/'], examples: { us: [{ word: 'lamp', ipa: '/læmp/' }, { word: 'full', ipa: '/fʊl/' }, { word: 'calm', ipa: '/kɑːm/' }], uk: [{ word: 'lamp', ipa: '/læmp/' }, { word: 'full', ipa: '/fʊl/' }, { word: 'calm', ipa: '/kɑːm/' }] }, hasBritish: false, desc: 'L is /l/ in most positions. It is silent in some words: calm, palm, talk, walk, half, calf, salmon.' },
  { id: 'M', letter: 'M m', name: 'The Letter M', sounds: ['/m/'], examples: { us: [{ word: 'moon', ipa: '/muːn/' }, { word: 'hammer', ipa: '/ˈhæmər/' }, { word: 'thumb', ipa: '/θʌm/' }], uk: [{ word: 'moon', ipa: '/muːn/' }, { word: 'hammer', ipa: '/ˈhæmə/' }, { word: 'thumb', ipa: '/θʌm/' }] }, hasBritish: false, desc: 'M is always /m/ and is a nasal consonant. MB at the end of words is pronounced /m/ only — the B is silent (thumb, lamb, comb).' },
  { id: 'N', letter: 'N n', name: 'The Letter N', sounds: ['/n/', '/ŋ/'], examples: { us: [{ word: 'note', ipa: '/noʊt/' }, { word: 'bank', ipa: '/bæŋk/' }, { word: 'king', ipa: '/kɪŋ/' }], uk: [{ word: 'note', ipa: '/nəʊt/' }, { word: 'bank', ipa: '/bæŋk/' }, { word: 'king', ipa: '/kɪŋ/' }] }, hasBritish: false, desc: 'N is /n/ usually, but before K or G it becomes the velar nasal /ŋ/ (bank, think, sink).' },
  { id: 'O', letter: 'O o', name: 'The Letter O', sounds: ['/oʊ/', '/ɑː/', '/ɒ/', '/uː/', '/ə/'], examples: { us: [{ word: 'go', ipa: '/ɡoʊ/' }, { word: 'dog', ipa: '/dɔːɡ/' }, { word: 'do', ipa: '/duː/' }], uk: [{ word: 'go', ipa: '/ɡəʊ/' }, { word: 'dog', ipa: '/dɒɡ/' }, { word: 'do', ipa: '/duː/' }] }, hasBritish: true, desc: 'O is one of the most variable vowels: /oʊ/ in "go" (US), /əʊ/ in "go" (UK), /ɒ/ in "dog" (UK), /ɔː/ in "dog" (US), /uː/ in "do", and /ə/ in unstressed syllables.' },
  { id: 'P', letter: 'P p', name: 'The Letter P', sounds: ['/p/', '/silent/'], examples: { us: [{ word: 'pen', ipa: '/pen/' }, { word: 'happy', ipa: '/ˈhæpi/' }, { word: 'pneumonia', ipa: '/njuːˈmoʊniə/' }], uk: [{ word: 'pen', ipa: '/pen/' }, { word: 'happy', ipa: '/ˈhæpi/' }, { word: 'pneumonia', ipa: '/njuːˈməʊniə/' }] }, hasBritish: false, desc: 'P is /p/ in most contexts. It is silent before N (pneumonia, pneumatic) and in some other words (receipt, psychology).' },
  { id: 'Q', letter: 'Q q', name: 'The Letter Q', sounds: ['/k/', '/kw/'], examples: { us: [{ word: 'queen', ipa: '/kwiːn/' }, { word: 'quiet', ipa: '/ˈkwaɪət/' }, { word: 'unique', ipa: '/juːˈniːk/' }], uk: [{ word: 'queen', ipa: '/kwiːn/' }, { word: 'quiet', ipa: '/ˈkwaɪət/' }, { word: 'unique', ipa: '/juːˈniːk/' }] }, hasBritish: false, desc: 'Q is almost always followed by U. QU = /kw/ in most words (queen, quiet). In words like "unique" and "antique", QUE = /k/ at the end.' },
  { id: 'R', letter: 'R r', name: 'The Letter R', sounds: ['/r/', '/ɹ/'], examples: { us: [{ word: 'red', ipa: '/ɹed/' }, { word: 'car', ipa: '/kɑːr/' }, { word: 'butter', ipa: '/ˈbʌtər/' }], uk: [{ word: 'red', ipa: '/ɹed/' }, { word: 'car', ipa: '/kɑː/' }, { word: 'butter', ipa: '/ˈbʌtə/' }] }, hasBritish: true, desc: 'This is one of the biggest US/UK differences. American English is rhotic — R is always pronounced. British English often drops R after a vowel (car, butter, bird).' },
  { id: 'S', letter: 'S s', name: 'The Letter S', sounds: ['/s/', '/z/', '/ʃ/', '/ʒ/'], examples: { us: [{ word: 'sun', ipa: '/sʌn/' }, { word: 'rise', ipa: '/raɪz/' }, { word: 'sure', ipa: '/ʃʊr/' }], uk: [{ word: 'sun', ipa: '/sʌn/' }, { word: 'rise', ipa: '/raɪz/' }, { word: 'sure', ipa: '/ʃɔː/' }] }, hasBritish: true, desc: 'S can be /s/ (sun), /z/ (rise, dogs), /ʃ/ (sure, sugar) or /ʒ/ (vision, measure). Context determines the pronunciation.' },
  { id: 'T', letter: 'T t', name: 'The Letter T', sounds: ['/t/', '/ʃ/', '/tʃ/', '/silent/'], examples: { us: [{ word: 'top', ipa: '/tɑːp/' }, { word: 'nation', ipa: '/ˈneɪʃən/' }, { word: 'water', ipa: '/ˈwɔːɾər/' }], uk: [{ word: 'top', ipa: '/tɒp/' }, { word: 'nation', ipa: '/ˈneɪʃən/' }, { word: 'water', ipa: '/ˈwɔːtə/' }] }, hasBritish: true, desc: 'T is /t/ usually, but TI in "nation" → /ʃ/. In American English, T between vowels often becomes a flap /ɾ/ (water, butter). T is silent in "listen", "castle", "often".' },
  { id: 'U', letter: 'U u', name: 'The Letter U', sounds: ['/juː/', '/uː/', '/ʌ/', '/ʊ/', '/ə/'], examples: { us: [{ word: 'use', ipa: '/juːz/' }, { word: 'cup', ipa: '/kʌp/' }, { word: 'put', ipa: '/pʊt/' }], uk: [{ word: 'use', ipa: '/juːz/' }, { word: 'cup', ipa: '/kʌp/' }, { word: 'put', ipa: '/pʊt/' }] }, hasBritish: true, desc: 'U has a wide range: /juː/ or /uː/ in "use/rule", /ʌ/ in "cup", /ʊ/ in "put", and /ə/ in unstressed syllables. After certain consonants, /uː/ may or may not include the /j/ sound (tune: US /tuːn/ vs UK /tjuːn/).' },
  { id: 'V', letter: 'V v', name: 'The Letter V', sounds: ['/v/'], examples: { us: [{ word: 'very', ipa: '/ˈveri/' }, { word: 'love', ipa: '/lʌv/' }, { word: 'river', ipa: '/ˈrɪvər/' }], uk: [{ word: 'very', ipa: '/ˈveri/' }, { word: 'love', ipa: '/lʌv/' }, { word: 'river', ipa: '/ˈrɪvə/' }] }, hasBritish: false, desc: 'V is always /v/ in English. It is the voiced counterpart of /f/. Both lips touch the upper teeth.' },
  { id: 'W', letter: 'W w', name: 'The Letter W', sounds: ['/w/', '/silent/'], examples: { us: [{ word: 'water', ipa: '/ˈwɔːtər/' }, { word: 'write', ipa: '/raɪt/' }, { word: 'sword', ipa: '/sɔːrd/' }], uk: [{ word: 'water', ipa: '/ˈwɔːtə/' }, { word: 'write', ipa: '/raɪt/' }, { word: 'sword', ipa: '/sɔːd/' }] }, hasBritish: false, desc: 'W is /w/ but is silent before R (write, wrap, wrong) and in some other words (who, two, sword).' },
  { id: 'X', letter: 'X x', name: 'The Letter X', sounds: ['/ks/', '/ɡz/', '/z/'], examples: { us: [{ word: 'fox', ipa: '/fɑːks/' }, { word: 'exam', ipa: '/ɪɡˈzæm/' }, { word: 'xylophone', ipa: '/ˈzaɪləfoʊn/' }], uk: [{ word: 'fox', ipa: '/fɒks/' }, { word: 'exam', ipa: '/ɪɡˈzæm/' }, { word: 'xylophone', ipa: '/ˈzaɪləfəʊn/' }] }, hasBritish: false, desc: 'X is /ks/ after a stressed vowel (fox, tax), /ɡz/ before a stressed vowel (exam, exist), and /z/ at the start of words (xylophone, xenophobia).' },
  { id: 'Y', letter: 'Y y', name: 'The Letter Y', sounds: ['/j/', '/aɪ/', '/ɪ/'], examples: { us: [{ word: 'yes', ipa: '/jes/' }, { word: 'my', ipa: '/maɪ/' }, { word: 'happy', ipa: '/ˈhæpi/' }], uk: [{ word: 'yes', ipa: '/jes/' }, { word: 'my', ipa: '/maɪ/' }, { word: 'happy', ipa: '/ˈhæpi/' }] }, hasBritish: true, desc: 'Y is a semi-vowel /j/ at the start of words (yes, year). As a vowel, it is /aɪ/ at the end of stressed syllables (my, try) or /ɪ/ at the end of unstressed syllables (happy, city).' },
  { id: 'Z', letter: 'Z z', name: 'The Letter Z', sounds: ['/z/', '/s/'], examples: { us: [{ word: 'zero', ipa: '/ˈzɪroʊ/' }, { word: 'jazz', ipa: '/dʒæz/' }, { word: 'quartz', ipa: '/kwɔːrts/' }], uk: [{ word: 'zero', ipa: '/ˈzɪərəʊ/' }, { word: 'jazz', ipa: '/dʒæz/' }, { word: 'quartz', ipa: '/kwɔːts/' }] }, hasBritish: true, desc: 'Z is /z/ and is the voiced partner of /s/. In British English, "z" is called "zed"; in American English, "zee". Sometimes Z is /s/ (pizza, quartz).' },
];

const MULTIGRAPH_DATA = [
  { id: 'ch', symbol: 'CH', name: 'ch — Church / Chord / Chef', sounds: ['/tʃ/', '/k/', '/ʃ/'], examples: { us: [{ word: 'church', ipa: '/tʃɜːrtʃ/' }, { word: 'chord', ipa: '/kɔːrd/' }, { word: 'chef', ipa: '/ʃef/' }], uk: [{ word: 'church', ipa: '/tʃɜːtʃ/' }, { word: 'chord', ipa: '/kɔːd/' }, { word: 'chef', ipa: '/ʃef/' }] }, hasBritish: true, desc: 'CH has three pronunciations: /tʃ/ in most native words (church, child), /k/ in Greek-origin words (chord, school), and /ʃ/ in French-origin words (chef, champagne).' },
  { id: 'sh', symbol: 'SH', name: 'sh — Ship / Wish', sounds: ['/ʃ/'], examples: { us: [{ word: 'ship', ipa: '/ʃɪp/' }, { word: 'wish', ipa: '/wɪʃ/' }, { word: 'fashion', ipa: '/ˈfæʃən/' }], uk: [{ word: 'ship', ipa: '/ʃɪp/' }, { word: 'wish', ipa: '/wɪʃ/' }, { word: 'fashion', ipa: '/ˈfæʃən/' }] }, hasBritish: false, desc: 'SH is always /ʃ/ — the voiceless palato-alveolar fricative. Tongue near the roof of the mouth, air escapes through a narrow gap.' },
  { id: 'th', symbol: 'TH', name: 'th — Think / The', sounds: ['/θ/', '/ð/'], examples: { us: [{ word: 'think', ipa: '/θɪŋk/' }, { word: 'the', ipa: '/ðə/' }, { word: 'with', ipa: '/wɪð/' }], uk: [{ word: 'think', ipa: '/θɪŋk/' }, { word: 'the', ipa: '/ðə/' }, { word: 'with', ipa: '/wɪð/' }] }, hasBritish: false, desc: 'TH has two sounds: voiceless /θ/ as in "think, path, bath" and voiced /ð/ as in "the, this, that, with". Both require the tongue tip between the teeth.' },
  { id: 'ph', symbol: 'PH', name: 'ph — Phone / Photo', sounds: ['/f/'], examples: { us: [{ word: 'phone', ipa: '/foʊn/' }, { word: 'photo', ipa: '/ˈfoʊtoʊ/' }, { word: 'alphabet', ipa: '/ˈælfəbet/' }], uk: [{ word: 'phone', ipa: '/fəʊn/' }, { word: 'photo', ipa: '/ˈfəʊtəʊ/' }, { word: 'alphabet', ipa: '/ˈælfəbet/' }] }, hasBritish: false, desc: 'PH is always /f/ and occurs mainly in Greek-origin words (photo, phone, philosophy, pharmacy).' },
  { id: 'gh', symbol: 'GH', name: 'gh — Laugh / Ghost / Through', sounds: ['/f/', '/silent/', '/ɡ/'], examples: { us: [{ word: 'laugh', ipa: '/læf/' }, { word: 'night', ipa: '/naɪt/' }, { word: 'ghost', ipa: '/ɡoʊst/' }], uk: [{ word: 'laugh', ipa: '/lɑːf/' }, { word: 'night', ipa: '/naɪt/' }, { word: 'ghost', ipa: '/ɡəʊst/' }] }, hasBritish: true, desc: 'GH is one of the trickiest multigraphs: /f/ in "laugh, rough, tough"; silent in "night, light, through, daughter"; /ɡ/ in "ghost, ghastly".' },
  { id: 'wh', symbol: 'WH', name: 'wh — Where / Who', sounds: ['/w/', '/h/'], examples: { us: [{ word: 'where', ipa: '/wer/' }, { word: 'who', ipa: '/huː/' }, { word: 'what', ipa: '/wɑːt/' }], uk: [{ word: 'where', ipa: '/weə/' }, { word: 'who', ipa: '/huː/' }, { word: 'what', ipa: '/wɒt/' }] }, hasBritish: true, desc: 'WH is /w/ in most words (where, what, white). Before O, it becomes /h/ (who, whose, whole). Some dialects keep an older /ʍ/ sound in words like "which".' },
  { id: 'ng', symbol: 'NG', name: 'ng — Sing / Finger', sounds: ['/ŋ/', '/ŋɡ/'], examples: { us: [{ word: 'sing', ipa: '/sɪŋ/' }, { word: 'finger', ipa: '/ˈfɪŋɡər/' }, { word: 'longer', ipa: '/ˈlɔːŋɡər/' }], uk: [{ word: 'sing', ipa: '/sɪŋ/' }, { word: 'finger', ipa: '/ˈfɪŋɡə/' }, { word: 'longer', ipa: '/ˈlɒŋɡə/' }] }, hasBritish: false, desc: 'NG at the end of words is /ŋ/ (sing, ring, long). In the middle of words, it can be /ŋɡ/ (finger, longer) or just /ŋ/ (singing, longing).' },
  { id: 'ck', symbol: 'CK', name: 'ck — Sock / Black', sounds: ['/k/'], examples: { us: [{ word: 'sock', ipa: '/sɑːk/' }, { word: 'black', ipa: '/blæk/' }, { word: 'bucket', ipa: '/ˈbʌkɪt/' }], uk: [{ word: 'sock', ipa: '/sɒk/' }, { word: 'black', ipa: '/blæk/' }, { word: 'bucket', ipa: '/ˈbʌkɪt/' }] }, hasBritish: false, desc: 'CK is always /k/ and appears after a short vowel. It is used instead of K when following a short vowel at the end of a syllable (black, clock, duck).' },
  { id: 'qu', symbol: 'QU', name: 'qu — Queen / Unique', sounds: ['/kw/', '/k/'], examples: { us: [{ word: 'queen', ipa: '/kwiːn/' }, { word: 'quiet', ipa: '/ˈkwaɪət/' }, { word: 'antique', ipa: '/ænˈtiːk/' }], uk: [{ word: 'queen', ipa: '/kwiːn/' }, { word: 'quiet', ipa: '/ˈkwaɪət/' }, { word: 'antique', ipa: '/ænˈtiːk/' }] }, hasBritish: false, desc: 'QU is almost always /kw/ (queen, question). At the end of words in French-origin words, QUE is /k/ (antique, unique, technique).' },
  { id: 'ea', symbol: 'EA', name: 'ea — Eat / Head / Great', sounds: ['/iː/', '/e/', '/eɪ/'], examples: { us: [{ word: 'eat', ipa: '/iːt/' }, { word: 'head', ipa: '/hed/' }, { word: 'great', ipa: '/ɡreɪt/' }], uk: [{ word: 'eat', ipa: '/iːt/' }, { word: 'head', ipa: '/hed/' }, { word: 'great', ipa: '/ɡreɪt/' }] }, hasBritish: false, desc: 'EA is usually /iː/ (eat, sea, cream), but /e/ in words like head, dead, bread, and /eɪ/ in great, steak, break.' },
  { id: 'oo', symbol: 'OO', name: 'oo — Moon / Book', sounds: ['/uː/', '/ʊ/'], examples: { us: [{ word: 'moon', ipa: '/muːn/' }, { word: 'book', ipa: '/bʊk/' }, { word: 'blood', ipa: '/blʌd/' }], uk: [{ word: 'moon', ipa: '/muːn/' }, { word: 'book', ipa: '/bʊk/' }, { word: 'blood', ipa: '/blʌd/' }] }, hasBritish: false, desc: 'OO is /uː/ in most words (moon, food, school). It is /ʊ/ in book, cook, look, foot. Unusually, it is /ʌ/ in blood and flood.' },
  { id: 'ow', symbol: 'OW', name: 'ow — Cow / Know', sounds: ['/aʊ/', '/oʊ/'], examples: { us: [{ word: 'cow', ipa: '/kaʊ/' }, { word: 'know', ipa: '/noʊ/' }, { word: 'how', ipa: '/haʊ/' }], uk: [{ word: 'cow', ipa: '/kaʊ/' }, { word: 'know', ipa: '/nəʊ/' }, { word: 'how', ipa: '/haʊ/' }] }, hasBritish: true, desc: 'OW has two sounds: /aʊ/ (cow, now, town) and /oʊ/ in American English or /əʊ/ in British English (know, show, grow).' },
  { id: 'ou', symbol: 'OU', name: 'ou — Out / Soup / Could', sounds: ['/aʊ/', '/uː/', '/ʊ/', '/ʌ/'], examples: { us: [{ word: 'out', ipa: '/aʊt/' }, { word: 'soup', ipa: '/suːp/' }, { word: 'could', ipa: '/kʊd/' }], uk: [{ word: 'out', ipa: '/aʊt/' }, { word: 'soup', ipa: '/suːp/' }, { word: 'could', ipa: '/kʊd/' }] }, hasBritish: false, desc: 'OU is one of the most irregular multigraphs: /aʊ/ (out, found), /uː/ (soup, group), /ʊ/ (could, would, should), /ʌ/ (young, touch, trouble), /ɔː/ (thought, bought).' },
  { id: 'igh', symbol: 'IGH', name: 'igh — Night / Light / High', sounds: ['/aɪ/'], examples: { us: [{ word: 'night', ipa: '/naɪt/' }, { word: 'light', ipa: '/laɪt/' }, { word: 'high', ipa: '/haɪ/' }], uk: [{ word: 'night', ipa: '/naɪt/' }, { word: 'light', ipa: '/laɪt/' }, { word: 'high', ipa: '/haɪ/' }] }, hasBritish: false, desc: 'IGH is always /aɪ/ — the same sound as in "my" or "eye". The GH is always silent (night, right, high, fight).' },
  { id: 'tch', symbol: 'TCH', name: 'tch — Watch / Kitchen', sounds: ['/tʃ/'], examples: { us: [{ word: 'watch', ipa: '/wɑːtʃ/' }, { word: 'kitchen', ipa: '/ˈkɪtʃɪn/' }, { word: 'match', ipa: '/mætʃ/' }], uk: [{ word: 'watch', ipa: '/wɒtʃ/' }, { word: 'kitchen', ipa: '/ˈkɪtʃɪn/' }, { word: 'match', ipa: '/mætʃ/' }] }, hasBritish: false, desc: 'TCH is always /tʃ/ (the "ch" sound). It appears after short vowels just like CK appears after short vowels for /k/ (match, watch, kitchen, fetch).' },
  { id: 'ai', symbol: 'AI', name: 'ai — Rain / Wait / Said', sounds: ['/eɪ/', '/e/'], examples: { us: [{ word: 'rain', ipa: '/reɪn/' }, { word: 'wait', ipa: '/weɪt/' }, { word: 'said', ipa: '/sed/' }], uk: [{ word: 'rain', ipa: '/reɪn/' }, { word: 'wait', ipa: '/weɪt/' }, { word: 'said', ipa: '/sed/' }] }, hasBritish: false, desc: 'AI is usually /eɪ/ (rain, train, wait). Exceptions: said, again (which use /e/).' },
];

const VOWEL_DATA = [
  { id: 'iː', ipa: '/iː/', name: 'Long EE', type: 'monophthong', spellings: ['ee', 'ea', 'ie', 'ei', 'e_e', 'e', 'i', 'ey'], examples: [{ word: 'feet', ipa: '/fiːt/' }, { word: 'beat', ipa: '/biːt/' }, { word: 'piece', ipa: '/piːs/' }, { word: 'receive', ipa: '/rɪˈsiːv/' }, { word: 'theme', ipa: '/θiːm/' }, { word: 'key', ipa: '/kiː/' }], desc: 'Close front unrounded vowel. Tongue is high and near the front. Lips are slightly spread as if smiling. This is a tense vowel.' },
  { id: 'ɪ', ipa: '/ɪ/', name: 'Short I', type: 'monophthong', spellings: ['i', 'e', 'y', 'ui', 'ie'], examples: [{ word: 'sit', ipa: '/sɪt/' }, { word: 'bit', ipa: '/bɪt/' }, { word: 'pretty', ipa: '/ˈprɪti/' }, { word: 'busy', ipa: '/ˈbɪzi/' }, { word: 'build', ipa: '/bɪld/' }], desc: 'Near-close front unrounded vowel. Similar to /iː/ but shorter, more relaxed, and slightly lower. The tongue is not as far forward.' },
  { id: 'e', ipa: '/e/', name: 'Short E', type: 'monophthong', spellings: ['e', 'ea', 'ai', 'a', 'ie', 'oe'], examples: [{ word: 'bet', ipa: '/bet/' }, { word: 'head', ipa: '/hed/' }, { word: 'said', ipa: '/sed/' }, { word: 'any', ipa: '/ˈeni/' }, { word: 'friend', ipa: '/frend/' }], desc: 'Close-mid front unrounded vowel. Used in American English for words like "bet", "head". In British English this is sometimes described as /ɛ/.' },
  { id: 'æ', ipa: '/æ/', name: 'Short A', type: 'monophthong', spellings: ['a', 'ai', 'au'], examples: [{ word: 'cat', ipa: '/kæt/' }, { word: 'map', ipa: '/mæp/' }, { word: 'hand', ipa: '/hænd/' }, { word: 'plait', ipa: '/plæt/' }, { word: 'laugh', ipa: '/læf/' }], desc: 'Near-open front unrounded vowel. Mouth is quite open, tongue is low and forward. This sound doesn\'t exist in many languages — a classic challenge for learners.' },
  { id: 'ɑː', ipa: '/ɑː/', name: 'Long AH', type: 'monophthong', spellings: ['a', 'ar', 'al', 'au', 'ear'], examples: [{ word: 'father', ipa: '/ˈfɑːðər/' }, { word: 'car', ipa: '/kɑːr/' }, { word: 'calm', ipa: '/kɑːm/' }, { word: 'heart', ipa: '/hɑːrt/' }, { word: 'palm', ipa: '/pɑːm/' }], desc: 'Open back unrounded vowel. Mouth is wide open, tongue is low and at the back. In British English, words like "bath", "path", "can\'t" use this long /ɑː/ while American English uses /æ/.' },
  { id: 'ɒ', ipa: '/ɒ/', name: 'Short O (British)', type: 'monophthong', spellings: ['o', 'a', 'ou'], examples: [{ word: 'lot', ipa: '/lɒt/' }, { word: 'dog', ipa: '/dɒɡ/' }, { word: 'wash', ipa: '/wɒʃ/' }, { word: 'want', ipa: '/wɒnt/' }], desc: 'Open back rounded vowel — a British English vowel. Lips are slightly rounded, mouth is open. This sound does NOT exist in standard American English, where /ɑː/ or /ɔː/ is used instead.' },
  { id: 'ʌ', ipa: '/ʌ/', name: 'Short U', type: 'monophthong', spellings: ['u', 'o', 'ou', 'oo'], examples: [{ word: 'cup', ipa: '/kʌp/' }, { word: 'love', ipa: '/lʌv/' }, { word: 'rough', ipa: '/rʌf/' }, { word: 'flood', ipa: '/flʌd/' }, { word: 'mother', ipa: '/ˈmʌðər/' }], desc: 'Open-mid back unrounded vowel. A very common English sound. The mouth is half-open, tongue is central-back. This is the sound in "cup", "love", "blood".' },
  { id: 'ɔː', ipa: '/ɔː/', name: 'Long AW', type: 'monophthong', spellings: ['aw', 'au', 'or', 'oar', 'oor', 'ou', 'a'], examples: [{ word: 'saw', ipa: '/sɔː/' }, { word: 'call', ipa: '/kɔːl/' }, { word: 'more', ipa: '/mɔːr/' }, { word: 'board', ipa: '/bɔːrd/' }, { word: 'bought', ipa: '/bɔːt/' }], desc: 'Open-mid back rounded vowel. Lips are rounded, mouth is half-open. In American English, this vowel is often merged with /ɑː/ (the cot-caught merger).' },
  { id: 'oʊ', ipa: '/oʊ/', name: 'Long O (American)', type: 'diphthong', spellings: ['o', 'oa', 'ow', 'oe', 'ou'], examples: [{ word: 'go', ipa: '/ɡoʊ/' }, { word: 'boat', ipa: '/boʊt/' }, { word: 'show', ipa: '/ʃoʊ/' }, { word: 'toe', ipa: '/toʊ/' }, { word: 'soul', ipa: '/soʊl/' }], desc: 'American English diphthong /oʊ/. Starts at /o/ and glides toward /ʊ/. British English uses /əʊ/ instead (starts with the schwa). Compare: American "go" /ɡoʊ/ vs British "go" /ɡəʊ/.' },
  { id: 'uː', ipa: '/uː/', name: 'Long OO', type: 'monophthong', spellings: ['oo', 'u', 'ue', 'ew', 'ou', 'o', 'ui', 'oe'], examples: [{ word: 'moon', ipa: '/muːn/' }, { word: 'blue', ipa: '/bluː/' }, { word: 'new', ipa: '/njuː/' }, { word: 'group', ipa: '/ɡruːp/' }, { word: 'shoe', ipa: '/ʃuː/' }], desc: 'Close back rounded vowel. Lips are tightly rounded, tongue is high and back. After /t, d, n, s/ etc., British English often inserts a /j/ glide: "tune" /tjuːn/ in UK vs /tuːn/ in US.' },
  { id: 'ʊ', ipa: '/ʊ/', name: 'Short OO', type: 'monophthong', spellings: ['oo', 'u', 'ould', 'o'], examples: [{ word: 'book', ipa: '/bʊk/' }, { word: 'put', ipa: '/pʊt/' }, { word: 'should', ipa: '/ʃʊd/' }, { word: 'bull', ipa: '/bʊl/' }, { word: 'woman', ipa: '/ˈwʊmən/' }], desc: 'Near-close back rounded vowel. Shorter and more relaxed than /uː/. Lips are loosely rounded. Common in "book, cook, look, put, bull, sugar".' },
  { id: 'ɜː', ipa: '/ɜː/', name: 'ER sound', type: 'monophthong', spellings: ['er', 'ur', 'ir', 'ear', 'or', 'our'], examples: [{ word: 'bird', ipa: '/bɜːrd/' }, { word: 'turn', ipa: '/tɜːrn/' }, { word: 'her', ipa: '/hɜːr/' }, { word: 'learn', ipa: '/lɜːrn/' }, { word: 'word', ipa: '/wɜːrd/' }], desc: 'Open-mid central unrounded vowel. In American English, this is the "r-colored" vowel /ɝː/ (rhoticized). In British English, the R is not pronounced: bird /bɜːd/ vs American /bɜːrd/.' },
  { id: 'ə', ipa: '/ə/', name: 'Schwa', type: 'monophthong', spellings: ['a', 'e', 'i', 'o', 'u', 'ou', 'er'], examples: [{ word: 'about', ipa: '/əˈbaʊt/' }, { word: 'sofa', ipa: '/ˈsoʊfə/' }, { word: 'taken', ipa: '/ˈteɪkən/' }, { word: 'support', ipa: '/səˈpɔːrt/' }], desc: 'The schwa is the MOST COMMON vowel in English. It only appears in unstressed syllables. The mouth is in a neutral, relaxed position — neither open nor closed. Mastering the schwa is key to sounding natural.' },
  { id: 'eɪ', ipa: '/eɪ/', name: 'Long A', type: 'diphthong', spellings: ['a_e', 'ai', 'ay', 'ea', 'ei', 'ey', 'a', 'eigh'], examples: [{ word: 'name', ipa: '/neɪm/' }, { word: 'rain', ipa: '/reɪn/' }, { word: 'day', ipa: '/deɪ/' }, { word: 'great', ipa: '/ɡreɪt/' }, { word: 'eight', ipa: '/eɪt/' }], desc: 'Diphthong — starts at /e/ and glides up toward /ɪ/. This is the name of the letter "A". Very common in English.' },
  { id: 'aɪ', ipa: '/aɪ/', name: 'Long I', type: 'diphthong', spellings: ['i_e', 'ie', 'igh', 'i', 'y', 'ai', 'ei', 'uy'], examples: [{ word: 'time', ipa: '/taɪm/' }, { word: 'pie', ipa: '/paɪ/' }, { word: 'night', ipa: '/naɪt/' }, { word: 'try', ipa: '/traɪ/' }, { word: 'buy', ipa: '/baɪ/' }], desc: 'Diphthong — starts at /a/ (open, low) and glides up toward /ɪ/. This is the name of the letter "I". One of the most common diphthongs in English.' },
  { id: 'aʊ', ipa: '/aʊ/', name: 'OW sound', type: 'diphthong', spellings: ['ow', 'ou', 'ough'], examples: [{ word: 'now', ipa: '/naʊ/' }, { word: 'out', ipa: '/aʊt/' }, { word: 'house', ipa: '/haʊs/' }, { word: 'bough', ipa: '/baʊ/' }], desc: 'Diphthong — starts at /a/ (open, low) and glides up toward /ʊ/ (rounded). The lips become rounded as you move through the vowel.' },
  { id: 'ɔɪ', ipa: '/ɔɪ/', name: 'OY sound', type: 'diphthong', spellings: ['oy', 'oi'], examples: [{ word: 'boy', ipa: '/bɔɪ/' }, { word: 'noise', ipa: '/nɔɪz/' }, { word: 'enjoy', ipa: '/ɪnˈdʒɔɪ/' }, { word: 'oil', ipa: '/ɔɪl/' }], desc: 'Diphthong — starts at /ɔː/ (rounded, open-mid) and glides toward /ɪ/. Lips start rounded and spread as the vowel moves.' },
];

const CONSONANT_DATA = [
  { id: 'p', ipa: '/p/', name: 'P — Voiceless bilabial stop', voiced: false, manner: 'stop', place: 'bilabial', spellings: ['p', 'pp', 'ph'], examples: [{ word: 'pen', ipa: '/pen/' }, { word: 'happy', ipa: '/ˈhæpi/' }, { word: 'cap', ipa: '/kæp/' }], desc: 'Both lips come together and release a puff of air. /p/ is voiceless — no vibration in the throat. In English, /p/ at the start of stressed syllables is aspirated (a small burst of air): "pin" /pʰɪn/.' },
  { id: 'b', ipa: '/b/', name: 'B — Voiced bilabial stop', voiced: true, manner: 'stop', place: 'bilabial', spellings: ['b', 'bb'], examples: [{ word: 'ball', ipa: '/bɔːl/' }, { word: 'rabbit', ipa: '/ˈræbɪt/' }, { word: 'crib', ipa: '/krɪb/' }], desc: 'Like /p/ but voiced — the vocal cords vibrate. Both lips close and release. Final /b/ may be devoiced (partially or fully) at the end of words.' },
  { id: 't', ipa: '/t/', name: 'T — Voiceless alveolar stop', voiced: false, manner: 'stop', place: 'alveolar', spellings: ['t', 'tt', 'ed', 'th'], examples: [{ word: 'top', ipa: '/tɑːp/' }, { word: 'butter', ipa: '/ˈbʌtər/' }, { word: 'stopped', ipa: '/stɑːpt/' }], desc: 'Tongue tip touches the alveolar ridge (just behind upper front teeth), then releases. In American English, /t/ between vowels often becomes a flap /ɾ/ (butter → "budder"). /t/ is silent in "listen, castle, often".' },
  { id: 'd', ipa: '/d/', name: 'D — Voiced alveolar stop', voiced: true, manner: 'stop', place: 'alveolar', spellings: ['d', 'dd', 'ed'], examples: [{ word: 'dog', ipa: '/dɔːɡ/' }, { word: 'saddle', ipa: '/ˈsædl/' }, { word: 'played', ipa: '/pleɪd/' }], desc: 'Like /t/ but voiced. Tongue tip on alveolar ridge. In American English, both /t/ and /d/ between vowels can become the flap /ɾ/, making "writer" and "rider" sound similar.' },
  { id: 'k', ipa: '/k/', name: 'K — Voiceless velar stop', voiced: false, manner: 'stop', place: 'velar', spellings: ['k', 'c', 'ck', 'ch', 'q', 'x'], examples: [{ word: 'key', ipa: '/kiː/' }, { word: 'cat', ipa: '/kæt/' }, { word: 'black', ipa: '/blæk/' }], desc: 'The back of the tongue contacts the soft palate (velum) and releases. Voiceless. /k/ is silent before /n/ at word starts: knife, know, knock.' },
  { id: 'ɡ', ipa: '/ɡ/', name: 'G — Voiced velar stop', voiced: true, manner: 'stop', place: 'velar', spellings: ['g', 'gg', 'gh', 'gu'], examples: [{ word: 'get', ipa: '/ɡet/' }, { word: 'egg', ipa: '/eɡ/' }, { word: 'ghost', ipa: '/ɡoʊst/' }], desc: 'Like /k/ but voiced. Back of tongue contacts soft palate. /ɡ/ is silent in "gnat, gnome, sign" and sometimes in "-gn" endings.' },
  { id: 'f', ipa: '/f/', name: 'F — Voiceless labiodental fricative', voiced: false, manner: 'fricative', place: 'labiodental', spellings: ['f', 'ff', 'ph', 'gh', 'lf'], examples: [{ word: 'fish', ipa: '/fɪʃ/' }, { word: 'laugh', ipa: '/læf/' }, { word: 'phone', ipa: '/foʊn/' }], desc: 'Upper teeth rest lightly on the lower lip. Air flows through to create friction. Voiceless. Partner of /v/.' },
  { id: 'v', ipa: '/v/', name: 'V — Voiced labiodental fricative', voiced: true, manner: 'fricative', place: 'labiodental', spellings: ['v', 'f', 'ph'], examples: [{ word: 'van', ipa: '/væn/' }, { word: 'love', ipa: '/lʌv/' }, { word: 'of', ipa: '/ɒv/' }], desc: 'Like /f/ but voiced — the vocal cords vibrate. Upper teeth on lower lip. /v/ is the voiced counterpart of /f/. Note: "of" is pronounced /ɒv/, not /ɒf/.' },
  { id: 'θ', ipa: '/θ/', name: 'TH — Voiceless dental fricative', voiced: false, manner: 'fricative', place: 'dental', spellings: ['th'], examples: [{ word: 'think', ipa: '/θɪŋk/' }, { word: 'bath', ipa: '/bæθ/' }, { word: 'both', ipa: '/boʊθ/' }], desc: 'The tongue tip goes between the upper and lower teeth (or just behind the upper teeth). Air flows to create friction. Voiceless. Very few other languages have this sound — a major challenge for learners.' },
  { id: 'ð', ipa: '/ð/', name: 'TH — Voiced dental fricative', voiced: true, manner: 'fricative', place: 'dental', spellings: ['th'], examples: [{ word: 'the', ipa: '/ðə/' }, { word: 'this', ipa: '/ðɪs/' }, { word: 'with', ipa: '/wɪð/' }], desc: 'Like /θ/ but voiced. The voiced "TH" appears in function words (the, this, that, there, them) and word endings (bathe, breathe, soothe).' },
  { id: 's', ipa: '/s/', name: 'S — Voiceless alveolar fricative', voiced: false, manner: 'fricative', place: 'alveolar', spellings: ['s', 'ss', 'c', 'sc', 'x'], examples: [{ word: 'sun', ipa: '/sʌn/' }, { word: 'dress', ipa: '/dres/' }, { word: 'city', ipa: '/ˈsɪti/' }], desc: 'Tongue tip near alveolar ridge, air flows through a narrow groove to create a hissing sound. Voiceless. Partner of /z/. In plurals and verb endings, -s can be /s/, /z/, or /ɪz/ depending on the preceding sound.' },
  { id: 'z', ipa: '/z/', name: 'Z — Voiced alveolar fricative', voiced: true, manner: 'fricative', place: 'alveolar', spellings: ['z', 'zz', 's', 'x'], examples: [{ word: 'zoo', ipa: '/zuː/' }, { word: 'buzz', ipa: '/bʌz/' }, { word: 'dogs', ipa: '/dɒɡz/' }], desc: 'Like /s/ but voiced. Produces a buzzing sound. /z/ appears in most plural nouns and verb endings after voiced sounds (dogs, runs, plays).' },
  { id: 'ʃ', ipa: '/ʃ/', name: 'SH — Voiceless postalveolar fricative', voiced: false, manner: 'fricative', place: 'postalveolar', spellings: ['sh', 'ti', 'ci', 'si', 'ss', 's', 'ch'], examples: [{ word: 'ship', ipa: '/ʃɪp/' }, { word: 'nation', ipa: '/ˈneɪʃən/' }, { word: 'sure', ipa: '/ʃʊr/' }], desc: 'Tongue near the roof of the mouth (further back than /s/). Lips slightly rounded. The "shushing" sound. Appears as SH, and in TI (nation), CI (special), SI (mansion).' },
  { id: 'ʒ', ipa: '/ʒ/', name: 'ZH — Voiced postalveolar fricative', voiced: true, manner: 'fricative', place: 'postalveolar', spellings: ['s', 'si', 'z', 'zh', 'ti', 'g'], examples: [{ word: 'measure', ipa: '/ˈmeʒər/' }, { word: 'vision', ipa: '/ˈvɪʒən/' }, { word: 'beige', ipa: '/beɪʒ/' }], desc: 'The voiced partner of /ʃ/. Less common in English than /ʃ/. Found mainly in borrowed words and in -sion/-sure endings (vision, measure, casual, beige).' },
  { id: 'h', ipa: '/h/', name: 'H — Voiceless glottal fricative', voiced: false, manner: 'fricative', place: 'glottal', spellings: ['h', 'wh'], examples: [{ word: 'hat', ipa: '/hæt/' }, { word: 'behind', ipa: '/bɪˈhaɪnd/' }, { word: 'who', ipa: '/huː/' }], desc: 'Air passes through the open glottis causing friction. There is no specific tongue or lip position — just a breath of air. /h/ is silent in: hour, honest, heir, vehicle, and often in unstressed function words (he, his, him, her) in fast speech.' },
  { id: 'tʃ', ipa: '/tʃ/', name: 'CH — Voiceless postalveolar affricate', voiced: false, manner: 'affricate', place: 'postalveolar', spellings: ['ch', 'tch', 'tu', 'ti'], examples: [{ word: 'church', ipa: '/tʃɜːrtʃ/' }, { word: 'watch', ipa: '/wɑːtʃ/' }, { word: 'nature', ipa: '/ˈneɪtʃər/' }], desc: 'An affricate — it starts as a stop (/t/) and releases as a fricative (/ʃ/). The tongue blocks the airflow behind the alveolar ridge then releases with friction. Voiceless.' },
  { id: 'dʒ', ipa: '/dʒ/', name: 'J — Voiced postalveolar affricate', voiced: true, manner: 'affricate', place: 'postalveolar', spellings: ['j', 'g', 'dge', 'di', 'du'], examples: [{ word: 'jump', ipa: '/dʒʌmp/' }, { word: 'gem', ipa: '/dʒem/' }, { word: 'bridge', ipa: '/brɪdʒ/' }], desc: 'Like /tʃ/ but voiced. Starts as /d/ and releases as /ʒ/. This is the "J" sound in English. Appears as J, G before e/i/y, DGE (bridge, dodge, judge).' },
  { id: 'm', ipa: '/m/', name: 'M — Voiced bilabial nasal', voiced: true, manner: 'nasal', place: 'bilabial', spellings: ['m', 'mm', 'mb', 'mn', 'lm'], examples: [{ word: 'man', ipa: '/mæn/' }, { word: 'summer', ipa: '/ˈsʌmər/' }, { word: 'lamb', ipa: '/læm/' }], desc: 'Both lips close, air flows through the nose. Voiced nasal. The velum (soft palate) is lowered to allow nasal airflow. MB at the end of words: B is silent (lamb, bomb, comb, thumb).' },
  { id: 'n', ipa: '/n/', name: 'N — Voiced alveolar nasal', voiced: true, manner: 'nasal', place: 'alveolar', spellings: ['n', 'nn', 'kn', 'gn', 'pn'], examples: [{ word: 'net', ipa: '/net/' }, { word: 'dinner', ipa: '/ˈdɪnər/' }, { word: 'know', ipa: '/noʊ/' }], desc: 'Tongue tip on alveolar ridge, air flows through the nose. Voiced. KN at the start of words: K is silent (know, knife, knight). GN: G is silent (gnome, gnaw, sign).' },
  { id: 'ŋ', ipa: '/ŋ/', name: 'NG — Voiced velar nasal', voiced: true, manner: 'nasal', place: 'velar', spellings: ['ng', 'n (before k/g)'], examples: [{ word: 'sing', ipa: '/sɪŋ/' }, { word: 'think', ipa: '/θɪŋk/' }, { word: 'running', ipa: '/ˈrʌnɪŋ/' }], desc: 'Back of tongue contacts soft palate, air flows through the nose. /ŋ/ never appears at the start of a word in English. It occurs at word endings (sing, king) and before /k/ and /ɡ/ (think, bank, language).' },
  { id: 'l', ipa: '/l/', name: 'L — Voiced alveolar lateral', voiced: true, manner: 'lateral', place: 'alveolar', spellings: ['l', 'll'], examples: [{ word: 'lamp', ipa: '/læmp/' }, { word: 'full', ipa: '/fʊl/' }, { word: 'bottle', ipa: '/ˈbɑːtl/' }], desc: 'Tongue tip on alveolar ridge, air flows around the sides. Two variants: "clear /l/" before vowels (light, lamp) and "dark /l/" (ɫ) before consonants and at word ends (full, bottle). British English uses dark /l/ less than American.' },
  { id: 'r', ipa: '/r/', name: 'R — Voiced approximant', voiced: true, manner: 'approximant', place: 'postalveolar', spellings: ['r', 'rr', 'wr', 'rh'], examples: [{ word: 'red', ipa: '/ɹed/' }, { word: 'sorry', ipa: '/ˈsɑːri/' }, { word: 'car', ipa: '/kɑːr/' }], desc: 'American /r/ is retroflex — the tongue tip curls back. British /r/ is post-alveolar without curling. The biggest US/UK difference: American English is RHOTIC (R always pronounced), British English drops post-vocalic R (car /kɑː/, better /ˈbetə/).' },
  { id: 'j', ipa: '/j/', name: 'Y — Voiced palatal approximant', voiced: true, manner: 'approximant', place: 'palatal', spellings: ['y', 'i', 'j (some loanwords)'], examples: [{ word: 'yes', ipa: '/jes/' }, { word: 'year', ipa: '/jɪr/' }, { word: 'use', ipa: '/juːz/' }], desc: 'The tongue approaches the hard palate without touching it. This is a glide/semivowel — it transitions into a vowel. /j/ appears before vowels. Also found in /juː/ sounds (use, huge, beauty).' },
  { id: 'w', ipa: '/w/', name: 'W — Voiced labial-velar approximant', voiced: true, manner: 'approximant', place: 'labial-velar', spellings: ['w', 'wh', 'u', 'o'], examples: [{ word: 'wet', ipa: '/wet/' }, { word: 'away', ipa: '/əˈweɪ/' }, { word: 'quiet', ipa: '/ˈkwaɪət/' }], desc: 'Lips are rounded as for /uː/ then spread to the following vowel. Both bilabial (lips) and velar (back of tongue raised). /w/ is silent in "write, wrong, wrap" and "who, whose, whole".' },
];

const PHONOLOGICAL_DATA = [
  {
    id: 'stress', name: 'Word Stress', icon: '◉', tag: 'Foundation',
    desc: 'In English, every multi-syllable word has one stressed syllable that is louder, longer, and higher in pitch. Incorrect stress can make a word unrecognisable, even if the sounds are perfect.',
    rules: [
      { rule: 'Noun vs. Verb Stress', detail: 'Many two-syllable noun/verb pairs differ only in stress: PREsent (noun) vs. preSENT (verb). Others: CONduct / conDUCT, OBject / obJECT, PERmit / perMIT.' },
      { rule: 'Suffixes can move stress', detail: 'Adding -tion, -ity, -ic moves stress to the preceding syllable: PHOtograph → phoTOgraphy → photoGRAphic.' },
      { rule: 'Compound words', detail: 'Compound nouns stress the FIRST element: BLACKbird, HOTdog, BEDroom. Descriptive phrases stress the SECOND: black BIRD (a bird that is black).' },
    ],
    examples: [{ word: 'photograph', ipa: '/ˈfoʊtəɡræf/' }, { word: 'photography', ipa: '/fəˈtɒɡrəfi/' }, { word: 'PREsent (n)', ipa: '/ˈprezənt/' }, { word: 'preSENT (v)', ipa: '/prɪˈzent/' }]
  },
  {
    id: 'schwa', name: 'The Schwa /ə/', icon: 'ə', tag: 'Core',
    desc: 'The schwa is the most frequent vowel sound in English. It ONLY appears in unstressed syllables. Mastering schwa is the single biggest upgrade to natural-sounding English.',
    rules: [
      { rule: 'All vowel letters can be schwa', detail: '"a" in about /əˈbaʊt/, "e" in taken /ˈteɪkən/, "i" in easily /ˈiːzɪli/, "o" in common /ˈkɒmən/, "u" in support /səˈpɔːrt/.' },
      { rule: 'Function words reduce', detail: 'Articles, prepositions, conjunctions become schwa in connected speech: "a" → /ə/, "the" → /ðə/, "to" → /tə/, "for" → /fər/, "and" → /ən/.' },
      { rule: 'Schwa vs full vowel', detail: 'Compare the stressed and unstressed forms: "economy" /ɪˈkɒnəmi/ — only the /ɒ/ is fully pronounced; the others reduce.' },
    ],
    examples: [{ word: 'about', ipa: '/əˈbaʊt/' }, { word: 'sofa', ipa: '/ˈsoʊfə/' }, { word: 'a book', ipa: '/ə ˈbʊk/' }, { word: 'for you', ipa: '/fər juː/' }]
  },
  {
    id: 'sentence-stress', name: 'Sentence Stress & Rhythm', icon: '♪', tag: 'Fluency',
    desc: 'English is a stress-timed language — the rhythm is driven by stressed syllables, not syllable count. Content words (nouns, main verbs, adjectives, adverbs) are stressed. Function words (articles, prepositions, conjunctions, pronouns) are usually unstressed and reduced.',
    rules: [
      { rule: 'Content words get stress', detail: 'DOGS LOVE RUNNING in the PARK. The nouns, verb, and locative are stressed; "in" and "the" are reduced.' },
      { rule: 'Focus stress shows emphasis', detail: '"I didn\'t say HE took it" (someone else did). "I didn\'t say he TOOK it" (maybe he borrowed it). Stress changes meaning.' },
      { rule: 'Weak forms', detail: '"Can" = /kæn/ (strong) vs. /kən/ (weak in sentences). "Have" = /hæv/ vs /həv/. "Was" = /wɒz/ vs /wəz/.' },
    ],
    examples: [{ word: '"I LOVE coffee"', ipa: '/aɪ lʌv ˈkɒfi/' }, { word: '"Can you help?"', ipa: '/kən jə ˈhelp/' }, { word: '"I want to go"', ipa: '/aɪ wɒnə ɡoʊ/' }]
  },
  {
    id: 'connected-speech', name: 'Connected Speech', icon: '⟵⟶', tag: 'Advanced',
    desc: 'In natural speech, words flow together and change. Learning connected speech helps you understand native speakers and sound more fluent yourself.',
    rules: [
      { rule: 'Linking (sandhi)', detail: 'Consonant-vowel linking: "pick it up" → /ˈpɪ kɪ tʌp/. Vowel-vowel linking with /j/ or /w/: "go on" → /ɡoʊ wɒn/, "see it" → /siː jɪt/.' },
      { rule: 'Elision', detail: 'Sounds disappear in fast speech. "next day" → /nek deɪ/ (T drops). "last night" → /læs naɪt/. "government" → /ˈɡʌvmənt/ (n drops).' },
      { rule: 'Assimilation', detail: 'A sound changes to match its neighbor. "ten boys" → /tem bɔɪz/ (N → M before bilabial). "good morning" → /ɡʊm ˈmɔːrnɪŋ/.' },
      { rule: 'Intrusion', detail: 'A sound is added to ease transition. "law and order" → /ˌlɔːr ən ˈɔːrdər/ (R intrudes). "I am" → /aɪ jæm/ (Y intrudes).' },
    ],
    examples: [{ word: '"What do you want?"', ipa: '/ˌwɒdʒəˈwɒnt/' }, { word: '"I don\'t know"', ipa: '/aɪ dəʊnəʊ/' }, { word: '"going to"', ipa: '/ˈɡɒnə/' }]
  },
  {
    id: 'intonation', name: 'Intonation', icon: '↗↘', tag: 'Advanced',
    desc: 'Intonation is the melody of speech — how the pitch rises and falls across an utterance. Correct intonation is crucial for meaning and naturalness.',
    rules: [
      { rule: 'Falling tone ↘', detail: 'Used for statements, WH-questions, and commands. It signals finality and certainty. "I LIVE in London↘". "Where do you WORK?↘".' },
      { rule: 'Rising tone ↗', detail: 'Used for yes/no questions and to show the conversation continues. "Do you LIKE it?↗". Also used in lists: "I need milk↗, bread↗, and eggs↘."' },
      { rule: 'Fall-rise tone ↘↗', detail: 'Suggests uncertainty, reservation, or implied meaning. "The food was NICE↘↗" (but there\'s a "but..."). Very common in polite British English.' },
    ],
    examples: [{ word: 'Statement ↘', ipa: 'I love coffee.' }, { word: 'Yes/No Q ↗', ipa: 'Do you like it?' }, { word: 'Contrast ↘↗', ipa: 'I COULD come...' }]
  },
  {
    id: 'syllables', name: 'Syllables & Phonotactics', icon: '⬡', tag: 'Foundation',
    desc: 'A syllable is a unit of pronunciation with one vowel sound. Every English word can be divided into syllables. Understanding syllable structure helps with stress, spelling, and pronunciation.',
    rules: [
      { rule: 'Syllable structure: (C)V(C)', detail: 'English syllables have a vowel nucleus. Consonants can cluster: "strengths" /streŋkθs/ has 8 sounds in one syllable (CCVCCCC).' },
      { rule: 'Open vs closed syllables', detail: 'Open syllables end in a vowel → usually long/tense vowel: "go, me, no". Closed syllables end in a consonant → usually short/lax vowel: "sit, bed, dog".' },
      { rule: 'Syllabic consonants', detail: 'In unstressed syllables, /l/, /n/, /m/ can form a syllable alone (no vowel needed): "bottle" /ˈbɒtl̩/, "hidden" /ˈhɪdn̩/, "rhythm" /ˈrɪðm̩/.' },
    ],
    examples: [{ word: 'beautiful', ipa: '/ˈbjuː.tɪ.fəl/ (3)' }, { word: 'strengths', ipa: '/streŋkθs/ (1)' }, { word: 'comfortable', ipa: '/ˈkʌmf.tə.bəl/ (3)' }]
  },
  {
    id: 'minimal-pairs', name: 'Minimal Pairs', icon: '≈', tag: 'Practice',
    desc: 'Minimal pairs are words that differ by exactly one phoneme (sound). Practicing them trains your ear and mouth to distinguish and produce fine distinctions in English sounds.',
    rules: [
      { rule: 'Vowel minimal pairs', detail: '/ɪ/ vs /iː/: sit ↔ seat, ship ↔ sheep, live ↔ leave. /æ/ vs /e/: man ↔ men, bad ↔ bed. /ʊ/ vs /uː/: full ↔ fool, pull ↔ pool.' },
      { rule: 'Consonant minimal pairs', detail: '/p/ vs /b/: pin ↔ bin, cap ↔ cab. /θ/ vs /s/: think ↔ sink, three ↔ free, bath ↔ bass. /l/ vs /r/: light ↔ right, glass ↔ grass.' },
      { rule: 'Voice minimal pairs', detail: 'Many pairs differ only in voicing: /f/ vs /v/: fine ↔ vine, safe ↔ save. /s/ vs /z/: sip ↔ zip, price ↔ prize. /tʃ/ vs /dʒ/: chain ↔ Jane.' },
    ],
    examples: [{ word: 'sit / seat', ipa: '/sɪt/ / /siːt/' }, { word: 'think / sink', ipa: '/θɪŋk/ / /sɪŋk/' }, { word: 'light / right', ipa: '/laɪt/ / /raɪt/' }]
  },
  {
    id: 'rp-ga', name: 'RP vs. General American', icon: '🇬🇧↔🇺🇸', tag: 'Accents',
    desc: 'Received Pronunciation (RP) is the traditional prestige British accent. General American (GA) is the standard American accent. These are the two most taught accent models in pronunciation education.',
    rules: [
      { rule: 'Rhoticity', detail: 'GA is rhotic: R is always pronounced. RP is non-rhotic: R is silent after vowels. car /kɑːr/ (GA) vs /kɑː/ (RP). butter /ˈbʌtər/ vs /ˈbʌtə/.' },
      { rule: 'TRAP-BATH split', detail: 'In RP, words like bath, path, can\'t, dance, grass use /ɑː/: bath /bɑːθ/. In GA they use /æ/: bath /bæθ/.' },
      { rule: 'LOT-CLOTH split & cot-caught merger', detail: 'RP: lot /lɒt/, cloth /klɔːθ/. GA: many speakers merge these — cot and caught both /kɑːt/ (cot-caught merger). GA also has no /ɒ/ vowel.' },
      { rule: 'T-flapping (GA only)', detail: 'In GA, /t/ and /d/ between vowels become a flap /ɾ/: "butter" sounds like "budder", "city" like "siddy".' },
    ],
    examples: [{ word: 'bath GA/RP', ipa: '/bæθ/ / /bɑːθ/' }, { word: 'car GA/RP', ipa: '/kɑːr/ / /kɑː/' }, { word: 'tune GA/RP', ipa: '/tuːn/ / /tjuːn/' }]
  },
];

// ─── MAIN COMPONENT ──────────────────────────────────────────────────────────
export default function Pronunciation({ lang, theme, speakFn, bookmarks: propBookmarks, setBookmarks: propSetBookmarks, completed: propCompleted, setCompleted: propSetCompleted }) {
  const isDark = theme === 'dark';
  const isRTL = lang === 'ar';

  const CATEGORIES = [
    { id: 'vowels', label: isRTL ? 'الصوائت' : 'Vowels', count: VOWEL_DATA.length },
    { id: 'consonants', label: isRTL ? 'الصوامت' : 'Consonants', count: CONSONANT_DATA.length },
    { id: 'alphabet', label: isRTL ? 'الأحرف' : 'Alphabet', count: ALPHABET_DATA.length },
    { id: 'multigraphs', label: isRTL ? 'المركبات' : 'Multigraphs', count: MULTIGRAPH_DATA.length },
    { id: 'phonological', label: isRTL ? 'مفاهيم صوتية' : 'Phonology', count: PHONOLOGICAL_DATA.length },
  ];

  const [category, setCategory] = useState('vowels');
  const [selectedItem, setSelectedItem] = useState(null);
  const [accent, setAccent] = useState('us');
  const [voiceGender, setVoiceGender] = useState('female'); // 'male' | 'female'
  const [localBookmarks, setLocalBookmarks] = useState(() => {
    try { return JSON.parse(localStorage.getItem('venoxa_pron_bookmarks')) || []; } catch { return []; }
  });
  const [localCompleted, setLocalCompleted] = useState(() => {
    try { return JSON.parse(localStorage.getItem('venoxa_pron_completed')) || []; } catch { return []; }
  });

  const bookmarks = propBookmarks !== undefined ? propBookmarks : localBookmarks;
  const setBookmarks = propSetBookmarks !== undefined ? propSetBookmarks : setLocalBookmarks;
  const completed = propCompleted !== undefined ? propCompleted : localCompleted;
  const setCompleted = propSetCompleted !== undefined ? propSetCompleted : setLocalCompleted;

  const [filter, setFilter] = useState('all'); // all | bookmarked | completed
  const [search, setSearch] = useState('');
  const [speaking, setSpeaking] = useState(null);

  useEffect(() => {
    if (propBookmarks === undefined) {
      localStorage.setItem('venoxa_pron_bookmarks', JSON.stringify(bookmarks));
    }
  }, [bookmarks, propBookmarks]);

  useEffect(() => {
    if (propCompleted === undefined) {
      localStorage.setItem('venoxa_pron_completed', JSON.stringify(completed));
    }
  }, [completed, propCompleted]);

  const toggleBookmark = (id) => setBookmarks(p => p.includes(id) ? p.filter(b => b !== id) : [...p, id]);
  const toggleCompleted = (id) => setCompleted(p => p.includes(id) ? p.filter(c => c !== id) : [...p, id]);

  const speak = useCallback(async (text) => {
    if (!text) return;
    setSpeaking(text);
    try {
      if (typeof speakFn === 'function') {
        // Pass accent ('us'|'uk') and gender ('male'|'female') so the wrapper in
        // App.jsx temporarily sets _voiceAccent and all TTS backends honour the choice.
        await speakFn(text, voiceGender, accent);
      } else {
        if (!('speechSynthesis' in window)) return;
        window.speechSynthesis.cancel();
        const utt = new SpeechSynthesisUtterance(text);
        utt.lang = accent === 'uk' ? 'en-GB' : 'en-US';
        utt.rate = 0.82;
        const voices = window.speechSynthesis.getVoices();
        const pick = voices.find(v => v.lang === utt.lang && !v.localService)
          || voices.find(v => v.lang === utt.lang)
          || voices.find(v => v.lang.startsWith('en'));
        if (pick) utt.voice = pick;
        utt.onend = () => setSpeaking(null);
        utt.onerror = () => setSpeaking(null);
        window.speechSynthesis.speak(utt);
        return;
      }
    } finally {
      setSpeaking(null);
    }
  }, [accent, voiceGender, speakFn]);

  const getData = () => {
    const map = { vowels: VOWEL_DATA, consonants: CONSONANT_DATA, alphabet: ALPHABET_DATA, multigraphs: MULTIGRAPH_DATA, phonological: PHONOLOGICAL_DATA };
    let data = map[category] || [];
    if (filter === 'bookmarked') data = data.filter(i => bookmarks.includes(i.id));
    if (filter === 'completed') data = data.filter(i => completed.includes(i.id));
    if (search.trim()) {
      const q = search.toLowerCase();
      data = data.filter(i =>
        (i.ipa || i.letter || i.symbol || i.name || '').toLowerCase().includes(q) ||
        (i.name || '').toLowerCase().includes(q)
      );
    }
    return data;
  };

  const totalCompleted = completed.length;
  const totalItems = VOWEL_DATA.length + CONSONANT_DATA.length + ALPHABET_DATA.length + MULTIGRAPH_DATA.length + PHONOLOGICAL_DATA.length;
  const progressPct = Math.round((totalCompleted / totalItems) * 100);

  const data = getData();

  // Panel helpers
  const getSymbol = (item) => item.ipa || item.letter || item.symbol || item.icon || item.name;
  const getExamples = (item) => {
    if (item.examples && !item.examples.us) return item.examples;
    if (item.examples) return accent === 'uk' && item.hasBritish !== false ? (item.examples.uk || item.examples.us || item.examples) : (item.examples.us || item.examples);
    return [];
  };

  // ── CARD colors
  const cardBg = isDark ? 'rgba(15,15,19,0.70)' : 'rgba(255,255,255,0.80)';
  const cardBorder = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)';
  const cardHoverBorder = isDark ? 'rgba(255,255,255,0.16)' : 'rgba(0,0,0,0.14)';
  const accentColor = 'var(--app-accent1)';
  const accent2 = 'var(--app-accent2)';

  // Category color map
  const catColor = { vowels: '#FF5722', consonants: '#673AB7', alphabet: '#2196F3', multigraphs: '#009688', phonological: '#FF9800' };
  const catTagColor = catColor[category] || accentColor;

  // ── Type badge color
  const typeColor = (item) => {
    if (item.type === 'diphthong') return 'var(--app-accent2)';
    if (item.voiced !== undefined) return item.voiced ? '#22c55e' : '#ef4444';
    return accentColor;
  };

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto" dir={isRTL ? 'rtl' : 'ltr'}>

      {/* ── Header ── */}
      <div className="mb-6">
        <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
          <div>
            <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 dark:text-white mb-1">
              {isRTL ? '🎙️ النطق' : '🎙️ Pronunciation'}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 max-w-lg">
              {isRTL
                ? 'تعلّم جميع أصوات الإنجليزية — الحروف، التركيبات، الصوائت، الصوامت، والمفاهيم الصوتية مع النطق البريطاني والأمريكي'
                : 'Master every sound in English — alphabet, multigraphs, vowels, consonants, and phonological concepts with British & American audio'}
            </p>
          </div>
          {/* Progress badge */}
          <div
            className="flex flex-col items-center gap-1 px-5 py-3 rounded-2xl border shrink-0"
            style={{ background: cardBg, borderColor: cardBorder, backdropFilter: 'blur(24px)' }}
          >
            <span className="text-2xl font-extrabold" style={{ color: accentColor }}>{progressPct}%</span>
            <span className="text-xs text-gray-500 dark:text-gray-400">{isRTL ? 'مكتمل' : 'Complete'}</span>
            <span className="text-xs font-bold text-gray-400">{totalCompleted}/{totalItems}</span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-2 rounded-full overflow-hidden" style={{ background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)' }}>
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{ width: `${progressPct}%`, background: `linear-gradient(90deg, ${accentColor}, ${accent2})` }}
          />
        </div>
      </div>

      {/* ── Controls Row ── */}
      <div className="flex flex-wrap items-center gap-2 mb-5">
        {/* Search */}
        <div className="relative flex-1 min-w-[160px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={isRTL ? 'بحث...' : 'Search sounds...'}
            className="w-full h-10 pl-9 pr-4 rounded-2xl text-sm font-bold outline-none border transition-all"
            style={{ background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.80)', borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)', color: isDark ? 'white' : '#111' }}
          />
        </div>

        {/* Accent toggle */}
        <div className="flex rounded-2xl overflow-hidden border" style={{ borderColor: cardBorder }}>
          <button
            onClick={() => setAccent('us')}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold transition-all"
            style={{ background: accent === 'us' ? accentColor : (isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.7)'), color: accent === 'us' ? 'white' : (isDark ? 'rgba(255,255,255,0.6)' : '#666') }}
          >
            <USFlagMini /> 🇺🇸 US
          </button>
          <button
            onClick={() => setAccent('uk')}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold transition-all"
            style={{ background: accent === 'uk' ? '#C8102E' : (isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.7)'), color: accent === 'uk' ? 'white' : (isDark ? 'rgba(255,255,255,0.6)' : '#666') }}
          >
            <GBFlagMini /> 🇬🇧 UK
          </button>
        </div>

        {/* Voice gender toggle */}
        <div className="flex rounded-2xl overflow-hidden border" style={{ borderColor: cardBorder }}>
          <button
            onClick={() => setVoiceGender('female')}
            className="flex items-center gap-1 px-3 py-2 text-xs font-bold transition-all"
            style={{ background: voiceGender === 'female' ? 'var(--app-accent2)' : (isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.7)'), color: voiceGender === 'female' ? 'white' : (isDark ? 'rgba(255,255,255,0.6)' : '#666') }}
          >
            ♀ {isRTL ? 'أنثى' : 'Female'}
          </button>
          <button
            onClick={() => setVoiceGender('male')}
            className="flex items-center gap-1 px-3 py-2 text-xs font-bold transition-all"
            style={{ background: voiceGender === 'male' ? accentColor : (isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.7)'), color: voiceGender === 'male' ? 'white' : (isDark ? 'rgba(255,255,255,0.6)' : '#666') }}
          >
            ♂ {isRTL ? 'ذكر' : 'Male'}
          </button>
        </div>

        {/* Filter */}
        {['all', 'bookmarked', 'completed'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className="px-3 py-2 rounded-2xl text-xs font-bold border transition-all"
            style={{
              background: filter === f ? (f === 'bookmarked' ? accent2 : f === 'completed' ? '#22c55e' : accentColor) : (isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.7)'),
              borderColor: filter === f ? 'transparent' : cardBorder,
              color: filter === f ? 'white' : (isDark ? 'rgba(255,255,255,0.6)' : '#666'),
            }}
          >
            {f === 'all' ? (isRTL ? 'الكل' : 'All') : f === 'bookmarked' ? (isRTL ? '🔖 محفوظ' : '🔖 Saved') : (isRTL ? '✅ مكتمل' : '✅ Done')}
          </button>
        ))}
      </div>

      {/* ── Category Nav ── */}
      <div className="flex gap-2 mb-6 overflow-x-auto no-scrollbar pb-1">
        {CATEGORIES.map(cat => (
          <button
            key={cat.id}
            onClick={() => { setCategory(cat.id); setSelectedItem(null); setSearch(''); setFilter('all'); }}
            className="flex items-center gap-2 px-4 py-2 rounded-2xl text-sm font-bold whitespace-nowrap transition-all shrink-0 border"
            style={{
              background: category === cat.id ? catColor[cat.id] : (isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.7)'),
              borderColor: category === cat.id ? 'transparent' : cardBorder,
              color: category === cat.id ? 'white' : (isDark ? 'rgba(255,255,255,0.65)' : '#555'),
            }}
          >
            {cat.label}
            <span
              className="text-[10px] font-extrabold px-1.5 py-0.5 rounded-full"
              style={{ background: category === cat.id ? 'rgba(255,255,255,0.25)' : (isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)') }}
            >
              {cat.count}
            </span>
          </button>
        ))}
      </div>

      {/* ── Detail Panel (when item selected) ── */}
      {selectedItem && (
        <DetailPanel
          item={selectedItem}
          category={category}
          accent={accent}
          isDark={isDark}
          isRTL={isRTL}
          cardBg={cardBg}
          cardBorder={cardBorder}
          isBookmarked={bookmarks.includes(selectedItem.id)}
          isCompleted={completed.includes(selectedItem.id)}
          onClose={() => setSelectedItem(null)}
          onBookmark={() => toggleBookmark(selectedItem.id)}
          onComplete={() => toggleCompleted(selectedItem.id)}
          onSpeak={speak}
          speaking={speaking}
          accentColor={accentColor}
          catTagColor={catTagColor}
          getExamples={getExamples}
          getSymbol={getSymbol}
          typeColor={typeColor}
        />
      )}

      {/* ── Grid ── */}
      {!selectedItem && (
        <>
          {data.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="text-5xl mb-4">🔍</div>
              <p className="text-gray-500 dark:text-gray-400 font-bold">{isRTL ? 'لا توجد نتائج' : 'No results found'}</p>
            </div>
          )}
          <div className={`grid gap-3 ${
            category === 'phonological'
              ? 'grid-cols-1 md:grid-cols-2'
              : category === 'alphabet'
              ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5'
              : 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4'
          }`}>
            {data.map(item => (
              <SoundCard
                key={item.id}
                item={item}
                category={category}
                accent={accent}
                isDark={isDark}
                cardBg={cardBg}
                cardBorder={cardBorder}
                cardHoverBorder={cardHoverBorder}
                isBookmarked={bookmarks.includes(item.id)}
                isCompleted={completed.includes(item.id)}
                onSelect={() => setSelectedItem(item)}
                onBookmark={() => toggleBookmark(item.id)}
                onComplete={() => toggleCompleted(item.id)}
                onSpeak={speak}
                speaking={speaking}
                getExamples={getExamples}
                getSymbol={getSymbol}
                typeColor={typeColor}
                catTagColor={catTagColor}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ─── SOUND CARD ───────────────────────────────────────────────────────────────
function SoundCard({ item, category, accent, isDark, cardBg, cardBorder, cardHoverBorder, isBookmarked, isCompleted, onSelect, onBookmark, onComplete, onSpeak, speaking, getExamples, getSymbol, typeColor, catTagColor }) {
  const [hovered, setHovered] = useState(false);
  const symbol = getSymbol(item);
  const examples = getExamples(item) || [];
  const firstExample = Array.isArray(examples) ? examples[0] : null;
  const isPhono = category === 'phonological';

  return (
    <div
      className="relative rounded-2xl border cursor-pointer transition-all duration-300 group"
      style={{
        background: isCompleted ? (isDark ? 'rgba(34,197,94,0.08)' : 'rgba(34,197,94,0.06)') : cardBg,
        borderColor: isCompleted ? 'rgba(34,197,94,0.3)' : (hovered ? cardHoverBorder : cardBorder),
        backdropFilter: 'blur(24px)',
        transform: hovered ? 'translateY(-2px)' : 'translateY(0)',
        boxShadow: hovered ? (isDark ? '0 8px 32px rgba(0,0,0,0.4)' : '0 8px 24px rgba(0,0,0,0.10)') : 'none',
        padding: isPhono ? '1.25rem' : '1rem',
      }}
      onClick={onSelect}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Completed tick */}
      {isCompleted && (
        <div className="absolute top-2.5 right-2.5 w-5 h-5 rounded-full flex items-center justify-center" style={{ background: '#22c55e' }}>
          <CheckCircle2 className="w-3.5 h-3.5 text-white" />
        </div>
      )}

      {/* Bookmark indicator */}
      {isBookmarked && !isCompleted && (
        <div className="absolute top-2.5 right-2.5">
          <Bookmark className="w-4 h-4" style={{ color: 'var(--app-accent2)', fill: 'var(--app-accent2)' }} />
        </div>
      )}

      {isPhono ? (
        /* Phonological concept card — horizontal layout */
        <div>
          <div className="flex items-start gap-3 mb-2">
            <div className="text-3xl font-mono shrink-0 leading-none mt-0.5">{symbol}</div>
            <div className="flex-1 min-w-0">
              <h3 className="font-extrabold text-sm text-gray-900 dark:text-white leading-tight">{item.name}</h3>
              <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full mt-1" style={{ background: `${catTagColor}22`, color: catTagColor }}>{item.tag}</span>
            </div>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 leading-relaxed">{item.desc}</p>
        </div>
      ) : category === 'alphabet' ? (
        /* Alphabet card — compact */
        <div className="flex flex-col items-center text-center gap-1">
          <div className="text-4xl font-extrabold leading-none" style={{ color: catTagColor, fontFamily: 'monospace' }}>{symbol.split(' ')[0]}</div>
          <div className="text-lg font-bold text-gray-400">{symbol.split(' ')[1] || ''}</div>
          {firstExample && (
            <div className="mt-1">
              <div className="text-xs font-extrabold text-gray-700 dark:text-gray-200">{firstExample.word}</div>
              <div className="text-[10px] text-gray-400 font-mono">{firstExample.ipa}</div>
            </div>
          )}
          <div className="flex flex-wrap gap-1 mt-1 justify-center">
            {(item.sounds || []).slice(0, 2).map(s => (
              <span key={s} className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-lg" style={{ background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)', color: catTagColor }}>{s}</span>
            ))}
          </div>
        </div>
      ) : (
        /* Vowel / Consonant / Multigraph card */
        <div>
          <div className="flex items-start justify-between gap-2 mb-2">
            <div>
              <div className="text-2xl md:text-3xl font-extrabold font-mono leading-none mb-1" style={{ color: typeColor(item) }}>{symbol}</div>
              <div className="text-xs font-bold text-gray-600 dark:text-gray-300">{item.name}</div>
            </div>
            <button
              className="p-1.5 rounded-xl transition-all shrink-0 mt-0.5"
              style={{ background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)' }}
              onClick={e => { e.stopPropagation(); if (firstExample) onSpeak(firstExample.word); }}
              title="Play"
            >
              <Volume2 className="w-3.5 h-3.5" style={{ color: speaking === firstExample?.word ? catTagColor : (isDark ? 'rgba(255,255,255,0.5)' : '#888') }} />
            </button>
          </div>

          {/* Type badge */}
          {(item.type || item.manner) && (
            <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full mb-2 capitalize" style={{ background: `${typeColor(item)}22`, color: typeColor(item) }}>
              {item.type || item.manner}
            </span>
          )}

          {/* First example */}
          {firstExample && (
            <div className="flex items-baseline gap-2">
              <span className="text-sm font-bold text-gray-800 dark:text-white">{firstExample.word}</span>
              <span className="text-xs font-mono text-gray-400">{firstExample.ipa}</span>
            </div>
          )}
        </div>
      )}

      {/* Hover overlay */}
      <div
        className="absolute inset-0 rounded-2xl transition-opacity duration-200 pointer-events-none"
        style={{ opacity: hovered ? 1 : 0, background: `${catTagColor}08` }}
      />
    </div>
  );
}

// ─── DETAIL PANEL ─────────────────────────────────────────────────────────────
function DetailPanel({ item, category, accent, isDark, isRTL, cardBg, cardBorder, isBookmarked, isCompleted, onClose, onBookmark, onComplete, onSpeak, speaking, accentColor, catTagColor, getExamples, getSymbol, typeColor }) {
  const symbol = getSymbol(item);
  const examples = getExamples(item) || [];
  const isPhono = category === 'phonological';
  const isAlpha = category === 'alphabet';

  return (
    <div className="mb-6 rounded-3xl border overflow-hidden animate-fadeIn" style={{ background: cardBg, borderColor: cardBorder, backdropFilter: 'blur(32px)' }}>
      {/* Header */}
      <div className="flex items-start justify-between gap-4 p-5 border-b" style={{ borderColor: cardBorder }}>
        <div className="flex items-start gap-4">
          <div
            className="flex items-center justify-center rounded-2xl text-3xl font-extrabold font-mono shrink-0"
            style={{ width: 64, height: 64, background: `${catTagColor}18`, color: catTagColor }}
          >
            {isPhono ? symbol : (isAlpha ? symbol.split(' ')[0] : symbol)}
          </div>
          <div>
            <h3 className="text-xl font-extrabold text-gray-900 dark:text-white mb-1">{item.name}</h3>
            {/* Tags */}
            <div className="flex flex-wrap gap-2">
              {item.type && <span className="text-xs font-bold px-2.5 py-1 rounded-full capitalize" style={{ background: `${typeColor(item)}22`, color: typeColor(item) }}>{item.type}</span>}
              {item.manner && <span className="text-xs font-bold px-2.5 py-1 rounded-full capitalize" style={{ background: `${catTagColor}22`, color: catTagColor }}>{item.manner}</span>}
              {item.place && <span className="text-xs font-bold px-2.5 py-1 rounded-full capitalize" style={{ background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)', color: isDark ? '#ccc' : '#555' }}>{item.place}</span>}
              {item.voiced !== undefined && (
                <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ background: item.voiced ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)', color: item.voiced ? '#22c55e' : '#ef4444' }}>
                  {item.voiced ? '🔊 Voiced' : '🔇 Voiceless'}
                </span>
              )}
              {item.tag && <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ background: `${catTagColor}22`, color: catTagColor }}>{item.tag}</span>}
              {item.hasBritish && <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ background: '#C8102E22', color: '#C8102E' }}>🇬🇧↔🇺🇸 Varies</span>}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onBookmark}
            className="w-9 h-9 flex items-center justify-center rounded-xl transition-all"
            style={{ background: isBookmarked ? 'var(--app-accent2)' : (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)') }}
            title={isBookmarked ? 'Remove bookmark' : 'Bookmark'}
          >
            {isBookmarked ? <Bookmark className="w-4 h-4 text-white" fill="white" /> : <BookmarkPlus className="w-4 h-4" style={{ color: isDark ? '#aaa' : '#666' }} />}
          </button>
          <button
            onClick={onComplete}
            className="w-9 h-9 flex items-center justify-center rounded-xl transition-all"
            style={{ background: isCompleted ? '#22c55e' : (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)') }}
            title={isCompleted ? 'Mark incomplete' : 'Mark complete'}
          >
            <CheckCircle className="w-4 h-4" style={{ color: isCompleted ? 'white' : (isDark ? '#aaa' : '#666') }} />
          </button>
          <button
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center rounded-xl transition-all"
            style={{ background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }}
          >
            <X className="w-4 h-4" style={{ color: isDark ? '#aaa' : '#666' }} />
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="p-5 space-y-5">
        {/* Description */}
        <div>
          <div className="text-xs font-extrabold uppercase tracking-widest mb-2" style={{ color: catTagColor }}>
            {isRTL ? 'الوصف' : 'Description'}
          </div>
          <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{item.desc}</p>
        </div>

        {/* Spelling patterns */}
        {(item.spellings || item.sounds) && (
          <div>
            <div className="text-xs font-extrabold uppercase tracking-widest mb-2" style={{ color: catTagColor }}>
              {item.spellings ? (isRTL ? 'أنماط الكتابة' : 'Spelling Patterns') : (isRTL ? 'الأصوات' : 'Sounds')}
            </div>
            <div className="flex flex-wrap gap-2">
              {(item.spellings || item.sounds || []).map((s, i) => (
                <span key={i} className="font-mono font-extrabold text-sm px-3 py-1.5 rounded-xl border" style={{ background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)', borderColor: isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.08)', color: catTagColor }}>
                  {s}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Rules (phonological concepts) */}
        {item.rules && (
          <div>
            <div className="text-xs font-extrabold uppercase tracking-widest mb-3" style={{ color: catTagColor }}>
              {isRTL ? 'القواعد' : 'Key Rules'}
            </div>
            <div className="space-y-3">
              {item.rules.map((r, i) => (
                <div key={i} className="flex gap-3">
                  <div className="w-1.5 h-1.5 rounded-full mt-2 shrink-0" style={{ background: catTagColor }} />
                  <div>
                    <div className="text-sm font-extrabold text-gray-900 dark:text-white">{r.rule}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed mt-0.5">{r.detail}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Example words */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="text-xs font-extrabold uppercase tracking-widest" style={{ color: catTagColor }}>
              {isRTL ? 'أمثلة' : 'Example Words'}
            </div>
            {/* Accent badge */}
            <div className="flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full" style={{ background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)', color: isDark ? '#aaa' : '#777' }}>
              {accent === 'uk' ? <><GBFlagMini /> British</> : <><USFlagMini /> American</>}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
            {(Array.isArray(examples) ? examples : []).map((ex, i) => (
              <button
                key={i}
                onClick={() => onSpeak(ex.word || ex.ipa || '')}
                className="flex items-center gap-3 p-3 rounded-2xl border text-left transition-all group"
                style={{
                  background: speaking === (ex.word || ex.ipa) ? `${catTagColor}18` : (isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)'),
                  borderColor: speaking === (ex.word || ex.ipa) ? catTagColor : (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'),
                }}
              >
                <div className="w-7 h-7 rounded-xl flex items-center justify-center shrink-0 transition-all" style={{ background: `${catTagColor}20` }}>
                  <Volume2 className="w-3.5 h-3.5" style={{ color: catTagColor }} />
                </div>
                <div>
                  <div className="text-sm font-extrabold text-gray-900 dark:text-white">{ex.word || ex.ipa}</div>
                  {ex.ipa && ex.word && <div className="text-[11px] font-mono text-gray-400">{ex.ipa}</div>}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Alphabet letter — all sounds breakdown */}
        {isAlpha && (
          <div className="p-4 rounded-2xl border" style={{ borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)', background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)' }}>
            <div className="text-xs font-extrabold uppercase tracking-widest mb-2" style={{ color: catTagColor }}>
              {isRTL ? 'جميع أصوات الحرف' : 'All Sounds of This Letter'}
            </div>
            <div className="flex flex-wrap gap-2">
              {(item.sounds || []).map((s, i) => (
                <button
                  key={i}
                  onClick={() => onSpeak(s.replace(/\//g, '').replace(/ː/g, ''))}
                  className="font-mono font-extrabold text-base px-4 py-2 rounded-xl border transition-all"
                  style={{ background: `${catTagColor}15`, borderColor: `${catTagColor}30`, color: catTagColor }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* US/UK comparison note (where relevant) */}
        {item.hasBritish && (
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-2xl border" style={{ borderColor: 'rgba(59,130,246,0.25)', background: 'rgba(59,130,246,0.06)' }}>
              <div className="flex items-center gap-1.5 mb-2 text-xs font-extrabold text-blue-500"><USFlagMini /> 🇺🇸 American</div>
              {(item.examples?.us || []).slice(0, 2).map((ex, i) => (
                <div key={i} className="flex items-center gap-2 text-xs">
                  <span className="font-bold text-gray-800 dark:text-gray-100">{ex.word}</span>
                  <span className="font-mono text-gray-400">{ex.ipa}</span>
                </div>
              ))}
            </div>
            <div className="p-3 rounded-2xl border" style={{ borderColor: 'rgba(200,16,46,0.25)', background: 'rgba(200,16,46,0.06)' }}>
              <div className="flex items-center gap-1.5 mb-2 text-xs font-extrabold text-red-500"><GBFlagMini /> 🇬🇧 British</div>
              {(item.examples?.uk || []).slice(0, 2).map((ex, i) => (
                <div key={i} className="flex items-center gap-2 text-xs">
                  <span className="font-bold text-gray-800 dark:text-gray-100">{ex.word}</span>
                  <span className="font-mono text-gray-400">{ex.ipa}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Complete button */}
        <button
          onClick={onComplete}
          className="w-full py-3 rounded-2xl font-extrabold text-sm transition-all border"
          style={{
            background: isCompleted ? 'rgba(34,197,94,0.12)' : `${catTagColor}18`,
            borderColor: isCompleted ? 'rgba(34,197,94,0.3)' : `${catTagColor}30`,
            color: isCompleted ? '#22c55e' : catTagColor,
          }}
        >
          {isCompleted ? (isRTL ? '✅ تم التعليم كمكتمل — اضغط للتراجع' : '✅ Marked Complete — click to undo') : (isRTL ? '✓ علّم كمكتمل' : '✓ Mark as Complete')}
        </button>
      </div>
    </div>
  );
}
