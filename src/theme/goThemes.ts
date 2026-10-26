import { HighlightStyle, syntaxHighlighting } from '@codemirror/language';
import { tags as t } from '@lezer/highlight';
import { EditorView } from '@codemirror/view';
import { Extension } from '@codemirror/state';

export type ThemeId =
  | 'gopher-dark'
  | 'gopher-light'
  | 'creme-vanille'
  | 'cafe-latte'
  | 'ambre-dore'
  | 'matcha-clair'
  | 'peche-pastel'
  | 'papier-journal'
  | 'win98-retro'
  | 'ubuntu'
  | 'cyberpunk'
  | 'arctique'
  | 'monokai'
  | 'dracula'
  | 'one-dark'
  | 'solarized'
  | 'matrix';

export interface ThemeConfig {
  id: ThemeId;
  name: string;
  category: 'Foncé' | 'Clair' | 'Rétro' | 'Néon';
  isDark: boolean;
  isWin98?: boolean;
  bgHex: string;
  panelBg: string;
  badgeBg: string;
  borderHex: string;
  accentHex: string;
  headerBg: string;
  textColor: string;
  description?: string;
}

export const AVAILABLE_THEMES: ThemeConfig[] = [
  // --- THÈMES CLAIRS ---
  {
    id: 'creme-vanille',
    name: 'Crème & Vanille',
    category: 'Clair',
    isDark: false,
    bgHex: '#FAF7F0',
    panelBg: '#FFFFFF',
    badgeBg: '#D97706',
    borderHex: '#D97706',
    accentHex: '#D97706',
    headerBg: '#F3ECE2',
    textColor: '#2D2823',
    description: 'Chaleureux & doux : crème soyeuse, noisette et ambre doré',
  },
  {
    id: 'cafe-latte',
    name: 'Café au Lait & Moka',
    category: 'Clair',
    isDark: false,
    bgHex: '#F5EBE1',
    panelBg: '#FAF5EE',
    badgeBg: '#7F4F24',
    borderHex: '#7F4F24',
    accentHex: '#7F4F24',
    headerBg: '#E8D9CB',
    textColor: '#2B1E16',
    description: 'Palette gourmande café torréfié, caramel, cannelle et mousse de lait',
  },
  {
    id: 'ambre-dore',
    name: 'Ambre & Miel Doré',
    category: 'Clair',
    isDark: false,
    bgHex: '#FFFDF5',
    panelBg: '#FFFFFF',
    badgeBg: '#D97706',
    borderHex: '#F59E0B',
    accentHex: '#D97706',
    headerBg: '#FEF3C7',
    textColor: '#312108',
    description: 'Lumière chaleureuse dorée, ambre vif et miel d’acacia',
  },
  {
    id: 'matcha-clair',
    name: 'Matcha & Cèdre',
    category: 'Clair',
    isDark: false,
    bgHex: '#F4F8F3',
    panelBg: '#FFFFFF',
    badgeBg: '#15803D',
    borderHex: '#166534',
    accentHex: '#15803D',
    headerBg: '#E4EFE2',
    textColor: '#1A2E1F',
    description: 'Thé vert matcha apaisant, sauge et touches végétales douces',
  },
  {
    id: 'peche-pastel',
    name: 'Pêche & Quartz Rose',
    category: 'Clair',
    isDark: false,
    bgHex: '#FFF7F5',
    panelBg: '#FFFFFF',
    badgeBg: '#E11D48',
    borderHex: '#FB7185',
    accentHex: '#E11D48',
    headerBg: '#FDECE7',
    textColor: '#362121',
    description: 'Douceur printanière : pêche veloutée, corail et rose poudré',
  },
  {
    id: 'papier-journal',
    name: 'Papier & Encre Gazette',
    category: 'Clair',
    isDark: false,
    bgHex: '#FAF7F2',
    panelBg: '#FFFFFF',
    badgeBg: '#0F172A',
    borderHex: '#64748B',
    accentHex: '#0F172A',
    headerBg: '#EDE6DA',
    textColor: '#1C1917',
    description: 'Esthétique livre & typographie, encre noble sur parchemin chaud',
  },
  {
    id: 'gopher-light',
    name: 'Gopher Soleil Clair',
    category: 'Clair',
    isDark: false,
    bgHex: '#F8FAFC',
    panelBg: '#FFFFFF',
    badgeBg: '#0284C7',
    borderHex: '#0284C7',
    accentHex: '#0284C7',
    headerBg: '#F1F5F9',
    textColor: '#0F172A',
    description: 'Clair officiel Go, bleu ciel vif et contraste maximal',
  },

  // --- THÈMES RÉTRO ---
  {
    id: 'win98-retro',
    name: 'Windows 95 / 98 Rétro',
    category: 'Rétro',
    isDark: false,
    isWin98: true,
    bgHex: '#C0C0C0',
    panelBg: '#FFFFFF',
    badgeBg: '#000080',
    borderHex: '#808080',
    accentHex: '#000080',
    headerBg: '#000080',
    textColor: '#000000',
    description: 'Boutons biseautés 3D gris clair, barre de titre dégradée bleue & Notepad vintage',
  },
  {
    id: 'ubuntu',
    name: 'Ubuntu Classique (2014)',
    category: 'Rétro',
    isDark: true,
    bgHex: '#2C001E',
    panelBg: '#3A0827',
    badgeBg: '#77216F',
    borderHex: '#E95420',
    accentHex: '#E95420',
    headerBg: '#1F0015',
    textColor: '#FFFFFF',
    description: 'Aubergine iconique d’Ubuntu avec son orange chaleureux',
  },
  {
    id: 'monokai',
    name: 'Monokai Rétro',
    category: 'Rétro',
    isDark: true,
    bgHex: '#272822',
    panelBg: '#1E1F1C',
    badgeBg: '#3E3D32',
    borderHex: '#A6E22E',
    accentHex: '#A6E22E',
    headerBg: '#191A17',
    textColor: '#F8F8F2',
    description: 'Le classique intemporel de Sublime Text aux couleurs pop',
  },

  // --- THÈMES FONCÉS ---
  {
    id: 'gopher-dark',
    name: 'Gopher Sombre (Officiel)',
    category: 'Foncé',
    isDark: true,
    bgHex: '#080D1A',
    panelBg: '#0F172A',
    badgeBg: '#0369A1',
    borderHex: '#00ADD8',
    accentHex: '#00ADD8',
    headerBg: '#0B1329',
    textColor: '#F1F5F9',
    description: 'Bleu cyan emblématique de Go sur fond nuit profond',
  },
  {
    id: 'arctique',
    name: 'Arctique (Nord Frost)',
    category: 'Foncé',
    isDark: true,
    bgHex: '#242933',
    panelBg: '#2E3440',
    badgeBg: '#3B4252',
    borderHex: '#88C0D0',
    accentHex: '#81A1C1',
    headerBg: '#1E222A',
    textColor: '#ECEFF4',
    description: 'Palette scandinave givrée aux bleus polaires apaisants',
  },
  {
    id: 'dracula',
    name: 'Dracula OLED',
    category: 'Foncé',
    isDark: true,
    bgHex: '#14141E',
    panelBg: '#1E1F29',
    badgeBg: '#44475A',
    borderHex: '#BD93F9',
    accentHex: '#FF79C6',
    headerBg: '#0E0E17',
    textColor: '#F8F8F2',
    description: 'Palette culte violette et rose néon sur noir d’encre',
  },
  {
    id: 'one-dark',
    name: 'One Dark Pro',
    category: 'Foncé',
    isDark: true,
    bgHex: '#1E1E2E',
    panelBg: '#181825',
    badgeBg: '#313244',
    borderHex: '#61AFEF',
    accentHex: '#61AFEF',
    headerBg: '#11111B',
    textColor: '#CDD6F4',
    description: 'Le thème moderne phare d’Atom et VS Code',
  },
  {
    id: 'solarized',
    name: 'Solarized Sombre',
    category: 'Foncé',
    isDark: true,
    bgHex: '#002B36',
    panelBg: '#073642',
    badgeBg: '#094757',
    borderHex: '#2AA198',
    accentHex: '#268BD2',
    headerBg: '#00212B',
    textColor: '#839496',
    description: 'Harmonie optique scientifiquement calibrée contre la fatigue',
  },

  // --- THÈMES NÉON ---
  {
    id: 'cyberpunk',
    name: 'Cyberpunk Néon',
    category: 'Néon',
    isDark: true,
    bgHex: '#080811',
    panelBg: '#120D24',
    badgeBg: '#FF0055',
    borderHex: '#00F0FF',
    accentHex: '#FCEE0A',
    headerBg: '#05050D',
    textColor: '#F8FAFC',
    description: 'Night City : jaune électrique, rose laser et cyan intense',
  },
  {
    id: 'matrix',
    name: 'Matrix Hacker',
    category: 'Néon',
    isDark: true,
    bgHex: '#030804',
    panelBg: '#071409',
    badgeBg: '#0D2812',
    borderHex: '#00FF41',
    accentHex: '#00FF41',
    headerBg: '#020503',
    textColor: '#BBF7D0',
    description: 'Terminal CRT vert phosphorescent pour hacker pur',
  },
];

/* -------------------------------------------------------------
 * 1. GOPHER DARK (Official Cyan & Deep Slate)
 * -----------------------------------------------------------*/
const gopherDarkHighlight = HighlightStyle.define([
  { tag: [t.keyword, t.controlKeyword, t.operatorKeyword, t.modifier], color: '#c084fc', fontWeight: 'bold' },
  { tag: [t.typeName, t.standard(t.typeName), t.className], color: '#fbbf24', fontWeight: '600' },
  { tag: [t.function(t.variableName), t.definition(t.function(t.variableName))], color: '#38bdf8', fontWeight: '600' },
  { tag: [t.string, t.special(t.string), t.character], color: '#4ade80' },
  { tag: [t.number, t.integer, t.float], color: '#fb923c', fontWeight: '500' },
  { tag: [t.bool, t.null, t.atom], color: '#f43f5e', fontWeight: '600' },
  { tag: [t.operator, t.compareOperator, t.arithmeticOperator, t.logicOperator], color: '#22d3ee', fontWeight: 'bold' },
  { tag: [t.comment, t.lineComment, t.blockComment, t.docComment], color: '#64748b', fontStyle: 'italic' },
  { tag: [t.namespace, t.macroName], color: '#f472b6', fontWeight: '600' },
  { tag: t.propertyName, color: '#fde047' },
  { tag: [t.paren, t.brace, t.bracket], color: '#94a3b8' },
  { tag: [t.punctuation, t.separator], color: '#cbd5e1' },
]);

const gopherDarkTheme = EditorView.theme({
  '&': { backgroundColor: '#080d1a !important', color: '#e2e8f0' },
  '.cm-content': { caretColor: '#00ADD8' },
  '.cm-cursor': { borderLeftColor: '#00ADD8 !important', borderLeftWidth: '2px !important' },
  '.cm-gutters': { backgroundColor: '#050811', color: '#475569', borderRight: '1px solid #1e293b' },
  '.cm-activeLine': { backgroundColor: 'rgba(0, 173, 216, 0.08) !important' },
  '.cm-activeLineGutter': { backgroundColor: 'rgba(0, 173, 216, 0.15)', color: '#38bdf8', fontWeight: 'bold' },
  '.cm-selectionBackground, ::selection': { backgroundColor: 'rgba(0, 173, 216, 0.3) !important' },
});

/* -------------------------------------------------------------
 * 2. CRÈME & VANILLE (Warm Artisanal Cream & Amber)
 * -----------------------------------------------------------*/
const cremeVanilleHighlight = HighlightStyle.define([
  { tag: [t.keyword, t.controlKeyword, t.operatorKeyword, t.modifier], color: '#9a3412', fontWeight: 'bold' }, // Terracotta
  { tag: [t.typeName, t.standard(t.typeName), t.className], color: '#b45309', fontWeight: '700' }, // Warm Amber Brown
  { tag: [t.function(t.variableName), t.definition(t.function(t.variableName))], color: '#1d4ed8', fontWeight: '600' }, // Royal French Navy
  { tag: [t.string, t.special(t.string), t.character], color: '#15803d' }, // Herbal green
  { tag: [t.number, t.integer, t.float], color: '#c2410c', fontWeight: '600' }, // Burnt orange
  { tag: [t.bool, t.null, t.atom], color: '#be123c', fontWeight: 'bold' }, // Rich ruby
  { tag: [t.operator, t.compareOperator, t.arithmeticOperator, t.logicOperator], color: '#78350f', fontWeight: 'bold' },
  { tag: [t.comment, t.lineComment, t.blockComment, t.docComment], color: '#78716c', fontStyle: 'italic' },
  { tag: [t.namespace, t.macroName], color: '#7c3aed', fontWeight: '600' },
  { tag: t.propertyName, color: '#b45309' },
  { tag: [t.paren, t.brace, t.bracket], color: '#44403c' },
  { tag: [t.punctuation, t.separator], color: '#44403c' },
]);

const cremeVanilleTheme = EditorView.theme({
  '&': { backgroundColor: '#FAF7F0 !important', color: '#2D2823' },
  '.cm-content': { caretColor: '#b45309' },
  '.cm-cursor': { borderLeftColor: '#b45309 !important', borderLeftWidth: '2px !important' },
  '.cm-gutters': { backgroundColor: '#F3ECE2', color: '#78716c', borderRight: '1px solid #E5DCCF' },
  '.cm-activeLine': { backgroundColor: 'rgba(217, 119, 6, 0.08) !important' },
  '.cm-activeLineGutter': { backgroundColor: 'rgba(217, 119, 6, 0.16)', color: '#b45309', fontWeight: 'bold' },
  '.cm-selectionBackground, ::selection': { backgroundColor: 'rgba(217, 119, 6, 0.22) !important' },
});

/* -------------------------------------------------------------
 * 3. CAFÉ AU LAIT & MOKA (Roasted Espresso & Froth)
 * -----------------------------------------------------------*/
const cafeLatteHighlight = HighlightStyle.define([
  { tag: [t.keyword, t.controlKeyword, t.operatorKeyword, t.modifier], color: '#7f1d1d', fontWeight: 'bold' }, // Roast burgundy
  { tag: [t.typeName, t.standard(t.typeName), t.className], color: '#934b00', fontWeight: '700' }, // Caramel gold
  { tag: [t.function(t.variableName), t.definition(t.function(t.variableName))], color: '#1e40af', fontWeight: '600' }, // Sapphire contrast
  { tag: [t.string, t.special(t.string), t.character], color: '#166534' }, // Forest bean green
  { tag: [t.number, t.integer, t.float], color: '#c2410c', fontWeight: '600' }, // Cinnamon
  { tag: [t.bool, t.null, t.atom], color: '#991b1b', fontWeight: 'bold' },
  { tag: [t.operator, t.compareOperator, t.arithmeticOperator, t.logicOperator], color: '#7f4f24', fontWeight: 'bold' },
  { tag: [t.comment, t.lineComment, t.blockComment, t.docComment], color: '#786c60', fontStyle: 'italic' },
  { tag: [t.namespace, t.macroName], color: '#581c87', fontWeight: '600' },
  { tag: t.propertyName, color: '#934b00' },
  { tag: [t.paren, t.brace, t.bracket], color: '#422006' },
  { tag: [t.punctuation, t.separator], color: '#422006' },
]);

const cafeLatteTheme = EditorView.theme({
  '&': { backgroundColor: '#F5EBE1 !important', color: '#2B1E16' },
  '.cm-content': { caretColor: '#7f4f24' },
  '.cm-cursor': { borderLeftColor: '#7f4f24 !important', borderLeftWidth: '2px !important' },
  '.cm-gutters': { backgroundColor: '#EDE0D4', color: '#786c60', borderRight: '1px solid #D4C3B3' },
  '.cm-activeLine': { backgroundColor: 'rgba(127, 79, 36, 0.09) !important' },
  '.cm-activeLineGutter': { backgroundColor: 'rgba(127, 79, 36, 0.18)', color: '#7f4f24', fontWeight: 'bold' },
  '.cm-selectionBackground, ::selection': { backgroundColor: 'rgba(127, 79, 36, 0.22) !important' },
});

/* -------------------------------------------------------------
 * 4. AMBRE & MIEL DORÉ (Honey Glow)
 * -----------------------------------------------------------*/
const ambreDoreHighlight = HighlightStyle.define([
  { tag: [t.keyword, t.controlKeyword, t.operatorKeyword, t.modifier], color: '#9a3412', fontWeight: 'bold' }, // Amber rust
  { tag: [t.typeName, t.standard(t.typeName), t.className], color: '#b45309', fontWeight: '700' }, // Honey amber
  { tag: [t.function(t.variableName), t.definition(t.function(t.variableName))], color: '#0369a1', fontWeight: '600' }, // Azure sky
  { tag: [t.string, t.special(t.string), t.character], color: '#15803d' }, // Clover green
  { tag: [t.number, t.integer, t.float], color: '#ea580c', fontWeight: '600' }, // Golden ginger
  { tag: [t.bool, t.null, t.atom], color: '#c026d3', fontWeight: 'bold' },
  { tag: [t.operator, t.compareOperator, t.arithmeticOperator, t.logicOperator], color: '#b45309', fontWeight: 'bold' },
  { tag: [t.comment, t.lineComment, t.blockComment, t.docComment], color: '#78716c', fontStyle: 'italic' },
  { tag: [t.namespace, t.macroName], color: '#7c3aed', fontWeight: '600' },
  { tag: t.propertyName, color: '#b45309' },
  { tag: [t.paren, t.brace, t.bracket], color: '#451a03' },
  { tag: [t.punctuation, t.separator], color: '#451a03' },
]);

const ambreDoreTheme = EditorView.theme({
  '&': { backgroundColor: '#FFFDF5 !important', color: '#312108' },
  '.cm-content': { caretColor: '#d97706' },
  '.cm-cursor': { borderLeftColor: '#d97706 !important', borderLeftWidth: '2px !important' },
  '.cm-gutters': { backgroundColor: '#FEF3C7', color: '#92400e', borderRight: '1px solid #FDE68A' },
  '.cm-activeLine': { backgroundColor: 'rgba(217, 119, 6, 0.1) !important' },
  '.cm-activeLineGutter': { backgroundColor: 'rgba(217, 119, 6, 0.22)', color: '#b45309', fontWeight: 'bold' },
  '.cm-selectionBackground, ::selection': { backgroundColor: 'rgba(245, 158, 11, 0.25) !important' },
});

/* -------------------------------------------------------------
 * 5. MATCHA & CÈDRE (Gentle Green Tea Cream)
 * -----------------------------------------------------------*/
const matchaClairHighlight = HighlightStyle.define([
  { tag: [t.keyword, t.controlKeyword, t.operatorKeyword, t.modifier], color: '#15803d', fontWeight: 'bold' }, // Pure matcha
  { tag: [t.typeName, t.standard(t.typeName), t.className], color: '#0e7490', fontWeight: '700' }, // Sage teal
  { tag: [t.function(t.variableName), t.definition(t.function(t.variableName))], color: '#1d4ed8', fontWeight: '600' }, // River blue
  { tag: [t.string, t.special(t.string), t.character], color: '#854d0e' }, // Bamboo brown
  { tag: [t.number, t.integer, t.float], color: '#b91c1c', fontWeight: '600' }, // Berry red
  { tag: [t.bool, t.null, t.atom], color: '#be123c', fontWeight: 'bold' },
  { tag: [t.operator, t.compareOperator, t.arithmeticOperator, t.logicOperator], color: '#166534', fontWeight: 'bold' },
  { tag: [t.comment, t.lineComment, t.blockComment, t.docComment], color: '#64748b', fontStyle: 'italic' },
  { tag: [t.namespace, t.macroName], color: '#7e22ce', fontWeight: '600' },
  { tag: t.propertyName, color: '#0e7490' },
  { tag: [t.paren, t.brace, t.bracket], color: '#14532d' },
  { tag: [t.punctuation, t.separator], color: '#14532d' },
]);

const matchaClairTheme = EditorView.theme({
  '&': { backgroundColor: '#F4F8F3 !important', color: '#1A2E1F' },
  '.cm-content': { caretColor: '#166534' },
  '.cm-cursor': { borderLeftColor: '#166534 !important', borderLeftWidth: '2px !important' },
  '.cm-gutters': { backgroundColor: '#E8F0E6', color: '#4d7c0f', borderRight: '1px solid #CFDFCC' },
  '.cm-activeLine': { backgroundColor: 'rgba(22, 101, 52, 0.08) !important' },
  '.cm-activeLineGutter': { backgroundColor: 'rgba(22, 101, 52, 0.16)', color: '#15803d', fontWeight: 'bold' },
  '.cm-selectionBackground, ::selection': { backgroundColor: 'rgba(22, 101, 52, 0.18) !important' },
});

/* -------------------------------------------------------------
 * 6. PÊCHE & QUARTZ ROSE (Soft Pastel Peach)
 * -----------------------------------------------------------*/
const pechePastelHighlight = HighlightStyle.define([
  { tag: [t.keyword, t.controlKeyword, t.operatorKeyword, t.modifier], color: '#be123c', fontWeight: 'bold' }, // Raspberry coral
  { tag: [t.typeName, t.standard(t.typeName), t.className], color: '#9333ea', fontWeight: '700' }, // Quartz orchid
  { tag: [t.function(t.variableName), t.definition(t.function(t.variableName))], color: '#0284c7', fontWeight: '600' }, // Lagoon blue
  { tag: [t.string, t.special(t.string), t.character], color: '#059669' }, // Mint leaf
  { tag: [t.number, t.integer, t.float], color: '#ea580c', fontWeight: '600' }, // Peach citrus
  { tag: [t.bool, t.null, t.atom], color: '#e11d48', fontWeight: 'bold' },
  { tag: [t.operator, t.compareOperator, t.arithmeticOperator, t.logicOperator], color: '#be123c', fontWeight: 'bold' },
  { tag: [t.comment, t.lineComment, t.blockComment, t.docComment], color: '#857a78', fontStyle: 'italic' },
  { tag: [t.namespace, t.macroName], color: '#c026d3', fontWeight: '600' },
  { tag: t.propertyName, color: '#9333ea' },
  { tag: [t.paren, t.brace, t.bracket], color: '#4c1d24' },
  { tag: [t.punctuation, t.separator], color: '#4c1d24' },
]);

const pechePastelTheme = EditorView.theme({
  '&': { backgroundColor: '#FFF7F5 !important', color: '#362121' },
  '.cm-content': { caretColor: '#e11d48' },
  '.cm-cursor': { borderLeftColor: '#e11d48 !important', borderLeftWidth: '2px !important' },
  '.cm-gutters': { backgroundColor: '#FFEAE4', color: '#be123c', borderRight: '1px solid #FED7CD' },
  '.cm-activeLine': { backgroundColor: 'rgba(225, 29, 72, 0.07) !important' },
  '.cm-activeLineGutter': { backgroundColor: 'rgba(225, 29, 72, 0.15)', color: '#e11d48', fontWeight: 'bold' },
  '.cm-selectionBackground, ::selection': { backgroundColor: 'rgba(225, 29, 72, 0.18) !important' },
});

/* -------------------------------------------------------------
 * 7. PAPIER & ENCRE GAZETTE (Classic Editorial Parchment)
 * -----------------------------------------------------------*/
const papierJournalHighlight = HighlightStyle.define([
  { tag: [t.keyword, t.controlKeyword, t.operatorKeyword, t.modifier], color: '#0f172a', fontWeight: 'bold' }, // Deep black ink
  { tag: [t.typeName, t.standard(t.typeName), t.className], color: '#4338ca', fontWeight: '700' }, // Royal bookbinder indigo
  { tag: [t.function(t.variableName), t.definition(t.function(t.variableName))], color: '#0369a1', fontWeight: '600' }, // Editorial press cyan
  { tag: [t.string, t.special(t.string), t.character], color: '#15803d' }, // Vintage stamp green
  { tag: [t.number, t.integer, t.float], color: '#9a3412', fontWeight: '600' }, // Terracotta
  { tag: [t.bool, t.null, t.atom], color: '#991b1b', fontWeight: 'bold' },
  { tag: [t.operator, t.compareOperator, t.arithmeticOperator, t.logicOperator], color: '#0f172a', fontWeight: 'bold' },
  { tag: [t.comment, t.lineComment, t.blockComment, t.docComment], color: '#78716c', fontStyle: 'italic' },
  { tag: [t.namespace, t.macroName], color: '#6b21a8', fontWeight: '600' },
  { tag: t.propertyName, color: '#4338ca' },
  { tag: [t.paren, t.brace, t.bracket], color: '#1c1917' },
  { tag: [t.punctuation, t.separator], color: '#1c1917' },
]);

const papierJournalTheme = EditorView.theme({
  '&': { backgroundColor: '#FAF7F2 !important', color: '#1C1917' },
  '.cm-content': { caretColor: '#0f172a' },
  '.cm-cursor': { borderLeftColor: '#0f172a !important', borderLeftWidth: '2px !important' },
  '.cm-gutters': { backgroundColor: '#EDE6DA', color: '#57534e', borderRight: '1px solid #DDD4C4' },
  '.cm-activeLine': { backgroundColor: 'rgba(15, 23, 42, 0.06) !important' },
  '.cm-activeLineGutter': { backgroundColor: 'rgba(15, 23, 42, 0.12)', color: '#0f172a', fontWeight: 'bold' },
  '.cm-selectionBackground, ::selection': { backgroundColor: 'rgba(15, 23, 42, 0.18) !important' },
});

/* -------------------------------------------------------------
 * 8. WINDOWS 95 / 98 RÉTRO (Visual Studio 97 & Notepad)
 * -----------------------------------------------------------*/
const win98Highlight = HighlightStyle.define([
  { tag: [t.keyword, t.controlKeyword, t.operatorKeyword, t.modifier], color: '#0000FF', fontWeight: 'bold' }, // Classic Win95 Blue
  { tag: [t.typeName, t.standard(t.typeName), t.className], color: '#2B91AF', fontWeight: 'bold' }, // MSVC Teal
  { tag: [t.function(t.variableName), t.definition(t.function(t.variableName))], color: '#7A0099', fontWeight: 'bold' }, // Maroon/Purple
  { tag: [t.string, t.special(t.string), t.character], color: '#A31515' }, // Crimson red
  { tag: [t.number, t.integer, t.float], color: '#000080', fontWeight: '600' }, // Navy blue
  { tag: [t.bool, t.null, t.atom], color: '#0000FF', fontWeight: 'bold' },
  { tag: [t.operator, t.compareOperator, t.arithmeticOperator, t.logicOperator], color: '#000000', fontWeight: 'bold' },
  { tag: [t.comment, t.lineComment, t.blockComment, t.docComment], color: '#008000', fontStyle: 'italic' }, // Classic MSVC green
  { tag: [t.namespace, t.macroName], color: '#800000', fontWeight: 'bold' },
  { tag: t.propertyName, color: '#2B91AF' },
  { tag: [t.paren, t.brace, t.bracket], color: '#000000' },
  { tag: [t.punctuation, t.separator], color: '#000000' },
]);

const win98Theme = EditorView.theme({
  '&': { backgroundColor: '#FFFFFF !important', color: '#000000' },
  '.cm-content': { caretColor: '#000000' },
  '.cm-cursor': { borderLeftColor: '#000000 !important', borderLeftWidth: '2px !important' },
  '.cm-gutters': { backgroundColor: '#C0C0C0', color: '#404040', borderRight: '2px solid #808080' },
  '.cm-activeLine': { backgroundColor: 'rgba(0, 0, 128, 0.05) !important' },
  '.cm-activeLineGutter': { backgroundColor: '#B0B0B0', color: '#000080', fontWeight: 'bold' },
  '.cm-selectionBackground, ::selection': { backgroundColor: '#000080 !important', color: '#ffffff !important' },
});

/* -------------------------------------------------------------
 * 9. UBUNTU CLASSIQUE (Aubergine 2014 & Orange Ubuntu)
 * -----------------------------------------------------------*/
const ubuntuHighlight = HighlightStyle.define([
  { tag: [t.keyword, t.controlKeyword, t.operatorKeyword, t.modifier], color: '#e95420', fontWeight: 'bold' },
  { tag: [t.typeName, t.standard(t.typeName), t.className], color: '#f0b429', fontWeight: '600' },
  { tag: [t.function(t.variableName), t.definition(t.function(t.variableName))], color: '#38bdf8', fontWeight: '600' },
  { tag: [t.string, t.special(t.string), t.character], color: '#87e076' },
  { tag: [t.number, t.integer, t.float], color: '#ffb380', fontWeight: '500' },
  { tag: [t.bool, t.null, t.atom], color: '#f43f5e', fontWeight: '600' },
  { tag: [t.operator, t.compareOperator, t.arithmeticOperator, t.logicOperator], color: '#f0b429', fontWeight: 'bold' },
  { tag: [t.comment, t.lineComment, t.blockComment, t.docComment], color: '#a78bfa', fontStyle: 'italic' },
  { tag: [t.namespace, t.macroName], color: '#fb923c', fontWeight: '600' },
  { tag: t.propertyName, color: '#fde047' },
  { tag: [t.paren, t.brace, t.bracket], color: '#e5e7eb' },
  { tag: [t.punctuation, t.separator], color: '#e5e7eb' },
]);

const ubuntuTheme = EditorView.theme({
  '&': { backgroundColor: '#2c001e !important', color: '#ffffff' },
  '.cm-content': { caretColor: '#e95420' },
  '.cm-cursor': { borderLeftColor: '#e95420 !important', borderLeftWidth: '2px !important' },
  '.cm-gutters': { backgroundColor: '#1f0015', color: '#93537b', borderRight: '1px solid #4a0033' },
  '.cm-activeLine': { backgroundColor: 'rgba(233, 84, 32, 0.12) !important' },
  '.cm-activeLineGutter': { backgroundColor: 'rgba(233, 84, 32, 0.25)', color: '#e95420', fontWeight: 'bold' },
  '.cm-selectionBackground, ::selection': { backgroundColor: 'rgba(233, 84, 32, 0.35) !important' },
});

/* -------------------------------------------------------------
 * 10. CYBERPUNK NÉON (Night City Ultra-High Contrast)
 * -----------------------------------------------------------*/
const cyberpunkHighlight = HighlightStyle.define([
  { tag: [t.keyword, t.controlKeyword, t.operatorKeyword, t.modifier], color: '#ff0055', fontWeight: 'bold' },
  { tag: [t.typeName, t.standard(t.typeName), t.className], color: '#fcee0a', fontWeight: 'bold' },
  { tag: [t.function(t.variableName), t.definition(t.function(t.variableName))], color: '#00f0ff', fontWeight: 'bold' },
  { tag: [t.string, t.special(t.string), t.character], color: '#05ffa1' },
  { tag: [t.number, t.integer, t.float], color: '#ff9900', fontWeight: '600' },
  { tag: [t.bool, t.null, t.atom], color: '#ff0055', fontWeight: 'bold' },
  { tag: [t.operator, t.compareOperator, t.arithmeticOperator, t.logicOperator], color: '#00f0ff', fontWeight: 'bold' },
  { tag: [t.comment, t.lineComment, t.blockComment, t.docComment], color: '#71717a', fontStyle: 'italic' },
  { tag: [t.namespace, t.macroName], color: '#b967ff', fontWeight: '600' },
  { tag: t.propertyName, color: '#fcee0a' },
  { tag: [t.paren, t.brace, t.bracket], color: '#ffffff' },
  { tag: [t.punctuation, t.separator], color: '#e4e4e7' },
]);

const cyberpunkTheme = EditorView.theme({
  '&': { backgroundColor: '#080811 !important', color: '#f8fafc' },
  '.cm-content': { caretColor: '#fcee0a' },
  '.cm-cursor': { borderLeftColor: '#fcee0a !important', borderLeftWidth: '2px !important' },
  '.cm-gutters': { backgroundColor: '#04040a', color: '#52525b', borderRight: '1px solid #181829' },
  '.cm-activeLine': { backgroundColor: 'rgba(0, 240, 255, 0.08) !important' },
  '.cm-activeLineGutter': { backgroundColor: 'rgba(255, 0, 85, 0.2)', color: '#ff0055', fontWeight: 'bold' },
  '.cm-selectionBackground, ::selection': { backgroundColor: 'rgba(255, 0, 85, 0.35) !important' },
});

/* -------------------------------------------------------------
 * 11. ARCTIQUE (Nord Frost)
 * -----------------------------------------------------------*/
const arctiqueHighlight = HighlightStyle.define([
  { tag: [t.keyword, t.controlKeyword, t.operatorKeyword, t.modifier], color: '#81a1c1', fontWeight: 'bold' },
  { tag: [t.typeName, t.standard(t.typeName), t.className], color: '#ebcb8b', fontWeight: '600' },
  { tag: [t.function(t.variableName), t.definition(t.function(t.variableName))], color: '#88c0d0', fontWeight: '600' },
  { tag: [t.string, t.special(t.string), t.character], color: '#a3be8c' },
  { tag: [t.number, t.integer, t.float], color: '#b48ead', fontWeight: '500' },
  { tag: [t.bool, t.null, t.atom], color: '#bf616a', fontWeight: '600' },
  { tag: [t.operator, t.compareOperator, t.arithmeticOperator, t.logicOperator], color: '#88c0d0', fontWeight: 'bold' },
  { tag: [t.comment, t.lineComment, t.blockComment, t.docComment], color: '#616e88', fontStyle: 'italic' },
  { tag: [t.namespace, t.macroName], color: '#d08770', fontWeight: '600' },
  { tag: t.propertyName, color: '#eceff4' },
  { tag: [t.paren, t.brace, t.bracket], color: '#e5e9f0' },
  { tag: [t.punctuation, t.separator], color: '#d8dee9' },
]);

const arctiqueTheme = EditorView.theme({
  '&': { backgroundColor: '#242933 !important', color: '#eceff4' },
  '.cm-content': { caretColor: '#88c0d0' },
  '.cm-cursor': { borderLeftColor: '#88c0d0 !important', borderLeftWidth: '2px !important' },
  '.cm-gutters': { backgroundColor: '#1d212a', color: '#4c566a', borderRight: '1px solid #3b4252' },
  '.cm-activeLine': { backgroundColor: 'rgba(136, 192, 208, 0.08) !important' },
  '.cm-activeLineGutter': { backgroundColor: 'rgba(136, 192, 208, 0.15)', color: '#88c0d0', fontWeight: 'bold' },
  '.cm-selectionBackground, ::selection': { backgroundColor: 'rgba(129, 161, 193, 0.3) !important' },
});

/* -------------------------------------------------------------
 * 12. MONOKAI RÉTRO
 * -----------------------------------------------------------*/
const monokaiHighlight = HighlightStyle.define([
  { tag: [t.keyword, t.controlKeyword, t.operatorKeyword, t.modifier], color: '#f92672', fontWeight: 'bold' },
  { tag: [t.typeName, t.standard(t.typeName), t.className], color: '#66d9ef', fontWeight: '600' },
  { tag: [t.function(t.variableName), t.definition(t.function(t.variableName))], color: '#a6e22e', fontWeight: '600' },
  { tag: [t.string, t.special(t.string), t.character], color: '#e6db74' },
  { tag: [t.number, t.integer, t.float], color: '#ae81ff', fontWeight: '500' },
  { tag: [t.bool, t.null, t.atom], color: '#fd971f', fontWeight: '600' },
  { tag: [t.operator, t.compareOperator, t.arithmeticOperator, t.logicOperator], color: '#f92672', fontWeight: 'bold' },
  { tag: [t.comment, t.lineComment, t.blockComment, t.docComment], color: '#75715e', fontStyle: 'italic' },
  { tag: [t.namespace, t.macroName], color: '#fd971f', fontWeight: '600' },
  { tag: t.propertyName, color: '#a6e22e' },
  { tag: [t.paren, t.brace, t.bracket], color: '#f8f8f2' },
  { tag: [t.punctuation, t.separator], color: '#f8f8f2' },
]);

const monokaiTheme = EditorView.theme({
  '&': { backgroundColor: '#272822 !important', color: '#f8f8f2' },
  '.cm-content': { caretColor: '#f8f8f0' },
  '.cm-cursor': { borderLeftColor: '#f8f8f0 !important', borderLeftWidth: '2px !important' },
  '.cm-gutters': { backgroundColor: '#1e1f1c', color: '#90908a', borderRight: '1px solid #3e3d32' },
  '.cm-activeLine': { backgroundColor: 'rgba(255, 255, 255, 0.05) !important' },
  '.cm-activeLineGutter': { backgroundColor: 'rgba(249, 38, 114, 0.2)', color: '#f92672', fontWeight: 'bold' },
  '.cm-selectionBackground, ::selection': { backgroundColor: 'rgba(73, 72, 62, 0.8) !important' },
});

/* -------------------------------------------------------------
 * 13. CLAIR (Gopher Soleil)
 * -----------------------------------------------------------*/
const gopherLightHighlight = HighlightStyle.define([
  { tag: [t.keyword, t.controlKeyword, t.operatorKeyword, t.modifier], color: '#7c3aed', fontWeight: 'bold' },
  { tag: [t.typeName, t.standard(t.typeName), t.className], color: '#b45309', fontWeight: '600' },
  { tag: [t.function(t.variableName), t.definition(t.function(t.variableName))], color: '#0284c7', fontWeight: '600' },
  { tag: [t.string, t.special(t.string), t.character], color: '#15803d' },
  { tag: [t.number, t.integer, t.float], color: '#c2410c', fontWeight: '500' },
  { tag: [t.bool, t.null, t.atom], color: '#e11d48', fontWeight: '600' },
  { tag: [t.operator, t.compareOperator, t.arithmeticOperator, t.logicOperator], color: '#0e7490', fontWeight: 'bold' },
  { tag: [t.comment, t.lineComment, t.blockComment, t.docComment], color: '#64748b', fontStyle: 'italic' },
  { tag: [t.namespace, t.macroName], color: '#be185d', fontWeight: '600' },
  { tag: t.propertyName, color: '#b45309' },
  { tag: [t.paren, t.brace, t.bracket], color: '#334155' },
  { tag: [t.punctuation, t.separator], color: '#334155' },
]);

const gopherLightTheme = EditorView.theme({
  '&': { backgroundColor: '#f8fafc !important', color: '#0f172a' },
  '.cm-content': { caretColor: '#0284c7' },
  '.cm-cursor': { borderLeftColor: '#0284c7 !important', borderLeftWidth: '2px !important' },
  '.cm-gutters': { backgroundColor: '#f1f5f9', color: '#64748b', borderRight: '1px solid #e2e8f0' },
  '.cm-activeLine': { backgroundColor: 'rgba(2, 132, 199, 0.08) !important' },
  '.cm-activeLineGutter': { backgroundColor: 'rgba(2, 132, 199, 0.15)', color: '#0284c7', fontWeight: 'bold' },
  '.cm-selectionBackground, ::selection': { backgroundColor: 'rgba(2, 132, 199, 0.2) !important' },
});

/* -------------------------------------------------------------
 * 14. DRACULA OLED
 * -----------------------------------------------------------*/
const draculaHighlight = HighlightStyle.define([
  { tag: [t.keyword, t.controlKeyword, t.operatorKeyword, t.modifier], color: '#ff79c6', fontWeight: 'bold' },
  { tag: [t.typeName, t.standard(t.typeName), t.className], color: '#8be9fd', fontWeight: '600' },
  { tag: [t.function(t.variableName), t.definition(t.function(t.variableName))], color: '#50fa7b', fontWeight: '600' },
  { tag: [t.string, t.special(t.string), t.character], color: '#f1fa8c' },
  { tag: [t.number, t.integer, t.float], color: '#bd93f9', fontWeight: '500' },
  { tag: [t.bool, t.null, t.atom], color: '#ffb86c', fontWeight: '600' },
  { tag: [t.operator, t.compareOperator, t.arithmeticOperator, t.logicOperator], color: '#ff79c6', fontWeight: 'bold' },
  { tag: [t.comment, t.lineComment, t.blockComment, t.docComment], color: '#6272a4', fontStyle: 'italic' },
  { tag: [t.namespace, t.macroName], color: '#ffb86c', fontWeight: '600' },
  { tag: t.propertyName, color: '#8be9fd' },
  { tag: [t.paren, t.brace, t.bracket], color: '#f8f8f2' },
  { tag: [t.punctuation, t.separator], color: '#f8f8f2' },
]);

const draculaTheme = EditorView.theme({
  '&': { backgroundColor: '#14141e !important', color: '#f8f8f2' },
  '.cm-content': { caretColor: '#ff79c6' },
  '.cm-cursor': { borderLeftColor: '#ff79c6 !important', borderLeftWidth: '2px !important' },
  '.cm-gutters': { backgroundColor: '#0e0e17', color: '#6272a4', borderRight: '1px solid #282a36' },
  '.cm-activeLine': { backgroundColor: 'rgba(255, 121, 198, 0.08) !important' },
  '.cm-activeLineGutter': { backgroundColor: 'rgba(255, 121, 198, 0.15)', color: '#ff79c6', fontWeight: 'bold' },
  '.cm-selectionBackground, ::selection': { backgroundColor: 'rgba(255, 121, 198, 0.3) !important' },
});

/* -------------------------------------------------------------
 * 15. ONE DARK PRO
 * -----------------------------------------------------------*/
const oneDarkHighlight = HighlightStyle.define([
  { tag: [t.keyword, t.controlKeyword, t.operatorKeyword, t.modifier], color: '#c678dd', fontWeight: 'bold' },
  { tag: [t.typeName, t.standard(t.typeName), t.className], color: '#e5c07b', fontWeight: '600' },
  { tag: [t.function(t.variableName), t.definition(t.function(t.variableName))], color: '#61afef', fontWeight: '600' },
  { tag: [t.string, t.special(t.string), t.character], color: '#98c379' },
  { tag: [t.number, t.integer, t.float], color: '#d19a66', fontWeight: '500' },
  { tag: [t.bool, t.null, t.atom], color: '#e06c75', fontWeight: '600' },
  { tag: [t.operator, t.compareOperator, t.arithmeticOperator, t.logicOperator], color: '#56b6c2', fontWeight: 'bold' },
  { tag: [t.comment, t.lineComment, t.blockComment, t.docComment], color: '#7f848e', fontStyle: 'italic' },
  { tag: [t.namespace, t.macroName], color: '#e06c75', fontWeight: '600' },
  { tag: t.propertyName, color: '#e5c07b' },
  { tag: [t.paren, t.brace, t.bracket], color: '#abb2bf' },
  { tag: [t.punctuation, t.separator], color: '#abb2bf' },
]);

const oneDarkTheme = EditorView.theme({
  '&': { backgroundColor: '#1e1e2e !important', color: '#abb2bf' },
  '.cm-content': { caretColor: '#61afef' },
  '.cm-cursor': { borderLeftColor: '#61afef !important', borderLeftWidth: '2px !important' },
  '.cm-gutters': { backgroundColor: '#181825', color: '#5c6370', borderRight: '1px solid #313244' },
  '.cm-activeLine': { backgroundColor: 'rgba(97, 175, 239, 0.08) !important' },
  '.cm-activeLineGutter': { backgroundColor: 'rgba(97, 175, 239, 0.15)', color: '#61afef', fontWeight: 'bold' },
  '.cm-selectionBackground, ::selection': { backgroundColor: 'rgba(97, 175, 239, 0.3) !important' },
});

/* -------------------------------------------------------------
 * 16. SOLARIZED SOMBRE
 * -----------------------------------------------------------*/
const solarizedHighlight = HighlightStyle.define([
  { tag: [t.keyword, t.controlKeyword, t.operatorKeyword, t.modifier], color: '#859900', fontWeight: 'bold' },
  { tag: [t.typeName, t.standard(t.typeName), t.className], color: '#b58900', fontWeight: '600' },
  { tag: [t.function(t.variableName), t.definition(t.function(t.variableName))], color: '#268bd2', fontWeight: '600' },
  { tag: [t.string, t.special(t.string), t.character], color: '#2aa198' },
  { tag: [t.number, t.integer, t.float], color: '#d33682', fontWeight: '500' },
  { tag: [t.bool, t.null, t.atom], color: '#cb4b16', fontWeight: '600' },
  { tag: [t.operator, t.compareOperator, t.arithmeticOperator, t.logicOperator], color: '#2aa198', fontWeight: 'bold' },
  { tag: [t.comment, t.lineComment, t.blockComment, t.docComment], color: '#586e75', fontStyle: 'italic' },
  { tag: [t.namespace, t.macroName], color: '#cb4b16', fontWeight: '600' },
  { tag: t.propertyName, color: '#b58900' },
  { tag: [t.paren, t.brace, t.bracket], color: '#93a1a1' },
  { tag: [t.punctuation, t.separator], color: '#93a1a1' },
]);

const solarizedTheme = EditorView.theme({
  '&': { backgroundColor: '#002b36 !important', color: '#839496' },
  '.cm-content': { caretColor: '#2aa198' },
  '.cm-cursor': { borderLeftColor: '#2aa198 !important', borderLeftWidth: '2px !important' },
  '.cm-gutters': { backgroundColor: '#00212b', color: '#586e75', borderRight: '1px solid #073642' },
  '.cm-activeLine': { backgroundColor: 'rgba(7, 54, 66, 0.7) !important' },
  '.cm-activeLineGutter': { backgroundColor: '#073642', color: '#2aa198', fontWeight: 'bold' },
  '.cm-selectionBackground, ::selection': { backgroundColor: 'rgba(7, 54, 66, 0.9) !important' },
});

/* -------------------------------------------------------------
 * 17. MATRIX HACKER (Phosphor Green)
 * -----------------------------------------------------------*/
const matrixHighlight = HighlightStyle.define([
  { tag: [t.keyword, t.controlKeyword, t.operatorKeyword, t.modifier], color: '#00ff41', fontWeight: 'bold' },
  { tag: [t.typeName, t.standard(t.typeName), t.className], color: '#a3e635', fontWeight: 'bold' },
  { tag: [t.function(t.variableName), t.definition(t.function(t.variableName))], color: '#4ade80', fontWeight: 'bold' },
  { tag: [t.string, t.special(t.string), t.character], color: '#86efac' },
  { tag: [t.number, t.integer, t.float], color: '#bef264', fontWeight: '500' },
  { tag: [t.bool, t.null, t.atom], color: '#22c55e', fontWeight: 'bold' },
  { tag: [t.operator, t.compareOperator, t.arithmeticOperator, t.logicOperator], color: '#00ff41', fontWeight: 'bold' },
  { tag: [t.comment, t.lineComment, t.blockComment, t.docComment], color: '#166534', fontStyle: 'italic' },
  { tag: [t.namespace, t.macroName], color: '#86efac', fontWeight: '600' },
  { tag: t.propertyName, color: '#a3e635' },
  { tag: [t.paren, t.brace, t.bracket], color: '#bbf7d0' },
  { tag: [t.punctuation, t.separator], color: '#bbf7d0' },
]);

const matrixTheme = EditorView.theme({
  '&': { backgroundColor: '#030804 !important', color: '#bbf7d0' },
  '.cm-content': { caretColor: '#00ff41' },
  '.cm-cursor': { borderLeftColor: '#00ff41 !important', borderLeftWidth: '2px !important' },
  '.cm-gutters': { backgroundColor: '#020503', color: '#14532d', borderRight: '1px solid #052e16' },
  '.cm-activeLine': { backgroundColor: 'rgba(0, 255, 65, 0.08) !important' },
  '.cm-activeLineGutter': { backgroundColor: 'rgba(0, 255, 65, 0.15)', color: '#00ff41', fontWeight: 'bold' },
  '.cm-selectionBackground, ::selection': { backgroundColor: 'rgba(0, 255, 65, 0.25) !important' },
});

/**
 * Returns complete theme extension (theme CSS + highlightStyle)
 */
export function getThemeExtension(themeId: ThemeId): Extension[] {
  switch (themeId) {
    case 'creme-vanille':
      return [cremeVanilleTheme, syntaxHighlighting(cremeVanilleHighlight)];
    case 'cafe-latte':
      return [cafeLatteTheme, syntaxHighlighting(cafeLatteHighlight)];
    case 'ambre-dore':
      return [ambreDoreTheme, syntaxHighlighting(ambreDoreHighlight)];
    case 'matcha-clair':
      return [matchaClairTheme, syntaxHighlighting(matchaClairHighlight)];
    case 'peche-pastel':
      return [pechePastelTheme, syntaxHighlighting(pechePastelHighlight)];
    case 'papier-journal':
      return [papierJournalTheme, syntaxHighlighting(papierJournalHighlight)];
    case 'win98-retro':
      return [win98Theme, syntaxHighlighting(win98Highlight)];
    case 'ubuntu':
      return [ubuntuTheme, syntaxHighlighting(ubuntuHighlight)];
    case 'cyberpunk':
      return [cyberpunkTheme, syntaxHighlighting(cyberpunkHighlight)];
    case 'arctique':
      return [arctiqueTheme, syntaxHighlighting(arctiqueHighlight)];
    case 'monokai':
      return [monokaiTheme, syntaxHighlighting(monokaiHighlight)];
    case 'gopher-light':
      return [gopherLightTheme, syntaxHighlighting(gopherLightHighlight)];
    case 'dracula':
      return [draculaTheme, syntaxHighlighting(draculaHighlight)];
    case 'one-dark':
      return [oneDarkTheme, syntaxHighlighting(oneDarkHighlight)];
    case 'solarized':
      return [solarizedTheme, syntaxHighlighting(solarizedHighlight)];
    case 'matrix':
      return [matrixTheme, syntaxHighlighting(matrixHighlight)];
    case 'gopher-dark':
    default:
      return [gopherDarkTheme, syntaxHighlighting(gopherDarkHighlight)];
  }
}
