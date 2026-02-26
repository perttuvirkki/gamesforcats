export type PianoNoteId = "C4" | "Db4" | "D4" | "Eb4" | "E4" | "F4" | "Gb4" | "G4" | "Ab4" | "A4" | "Bb4" | "B4";

export type PianoNote = {
  id: PianoNoteId;
  label: string;
  source: number;
};

const NOTE_SOURCES: Record<PianoNoteId, number> = {
  C4: require("./C4.mp3"),
  Db4: require("./Db4.mp3"),
  D4: require("./D4.mp3"),
  Eb4: require("./Eb4.mp3"),
  E4: require("./E4.mp3"),
  F4: require("./F4.mp3"),
  Gb4: require("./Gb4.mp3"),
  G4: require("./G4.mp3"),
  Ab4: require("./Ab4.mp3"),
  A4: require("./A4.mp3"),
  Bb4: require("./Bb4.mp3"),
  B4: require("./B4.mp3"),
};

// Vertical layout: top B → bottom C (as requested).
export const PIANO_WHITE_KEYS_C4: PianoNote[] = [
  { id: "B4", label: "B", source: NOTE_SOURCES.B4 },
  { id: "A4", label: "A", source: NOTE_SOURCES.A4 },
  { id: "G4", label: "G", source: NOTE_SOURCES.G4 },
  { id: "F4", label: "F", source: NOTE_SOURCES.F4 },
  { id: "E4", label: "E", source: NOTE_SOURCES.E4 },
  { id: "D4", label: "D", source: NOTE_SOURCES.D4 },
  { id: "C4", label: "C", source: NOTE_SOURCES.C4 },
];

export const PIANO_BLACK_KEYS_C4: PianoNote[] = [
  { id: "Bb4", label: "Bb", source: NOTE_SOURCES.Bb4 },
  { id: "Ab4", label: "Ab", source: NOTE_SOURCES.Ab4 },
  { id: "Gb4", label: "Gb", source: NOTE_SOURCES.Gb4 },
  { id: "Eb4", label: "Eb", source: NOTE_SOURCES.Eb4 },
  { id: "Db4", label: "Db", source: NOTE_SOURCES.Db4 },
];
