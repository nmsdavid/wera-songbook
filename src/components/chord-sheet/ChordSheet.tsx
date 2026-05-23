'use client';

import { useMemo, useState } from 'react';
import DOMPurify from 'isomorphic-dompurify';
import { Button } from '@/components/ui/button';
import { parseChordPro, transposeSong, renderToHtml } from '@/lib/chordpro';

interface ChordSheetProps {
  content: string;
  originalKey?: string | null;
}

export function ChordSheet({ content, originalKey }: ChordSheetProps) {
  const [transposeOffset, setTransposeOffset] = useState(0);

  const baseSong = useMemo(() => {
    // If the song has no {key: …} directive, seed it from the form's Tonart so
    // chordsheetjs knows the key and updates the displayed key when transposing.
    const hasKeyDirective = /\{\s*key\s*:/i.test(content);
    const seeded =
      originalKey && !hasKeyDirective ? `{key: ${originalKey}}\n${content}` : content;
    return parseChordPro(seeded);
  }, [content, originalKey]);

  const { html, currentKey } = useMemo(() => {
    const transposed = transposeSong(baseSong, transposeOffset);
    return {
      html: DOMPurify.sanitize(renderToHtml(transposed)),
      currentKey: transposed.key ?? originalKey ?? null,
    };
  }, [baseSong, transposeOffset, originalKey]);

  return (
    <div className="space-y-4">
      {/* Transpose controls */}
      <div className="flex items-center gap-3 rounded-lg border bg-muted/50 px-4 py-2">
        <span className="text-sm font-medium text-muted-foreground">Tonart:</span>
        {currentKey && (
          <span className="font-mono text-sm font-bold">{currentKey}</span>
        )}
        {transposeOffset !== 0 && (
          <span className="text-xs text-muted-foreground">
            ({transposeOffset > 0 ? '+' : ''}{transposeOffset})
          </span>
        )}
        <div className="ml-auto flex items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setTransposeOffset((prev) => prev - 1)}
            aria-label="Einen Halbton tiefer"
          >
            −1
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setTransposeOffset((prev) => prev + 1)}
            aria-label="Einen Halbton höher"
          >
            +1
          </Button>
          {transposeOffset !== 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setTransposeOffset(0)}
            >
              Zurücksetzen
            </Button>
          )}
        </div>
      </div>

      {/* Chord sheet */}
      <div
        className={[
          'chord-sheet-container',
          // Title
          '[&_.title]:hidden',
          '[&_.subtitle]:hidden',
          // Paragraphs
          '[&_.paragraph]:mb-6',
          // Rows
          '[&_.row]:flex [&_.row]:flex-wrap',
          // Columns
          '[&_.column]:mr-1',
          // Chords
          '[&_.chord]:font-mono [&_.chord]:text-sm [&_.chord]:font-bold [&_.chord]:text-primary',
          '[&_.chord]:min-h-[1.25rem]',
          // Lyrics
          '[&_.lyrics]:font-sans [&_.lyrics]:text-base [&_.lyrics]:whitespace-pre-wrap',
          // Comment / section labels
          '[&_.comment]:font-sans [&_.comment]:text-sm [&_.comment]:font-bold [&_.comment]:text-muted-foreground',
          '[&_.comment]:mt-4 [&_.comment]:mb-1',
        ].join(' ')}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  );
}
