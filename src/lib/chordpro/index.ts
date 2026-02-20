import { ChordProParser, HtmlDivFormatter, Song } from 'chordsheetjs';

/**
 * Parse a ChordPro string into a chordsheetjs Song object.
 */
export function parseChordPro(content: string): Song {
  const parser = new ChordProParser();
  return parser.parse(content);
}

/**
 * Transpose a parsed Song by the given number of semitones.
 * Returns a new Song instance (immutable).
 */
export function transposeSong(song: Song, semitones: number): Song {
  if (semitones === 0) return song;
  return song.transpose(semitones);
}

/**
 * Render a parsed Song to an HTML string using HtmlDivFormatter.
 */
export function renderToHtml(song: Song): string {
  const formatter = new HtmlDivFormatter();
  return formatter.format(song);
}
