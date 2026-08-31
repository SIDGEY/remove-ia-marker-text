const input = document.querySelector('#inputText');
const output = document.querySelector('#outputText');
const cleanButton = document.querySelector('#cleanButton');
const clearButton = document.querySelector('#clearButton');
const copyButton = document.querySelector('#copyButton');
const inputCharacters = document.querySelector('#inputCharacters');
const inputWords = document.querySelector('#inputWords');
const outputCharacters = document.querySelector('#outputCharacters');
const linkedinStatus = document.querySelector('#linkedinStatus');
const toast = document.querySelector('#toast');
const readabilityScore = document.querySelector('#readabilityScore');
const analysisList = document.querySelector('#analysisList');
const linkedinPreview = document.querySelector('#linkedinPreview');

const options = {
  removeMarkdown: document.querySelector('#removeMarkdown'),
  normalizeLists: document.querySelector('#normalizeLists'),
  removeInvisible: document.querySelector('#removeInvisible'),
  normalizeSpacing: document.querySelector('#normalizeSpacing'),
  linkedinFormatting: document.querySelector('#linkedinFormatting'),
};

function countWords(value) {
  const trimmed = value.trim();
  return trimmed ? trimmed.split(/\s+/u).length : 0;
}

function removeInvisibleCharacters(text) {
  return text
    .replace(/[\u200B-\u200D\u2060\uFEFF]/gu, '')
    .replace(/[\u00A0\u202F]/gu, ' ')
    .replace(/[\u2028\u2029]/gu, '\n');
}

function removeMarkdown(text) {
  return text
    .replace(/^```[^\n]*\n?/gmu, '')
    .replace(/^```\s*$/gmu, '')
    .replace(/^\s{0,3}#{1,6}\s+/gmu, '')
    .replace(/^\s{0,3}>\s?/gmu, '')
    .replace(/!\[([^\]]*)\]\([^)]*\)/gu, '$1')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/gu, '$1')
    .replace(/(\*\*|__)(.*?)\1/gu, '$2')
    .replace(/(?<!\*)\*([^*\n]+)\*(?!\*)/gu, '$1')
    .replace(/(?<!_)_([^_\n]+)_(?!_)/gu, '$1')
    .replace(/~~(.*?)~~/gu, '$1')
    .replace(/`([^`]+)`/gu, '$1')
    .replace(/^\s*(?:[-*_]\s*){3,}$/gmu, '');
}

function normalizeLists(text) {
  return text
    .replace(/^\s*[-*+]\s+/gmu, '• ')
    .replace(/^\s*(\d+)[.)]\s+/gmu, '$1. ');
}

function normalizeSpacing(text) {
  return text
    .replace(/[ \t]+$/gmu, '')
    .replace(/^[ \t]+$/gmu, '')
    .replace(/\n{3,}/gu, '\n\n')
    .trim();
}

function splitLongParagraph(paragraph) {
  if (paragraph.length < 280 || paragraph.startsWith('• ') || /^\d+\.\s/u.test(paragraph)) {
    return paragraph;
  }

  const sentences = paragraph.match(/[^.!?…]+(?:[.!?…]+|$)/gu)?.map((part) => part.trim()).filter(Boolean) ?? [paragraph];
  const chunks = [];
  let current = '';

  for (const sentence of sentences) {
    if (!current) {
      current = sentence;
      continue;
    }

    if (`${current} ${sentence}`.length > 190) {
      chunks.push(current);
      current = sentence;
    } else {
      current += ` ${sentence}`;
    }
  }

  if (current) chunks.push(current);
  return chunks.join('\n\n');
}

function formatForLinkedIn(text) {
  return text
    .split(/\n\n+/u)
    .map((paragraph) => splitLongParagraph(paragraph.trim()))
    .filter(Boolean)
    .join('\n\n');
}

function cleanText(text) {
  let result = text.replace(/\r\n?/gu, '\n');

  if (options.removeInvisible.checked) result = removeInvisibleCharacters(result);
  if (options.removeMarkdown.checked) result = removeMarkdown(result);
  if (options.normalizeLists.checked) result = normalizeLists(result);
  if (options.normalizeSpacing.checked) result = normalizeSpacing(result);
  if (options.linkedinFormatting.checked) result = formatForLinkedIn(result);
  if (options.normalizeSpacing.checked) result = normalizeSpacing(result);

  return result;
}

function analyzeText(text) {
  if (!text.trim()) return { score: null, items: [] };

  const paragraphs = text.split(/\n\n+/u).map((p) => p.trim()).filter(Boolean);
  const longParagraphs = paragraphs.filter((p) => p.length > 320).length;
  const veryLongParagraphs = paragraphs.filter((p) => p.length > 520).length;
  const lines = text.split('\n').filter((line) => line.trim());
  const listLines = lines.filter((line) => /^(?:•|\d+\.)\s/u.test(line.trim())).length;
  const firstParagraphLength = paragraphs[0]?.length ?? 0;
  const characters = text.length;

  let score = 100;
  score -= longParagraphs * 8;
  score -= veryLongParagraphs * 10;
  if (firstParagraphLength > 240) score -= 12;
  if (characters > 3000) score -= 20;
  if (paragraphs.length === 1 && characters > 500) score -= 15;
  score = Math.max(0, Math.min(100, score));

  const items = [];

  if (characters <= 3000) {
    items.push({ type: 'ok', text: `Longueur compatible LinkedIn : ${characters.toLocaleString('fr-FR')} caractères.` });
  } else {
    items.push({ type: 'warn', text: `${(characters - 3000).toLocaleString('fr-FR')} caractères dépassent la limite de 3 000.` });
  }

  if (longParagraphs === 0) {
    items.push({ type: 'ok', text: 'Les paragraphes sont suffisamment aérés pour une lecture mobile.' });
  } else {
    items.push({ type: 'warn', text: `${longParagraphs} paragraphe${longParagraphs > 1 ? 's sont' : ' est'} encore assez dense.` });
  }

  if (firstParagraphLength > 240) {
    items.push({ type: 'warn', text: 'Le premier bloc est long : le hook risque d’être moins visible avant « voir plus ».' });
  } else if (firstParagraphLength > 0) {
    items.push({ type: 'ok', text: 'Le premier bloc reste court et lisible dans le feed.' });
  }

  if (listLines > 0) {
    items.push({ type: 'info', text: `${listLines} ligne${listLines > 1 ? 's' : ''} de liste détectée${listLines > 1 ? 's' : ''} et normalisée${listLines > 1 ? 's' : ''}.` });
  }

  return { score, items };
}

function renderAnalysis(text) {
  const analysis = analyzeText(text);

  if (analysis.score === null) {
    readabilityScore.textContent = '—';
    readabilityScore.className = 'score-badge';
    analysisList.innerHTML = '<p class="empty-state">Formatez un texte pour afficher les recommandations.</p>';
    return;
  }

  readabilityScore.textContent = `${analysis.score}/100`;
  readabilityScore.className = `score-badge ${analysis.score >= 80 ? 'is-good' : analysis.score >= 60 ? 'is-medium' : 'is-low'}`;
  analysisList.innerHTML = analysis.items
    .map((item) => `<div class="analysis-item ${item.type}"><span class="analysis-dot"></span><span>${item.text}</span></div>`)
    .join('');
}

function renderPreview(text) {
  if (!text.trim()) {
    linkedinPreview.textContent = 'Votre aperçu LinkedIn apparaîtra ici.';
    linkedinPreview.classList.add('is-empty');
    return;
  }

  linkedinPreview.textContent = text;
  linkedinPreview.classList.remove('is-empty');
}

function updateStats() {
  inputCharacters.textContent = input.value.length.toLocaleString('fr-FR');
  inputWords.textContent = countWords(input.value).toLocaleString('fr-FR');
  outputCharacters.textContent = output.value.length.toLocaleString('fr-FR');
  copyButton.disabled = output.value.length === 0;

  if (!output.value.length) {
    linkedinStatus.textContent = 'En attente';
    linkedinStatus.className = 'status';
  } else if (output.value.length <= 3000) {
    linkedinStatus.textContent = 'Prêt à publier';
    linkedinStatus.className = 'status is-ok';
  } else {
    linkedinStatus.textContent = `+${(output.value.length - 3000).toLocaleString('fr-FR')} à retirer`;
    linkedinStatus.className = 'status is-warning';
  }

  renderAnalysis(output.value);
  renderPreview(output.value);
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add('show');
  window.setTimeout(() => toast.classList.remove('show'), 1800);
}

function formatCurrentText(showFeedback = false) {
  output.value = cleanText(input.value);
  updateStats();
  if (showFeedback && input.value.trim()) showToast('Post formaté pour LinkedIn');
}

cleanButton.addEventListener('click', () => formatCurrentText(true));

clearButton.addEventListener('click', () => {
  input.value = '';
  output.value = '';
  updateStats();
  input.focus();
});

copyButton.addEventListener('click', async () => {
  if (!output.value) return;

  try {
    await navigator.clipboard.writeText(output.value);
    showToast('Copié dans le presse-papiers');
  } catch {
    output.focus();
    output.select();
    document.execCommand('copy');
    showToast('Texte copié');
  }
});

input.addEventListener('input', updateStats);
output.addEventListener('input', updateStats);
Object.values(options).forEach((option) => {
  option.addEventListener('change', () => {
    if (input.value) formatCurrentText();
  });
});

updateStats();
