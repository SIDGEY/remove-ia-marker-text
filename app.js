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

const options = {
  removeMarkdown: document.querySelector('#removeMarkdown'),
  normalizeLists: document.querySelector('#normalizeLists'),
  removeInvisible: document.querySelector('#removeInvisible'),
  normalizeSpacing: document.querySelector('#normalizeSpacing'),
};

function countWords(value) {
  const trimmed = value.trim();
  return trimmed ? trimmed.split(/\s+/u).length : 0;
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
}

function removeInvisibleCharacters(text) {
  return text
    .replace(/[\u200B-\u200D\u2060\uFEFF]/gu, '')
    .replace(/[\u00A0\u202F]/gu, ' ')
    .replace(/[\u2028\u2029]/gu, '\n');
}

function removeMarkdown(text) {
  return text
    // fenced code blocks: keep the code, remove the fences/language marker
    .replace(/^```[^\n]*\n?/gmu, '')
    .replace(/^```\s*$/gmu, '')
    // headings
    .replace(/^\s{0,3}#{1,6}\s+/gmu, '')
    // blockquotes
    .replace(/^\s{0,3}>\s?/gmu, '')
    // images -> alt text
    .replace(/!\[([^\]]*)\]\([^)]*\)/gu, '$1')
    // links -> readable label
    .replace(/\[([^\]]+)\]\(([^)]+)\)/gu, '$1')
    // bold / italic / strikethrough / inline code markers
    .replace(/(\*\*|__)(.*?)\1/gu, '$2')
    .replace(/(?<!\*)\*([^*\n]+)\*(?!\*)/gu, '$1')
    .replace(/(?<!_)_([^_\n]+)_(?!_)/gu, '$1')
    .replace(/~~(.*?)~~/gu, '$1')
    .replace(/`([^`]+)`/gu, '$1')
    // horizontal rules
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

function cleanText(text) {
  let result = text.replace(/\r\n?/gu, '\n');

  if (options.removeInvisible.checked) {
    result = removeInvisibleCharacters(result);
  }

  if (options.removeMarkdown.checked) {
    result = removeMarkdown(result);
  }

  if (options.normalizeLists.checked) {
    result = normalizeLists(result);
  }

  if (options.normalizeSpacing.checked) {
    result = normalizeSpacing(result);
  }

  return result;
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add('show');
  window.setTimeout(() => toast.classList.remove('show'), 1800);
}

cleanButton.addEventListener('click', () => {
  output.value = cleanText(input.value);
  updateStats();
  if (input.value.trim()) showToast('Texte nettoyé');
});

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
    if (input.value) {
      output.value = cleanText(input.value);
      updateStats();
    }
  });
});

updateStats();
