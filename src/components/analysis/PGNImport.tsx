"use client";

import { useState, useRef } from "react";
import { useAnalysisStore } from "@/stores/analysisStore";
import { isLichessGameUrl } from "@/lib/chess/pgn";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function PGNImport() {
  const { importPGN, importFromUrl, isImporting, importError } = useAnalysisStore();

  const [pgnText, setPgnText] = useState("");
  const [lichessUrl, setLichessUrl] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handlePgnSubmit() {
    if (!pgnText.trim()) return;
    importPGN(pgnText);
  }

  async function handleUrlSubmit() {
    if (!lichessUrl.trim()) return;
    await importFromUrl(lichessUrl);
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result;
      if (typeof content === "string") {
        importPGN(content);
      }
    };
    reader.readAsText(file);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Import Game</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Error message */}
        {importError && (
          <div className="rounded-md bg-red-50 p-3 text-sm text-red-600 dark:bg-red-950 dark:text-red-400">
            {importError}
          </div>
        )}

        {/* Method 1: Paste PGN */}
        <div className="space-y-2">
          <label htmlFor="pgn-textarea" className="text-sm font-medium text-foreground">
            Paste PGN
          </label>
          <textarea
            id="pgn-textarea"
            className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            placeholder="1. e4 e5 2. Nf3 Nc6..."
            value={pgnText}
            onChange={(e) => setPgnText(e.target.value)}
          />
          <Button
            onClick={handlePgnSubmit}
            disabled={isImporting || !pgnText.trim()}
            size="sm"
          >
            {isImporting ? "Importing..." : "Import PGN"}
          </Button>
        </div>

        {/* Divider */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-muted-foreground">or</span>
          </div>
        </div>

        {/* Method 2: File upload */}
        <div className="space-y-2">
          <label htmlFor="pgn-file" className="text-sm font-medium text-foreground">
            Upload PGN file
          </label>
          <div>
            <input
              ref={fileInputRef}
              id="pgn-file"
              type="file"
              accept=".pgn"
              onChange={handleFileChange}
              className="block w-full text-sm text-muted-foreground file:mr-4 file:rounded-md file:border-0 file:bg-primary file:px-4 file:py-2 file:text-sm file:font-medium file:text-primary-foreground hover:file:bg-primary/90"
            />
          </div>
        </div>

        {/* Divider */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-muted-foreground">or</span>
          </div>
        </div>

        {/* Method 3: Lichess URL */}
        <div className="space-y-2">
          <label htmlFor="lichess-url" className="text-sm font-medium text-foreground">
            Lichess Game URL
          </label>
          <div className="flex gap-2">
            <Input
              id="lichess-url"
              type="url"
              placeholder="https://lichess.org/abcdefgh"
              value={lichessUrl}
              onChange={(e) => setLichessUrl(e.target.value)}
            />
            <Button
              onClick={handleUrlSubmit}
              disabled={isImporting || !lichessUrl.trim() || !isLichessGameUrl(lichessUrl)}
              size="sm"
            >
              {isImporting ? "Fetching..." : "Fetch"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
