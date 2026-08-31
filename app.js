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
const auditCount = document.querySelector('#auditCount');
const auditSummary = document.querySelector('#auditSummary');
const auditList = document.querySelector('#auditList');
const markerPreview = document.querySelector('#markerPreview');
const markerLegend = document.querySelector('#markerLegend');
const markerCount = document.querySelector('#markerCount');

const options = {
  removeMarkdown: document.querySelector('#removeMarkdown'),
  normalizeLists: document.querySelector('#normalizeLists'),
  removeInvisible: document.querySelector('#removeInvisible'),
  normalizeSpacing: document.querySelector('#normalizeSpacing'),
  linkedinFormatting: document.querySelector('#linkedinFormatting'),
  advancedAiCleanup: document.querySelector('#advancedAiCleanup'),
};

let latestAudit = [];

const markerRules = [
  { type: 'markdown', label: 'Titre Markdown', regex: /^\s{0,3}#{1,6}\s+/gmu },
  { type: 'markdown', label: 'Citation Markdown', regex: /^\s{0,3}>\s?/gmu },
  { type: 'markdown', label: 'Bloc de code', regex: /^```[^\n]*\n?|^```\s*$/gmu },
  { type: 'markdown', label: 'Lien Markdown', regex: /\[[^\]]+\]\([^)]+\)/gu },
  { type: 'markdown', label: 'Image Markdown', regex: /!\[[^\]]*\]\([^)]+\)/gu },
  { type: 'markdown', label: 'Gras Markdown', regex: /\*\*[^*]+\*\*|__[^_]+__/gu },
  { type: 'markdown', label: 'Italique Markdown', regex: /(?<!\*)\*[^*\n]+\*(?!\*)|(?<!_)_[^_\n]+_(?!_)/gu },
  { type: 'markdown', label: 'Texte barré', regex: /~~[^~]+~~/gu },
  { type: 'markdown', label: 'Code inline', regex: /`[^`]+`/gu },
  { type: 'markdown', label: 'Séparateur Markdown', regex: /^\s*(?:[-*_]\s*){3,}$/gmu },

  { type: 'invisible', label: 'Zero-width / format invisible', regex: /[\u00AD\u034F\u061C\u180E\u200B\u200C\u200E\u200F\u2060-\u2064\u206A-\u206F\uFEFF]/gu, visibleReplacement: '⟦invisible⟧' },
  { type: 'invisible', label: 'Contrôle bidi', regex: /[\u202A-\u202E\u2066-\u2069]/gu, visibleReplacement: '⟦bidi⟧' },
  { type: 'invisible', label: 'Espace Unicode', regex: /[\u00A0\u1680\u2000-\u200A\u202F\u205F\u3000]/gu, visibleReplacement: '⟦espace Unicode⟧' },
  { type: 'invisible', label: 'Séparateur Unicode', regex: /[\u2028\u2029]/gu, visibleReplacement: '⟦retour Unicode⟧' },
  { type: 'signal', label: 'ZWJ (préservé pour les emojis)', regex: /\u200D/gu, visibleReplacement: '⟦ZWJ⟧' },
  { type: 'signal', label: 'Variation selector (préservé)', regex: /[\uFE00-\uFE0F]|[\u{E0100}-\u{E01EF}]/gu, visibleReplacement: '⟦variation⟧' },
  { type: 'signal', label: 'Tag Unicode (préservé)', regex: /[\u{E0000}-\u{E007F}]/gu, visibleReplacement: '⟦tag Unicode⟧' },

  { type: 'ai', label: 'Introduction générique', regex: /^(?:bien sûr|bien entendu|absolument|avec plaisir)[\s!,.:-]*(?:\n+|$)/gimu },
  { type: 'ai', label: 'Annonce de réponse', regex: /^(?:voici|voilà)\s+(?:(?:une|la|ma)\s+)?(?:version|proposition|réécriture|reformulation|réponse|publication|post|texte)[^\n.!?]*(?:[.!?])?\s*(?:\n+|$)/gimu },
  { type: 'ai', label: 'Annonce de proposition', regex: /^(?:je te propose|je vous propose|je te suggère|je vous suggère)\s+[^\n.!?]*(?:[.!?])?\s*(?:\n+|$)/gimu },
  { type: 'ai', label: 'Intertitre de wrapper', regex: /^(?:version|proposition|post linkedin|publication linkedin|texte final|version finale|version optimisée|version retravaillée)\s*:?[ \t]*(?:\n+|$)/gimu },
  { type: 'ai', label: 'Conclusion générique', regex: /(?:^|\n+)(?:en conclusion|pour conclure|en résumé|pour résumer)\s*:\s*(?:\n+|$)/gimu },
  { type: 'ai', label: 'Relance assistant', regex: /(?:^|\n{2,})(?:si tu veux|si vous voulez|n['’]hésite pas|n['’]hésitez pas|dis-moi|dites-moi)[^\n.!?]*(?:[.!?]+)?\s*$/gimu },
  { type: 'ai', label: 'Citation interne ChatGPT', regex: /(?:cite|filecite|memcite|url|entity|product|products|navlist|image_group|video)[^]*/gu },
  { type: 'ai', label: 'Citation numérotée générée', regex: /【\s*\d+\s*†[^】]+】/gu },

  { type: 'signal', label: 'Tiret cadratin', regex: /\s—\s/gu },
  { type: 'signal', label: 'Formulation générique', regex: /\b(?:en somme|il est important de noter que|il convient de noter que|force est de constater que|dans un monde où|à l['’]ère de|dans le paysage actuel)\b/giu },
  { type: 'signal', label: 'Construction rhétorique fréquente', regex: /\bce n['’]est pas\b[^.!?\n]{0,100}[.!?]\s*c['’]est\b/giu },
];

function countWords(value) {
  const trimmed = value.trim();
  return trimmed ? trimmed.split(/\s+/u).length : 0;
}

function asGlobalRegex(regex) {
  const flags = regex.flags.includes('g') ? regex.flags : `${regex.flags}g`;
  return new RegExp(regex.source, flags);
}

function countMatches(text, regex) {
  return [...text.matchAll(asGlobalRegex(regex))].length;
}

function escapeHtml(value) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function pushAudit(audit, type, label, count, detail) {
  if (!count) return;
  const existing = audit.find((item) => item.type === type && item.label === label && item.detail === detail);
  if (existing) existing.count += count;
  else audit.push({ type, label, count, detail });
}

function getDetectedMarkers(text) {
  const markers = [];

  for (const rule of markerRules) {
    const regex = asGlobalRegex(rule.regex);
    for (const match of text.matchAll(regex)) {
      if (!match[0]) continue;
      markers.push({
        start: match.index,
        end: match.index + match[0].length,
        value: match[0],
        type: rule.type,
        label: rule.label,
        visibleReplacement: rule.visibleReplacement,
      });
    }
  }

  markers.sort((a, b) => a.start - b.start || b.end - a.end);
  const accepted = [];
  let lastEnd = -1;
  for (const marker of markers) {
    if (marker.start < lastEnd) continue;
    accepted.push(marker);
    lastEnd = marker.end;
  }
  return accepted;
}

function renderMarkerPreview(text) {
  const markers = getDetectedMarkers(text);
  markerCount.textContent = markers.length.toLocaleString('fr-FR');

  if (!text) {
    markerPreview.innerHTML = '<span class="marker-empty">Collez un texte pour visualiser les marqueurs détectés.</span>';
    markerLegend.innerHTML = '';
    return;
  }

  if (!markers.length) {
    markerPreview.textContent = text;
    markerPreview.classList.add('is-clean');
    markerLegend.innerHTML = '<span class="legend-clean">Aucun artefact connu détecté dans le texte original.</span>';
    return;
  }

  markerPreview.classList.remove('is-clean');
  let cursor = 0;
  let html = '';

  for (const marker of markers) {
    html += escapeHtml(text.slice(cursor, marker.start));
    const shown = marker.visibleReplacement ?? marker.value;
    html += `<mark class="marker marker-${marker.type}" title="${escapeHtml(marker.label)}" data-label="${escapeHtml(marker.label)}">${escapeHtml(shown)}</mark>`;
    cursor = marker.end;
  }
  html += escapeHtml(text.slice(cursor));
  markerPreview.innerHTML = html;

  const categories = [
    ['markdown', 'Markdown / formatage'],
    ['invisible', 'Invisible / Unicode nettoyé'],
    ['ai', 'Wrapper / artefact supprimable'],
    ['signal', 'Signalé ou préservé'],
  ];

  markerLegend.innerHTML = categories
    .filter(([type]) => markers.some((marker) => marker.type === type))
    .map(([type, label]) => `<span class="legend-item"><i class="legend-dot marker-${type}"></i>${label}</span>`)
    .join('');
}

function removeInvisibleCharacters(text, audit) {
  let result = text;

  const zeroWidthSafe = /[\u00AD\u034F\u061C\u180E\u200B\u200C\u200E\u200F\u2060-\u2064\u206A-\u206F\uFEFF]/gu;
  const bidiControls = /[\u202A-\u202E\u2066-\u2069]/gu;
  const oddSpaces = /[\u00A0\u1680\u2000-\u200A\u202F\u205F\u3000]/gu;
  const unicodeSeparators = /[\u2028\u2029]/gu;
  const controlChars = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/gu;

  const zeroWidthCount = countMatches(result, zeroWidthSafe);
  const bidiCount = countMatches(result, bidiControls);
  const oddSpaceCount = countMatches(result, oddSpaces);
  const separatorCount = countMatches(result, unicodeSeparators);
  const controlCount = countMatches(result, controlChars);
  const zwjCount = countMatches(result, /\u200D/gu);
  const variationCount = countMatches(result, /[\uFE00-\uFE0F]|[\u{E0100}-\u{E01EF}]/gu);
  const tagCount = countMatches(result, /[\u{E0000}-\u{E007F}]/gu);

  result = result
    .replace(zeroWidthSafe, '')
    .replace(bidiControls, '')
    .replace(oddSpaces, ' ')
    .replace(unicodeSeparators, '\n')
    .replace(controlChars, '');

  pushAudit(audit, 'removed', 'Caractères invisibles / format', zeroWidthCount, 'Soft hyphen, zero-width space/non-joiner, word joiner, BOM, marques directionnelles et autres caractères de format invisibles supprimés.');
  pushAudit(audit, 'removed', 'Contrôles bidirectionnels', bidiCount, 'Contrôles bidi invisibles supprimés pour éviter un ordre d’affichage caché.');
  pushAudit(audit, 'replaced', 'Espaces Unicode atypiques', oddSpaceCount, 'NBSP, thin spaces, narrow NBSP et autres espaces visuellement trompeurs remplacés par un espace standard.');
  pushAudit(audit, 'replaced', 'Séparateurs Unicode', separatorCount, 'Séparateurs de ligne/paragraphe Unicode convertis en retours standards.');
  pushAudit(audit, 'removed', 'Caractères de contrôle', controlCount, 'Contrôles C0/C1 non imprimables supprimés, hors tabulations et retours utiles.');

  // Ces caractères peuvent être nécessaires aux emojis et à certaines écritures : on les audite sans les supprimer.
  pushAudit(audit, 'detected', 'ZWJ préservés', zwjCount, 'U+200D est conservé car il compose de nombreux emojis (familles, métiers, etc.).');
  pushAudit(audit, 'detected', 'Variation selectors préservés', variationCount, 'Conservés pour ne pas casser le rendu emoji/typographique.');
  pushAudit(audit, 'detected', 'Tags Unicode préservés', tagCount, 'Détectés mais conservés car certaines séquences de drapeaux utilisent ces caractères.');

  return result;
}

function removeMarkdown(text, audit) {
  let result = text;
  const rules = [
    ['removed', 'Barrières de code', /^```[^\n]*\n?|^```\s*$/mu, 'Les ``` et éventuels noms de langage ont été retirés.', ''],
    ['removed', 'Titres Markdown', /^\s{0,3}#{1,6}\s+/mu, 'Les préfixes # ont été retirés.', ''],
    ['removed', 'Citations Markdown', /^\s{0,3}>\s?/mu, 'Les préfixes > ont été retirés.', ''],
    ['replaced', 'Images Markdown', /!\[([^\]]*)\]\([^)]*\)/u, 'L’image a été remplacée par son texte alternatif.', '$1'],
    ['replaced', 'Liens Markdown', /\[([^\]]+)\]\(([^)]+)\)/u, 'L’URL de formatage a été retirée, le libellé est conservé.', '$1'],
    ['removed', 'Gras Markdown', /(\*\*|__)(.*?)\1/u, 'Les marqueurs de gras ont été retirés.', '$2'],
    ['removed', 'Italique Markdown (*)', /(?<!\*)\*([^*\n]+)\*(?!\*)/u, 'Les marqueurs d’italique ont été retirés.', '$1'],
    ['removed', 'Italique Markdown (_)', /(?<!_)_([^_\n]+)_(?!_)/u, 'Les marqueurs d’italique ont été retirés.', '$1'],
    ['removed', 'Texte barré Markdown', /~~(.*?)~~/u, 'Les ~~ ont été retirés.', '$1'],
    ['removed', 'Code inline', /`([^`]+)`/u, 'Les backticks ont été retirés.', '$1'],
    ['removed', 'Séparateurs Markdown', /^\s*(?:[-*_]\s*){3,}$/mu, 'Les lignes de séparation Markdown ont été supprimées.', ''],
  ];

  for (const [type, label, baseRegex, detail, replacement] of rules) {
    const regex = asGlobalRegex(baseRegex);
    const count = countMatches(result, regex);
    if (!count) continue;
    result = result.replace(regex, replacement);
    pushAudit(audit, type, label, count, detail);
  }

  return result;
}

function removeHtmlArtifacts(text, audit) {
  let result = text;
  const breakTags = countMatches(result, /<\s*(?:br\s*\/?|\/?p|\/?div|\/?li)\s*>/giu);
  const remainingTags = countMatches(result, /<\/?[a-z][^>]*>/giu);
  const nbspEntities = countMatches(result, /&(?:nbsp|#160|#xA0);/giu);
  const encodedBreaks = countMatches(result, /&#(?:10|13);/giu);

  result = result
    .replace(/<\s*br\s*\/?>/giu, '\n')
    .replace(/<\s*\/\s*(?:p|div|li)\s*>/giu, '\n')
    .replace(/<\s*(?:p|div|li)(?:\s[^>]*)?>/giu, '')
    .replace(/<\/?[a-z][^>]*>/giu, '')
    .replace(/&(?:nbsp|#160|#xA0);/giu, ' ')
    .replace(/&#(?:10|13);/giu, '\n');

  pushAudit(audit, 'reformatted', 'Balises HTML de structure', breakTags, 'Les balises de ligne/paragraphe ont été converties en retours à la ligne.');
  pushAudit(audit, 'removed', 'Balises HTML résiduelles', remainingTags, 'Les balises HTML de présentation ont été retirées en conservant leur texte.');
  pushAudit(audit, 'replaced', 'Entités HTML d’espace', nbspEntities, 'Les &nbsp; et équivalents ont été remplacés par des espaces normaux.');
  pushAudit(audit, 'replaced', 'Entités HTML de retour', encodedBreaks, 'Les retours de ligne encodés ont été normalisés.');

  return result;
}

function normalizeLists(text, audit) {
  let result = text;
  const bulletCount = countMatches(result, /^\s*[-*+]\s+/mu);
  const unicodeBulletCount = countMatches(result, /^\s*[◦▪▫‣⁃∙·]\s+/mu);
  const numberedCount = countMatches(result, /^\s*(\d+)[.)]\s+/mu);

  result = result
    .replace(/^\s*[-*+]\s+/gmu, '• ')
    .replace(/^\s*[◦▪▫‣⁃∙·]\s+/gmu, '• ')
    .replace(/^\s*(\d+)[.)]\s+/gmu, '$1. ');

  pushAudit(audit, 'reformatted', 'Puces Markdown', bulletCount, 'Les puces Markdown ont été uniformisées en •.');
  pushAudit(audit, 'reformatted', 'Puces Unicode', unicodeBulletCount, 'Les variantes de puces ont été uniformisées en •.');
  pushAudit(audit, 'reformatted', 'Listes numérotées', numberedCount, 'La numérotation a été uniformisée en “1. ”.');
  return result;
}

function normalizeSpacing(text, audit) {
  let result = text;
  const trailingSpaces = countMatches(result, /[ \t]+$/mu);
  const emptyWhitespaceLines = countMatches(result, /^[ \t]+$/mu);
  const excessiveBreaks = countMatches(result, /\n{3,}/u);
  const repeatedSpaces = countMatches(result, /(?<=\S)[ \t]{2,}(?=\S)/u);
  const beforeTrim = result;

  result = result
    .replace(/[ \t]+$/gmu, '')
    .replace(/^[ \t]+$/gmu, '')
    .replace(/(?<=\S)[ \t]{2,}(?=\S)/gu, ' ')
    .replace(/\n{3,}/gu, '\n\n')
    .trim();

  pushAudit(audit, 'removed', 'Espaces de fin de ligne', trailingSpaces, 'Espaces inutiles supprimés en fin de ligne.');
  pushAudit(audit, 'removed', 'Lignes contenant seulement des espaces', emptyWhitespaceLines, 'Les espaces ont été retirés de ces lignes.');
  pushAudit(audit, 'reformatted', 'Espaces multiples', repeatedSpaces, 'Les espaces multiples au milieu d’une phrase ont été ramenés à un seul.');
  pushAudit(audit, 'reformatted', 'Retours à la ligne excessifs', excessiveBreaks, 'Les blocs de 3 retours ou plus ont été ramenés à 2.');

  if (beforeTrim !== result && !trailingSpaces && !emptyWhitespaceLines && !excessiveBreaks && !repeatedSpaces) {
    pushAudit(audit, 'removed', 'Espaces en bord de texte', 1, 'Les espaces ou retours superflus au début/à la fin ont été retirés.');
  }

  return result;
}

function removeGenericAiFraming(text, audit) {
  let result = text;

  const removableRules = [
    [/^(?:bien sûr|bien entendu|absolument|avec plaisir)[\s!,.:-]*(?:\n+|$)/iu, 'Introduction générique', 'Une ouverture d’assistant isolée a été retirée.'],
    [/^(?:voici|voilà)\s+(?:(?:une|la|ma)\s+)?(?:version|proposition|réécriture|reformulation|réponse|publication|post|texte)[^\n.!?]*(?:[.!?])?\s*(?:\n+|$)/iu, 'Annonce de réponse', 'Une phrase annonçant artificiellement le contenu a été retirée.'],
    [/^(?:je te propose|je vous propose|je te suggère|je vous suggère)\s+[^\n.!?]*(?:[.!?])?\s*(?:\n+|$)/iu, 'Annonce de proposition', 'Une phrase générique de mise en contexte de l’assistant a été retirée.'],
    [/^(?:version|proposition|post linkedin|publication linkedin|texte final|version finale|version optimisée|version retravaillée)\s*:?[ \t]*(?:\n+|$)/imu, 'Intertitre de wrapper', 'Un titre technique ajouté autour du vrai contenu a été retiré.'],
    [/(?:^|\n+)(?:en conclusion|pour conclure|en résumé|pour résumer)\s*:\s*(?:\n+|$)/iu, 'Intertitre de conclusion générique', 'L’intertitre générique a été retiré sans supprimer le contenu qui suit.'],
    [/(?:^|\n{2,})(?:si tu veux|si vous voulez|n['’]hésite pas|n['’]hésitez pas|dis-moi|dites-moi)[^\n.!?]*(?:[.!?]+)?\s*$/iu, 'Relance finale d’assistant', 'Une invitation finale à demander une autre version a été retirée.'],
    [/(?:cite|filecite|memcite|url|entity|product|products|navlist|image_group|video)[^]*/u, 'Marqueur de citation interne', 'Un marqueur technique interne de citation a été supprimé.'],
    [/【\s*\d+\s*†[^】]+】/u, 'Citation générée', 'Une référence technique générée par une interface d’assistant a été supprimée.'],
  ];

  for (const [baseRegex, label, detail] of removableRules) {
    const regex = asGlobalRegex(baseRegex);
    const count = countMatches(result, regex);
    if (!count) continue;
    result = result.replace(regex, '\n');
    pushAudit(audit, 'removed', label, count, detail);
  }

  const spacedEmDashes = countMatches(result, /\s—\s/u);
  if (spacedEmDashes) {
    result = result.replace(/\s—\s/gu, ' - ');
    pushAudit(audit, 'replaced', 'Tirets cadratins espacés', spacedEmDashes, 'Remplacés par un tiret simple pour neutraliser ce tic typographique sans réécrire la phrase.');
  }

  const genericTransitions = countMatches(result, /\b(?:en somme|il est important de noter que|il convient de noter que|force est de constater que|dans un monde où|à l['’]ère de|dans le paysage actuel)\b/iu);
  if (genericTransitions) {
    pushAudit(audit, 'detected', 'Formulations potentiellement génériques', genericTransitions, 'Signalées uniquement : les supprimer automatiquement modifierait le sens ou la voix du texte.');
  }

  const rhetoricalPatterns = countMatches(result, /\bce n['’]est pas\b[^.!?\n]{0,100}[.!?]\s*c['’]est\b/iu);
  if (rhetoricalPatterns) {
    pushAudit(audit, 'detected', 'Construction “ce n’est pas… c’est…”', rhetoricalPatterns, 'Structure souvent surutilisée par les assistants, mais potentiellement volontaire : conservée.');
  }

  const colonLeadIns = countMatches(result, /(?:^|\n)(?:le vrai problème|la réalité|le constat|la clé|le résultat|le problème)\s*:/iu);
  if (colonLeadIns) {
    pushAudit(audit, 'detected', 'Intertitres rhétoriques courts', colonLeadIns, 'Détectés comme signal stylistique, mais conservés car ils peuvent être utiles sur LinkedIn.');
  }

  return result;
}

function splitLongParagraph(paragraph) {
  if (paragraph.length < 280 || paragraph.startsWith('• ') || /^\d+\.\s/u.test(paragraph)) return { text: paragraph, splits: 0 };

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
  return { text: chunks.join('\n\n'), splits: Math.max(0, chunks.length - 1) };
}

function formatForLinkedIn(text, audit) {
  let splitCount = 0;
  const result = text
    .split(/\n\n+/u)
    .map((paragraph) => {
      const formatted = splitLongParagraph(paragraph.trim());
      splitCount += formatted.splits;
      return formatted.text;
    })
    .filter(Boolean)
    .join('\n\n');

  pushAudit(audit, 'reformatted', 'Paragraphes aérés', splitCount, 'Des retours à la ligne ont été ajoutés entre des phrases pour faciliter la lecture mobile.');
  return result;
}

function cleanText(text) {
  const audit = [];
  let result = text.replace(/\r\n?/gu, '\n');

  if (options.removeInvisible.checked) result = removeInvisibleCharacters(result, audit);
  if (options.removeMarkdown.checked) result = removeMarkdown(result, audit);
  if (options.advancedAiCleanup.checked) result = removeHtmlArtifacts(result, audit);
  if (options.normalizeLists.checked) result = normalizeLists(result, audit);
  if (options.advancedAiCleanup.checked) result = removeGenericAiFraming(result, audit);
  if (options.normalizeSpacing.checked) result = normalizeSpacing(result, audit);
  if (options.linkedinFormatting.checked) result = formatForLinkedIn(result, audit);
  if (options.normalizeSpacing.checked) result = normalizeSpacing(result, audit);

  return { text: result, audit };
}

function analyzeText(text) {
  if (!text.trim()) return { score: null, items: [] };

  const paragraphs = text.split(/\n\n+/u).map((p) => p.trim()).filter(Boolean);
  const longParagraphs = paragraphs.filter((p) => p.length > 320).length;
  const veryLongParagraphs = paragraphs.filter((p) => p.length > 520).length;
  const listLines = text.split('\n').filter((line) => /^(?:•|\d+\.)\s/u.test(line.trim())).length;
  const firstParagraphLength = paragraphs[0]?.length ?? 0;
  const characters = text.length;

  let score = 100 - longParagraphs * 8 - veryLongParagraphs * 10;
  if (firstParagraphLength > 240) score -= 12;
  if (characters > 3000) score -= 20;
  if (paragraphs.length === 1 && characters > 500) score -= 15;
  score = Math.max(0, Math.min(100, score));

  const items = [];
  items.push(characters <= 3000
    ? { type: 'ok', text: `Longueur compatible LinkedIn : ${characters.toLocaleString('fr-FR')} caractères.` }
    : { type: 'warn', text: `${(characters - 3000).toLocaleString('fr-FR')} caractères dépassent la limite de 3 000.` });
  items.push(longParagraphs === 0
    ? { type: 'ok', text: 'Les paragraphes sont suffisamment aérés pour une lecture mobile.' }
    : { type: 'warn', text: `${longParagraphs} paragraphe${longParagraphs > 1 ? 's sont' : ' est'} encore assez dense.` });

  if (firstParagraphLength > 240) items.push({ type: 'warn', text: 'Le premier bloc est long : le hook risque d’être moins visible avant « voir plus ».' });
  else if (firstParagraphLength > 0) items.push({ type: 'ok', text: 'Le premier bloc reste court et lisible dans le feed.' });
  if (listLines > 0) items.push({ type: 'info', text: `${listLines} ligne${listLines > 1 ? 's' : ''} de liste détectée${listLines > 1 ? 's' : ''}.` });

  return { score, items };
}

function renderAudit(audit) {
  const changed = audit.filter((item) => item.type !== 'detected');
  const detected = audit.filter((item) => item.type === 'detected');
  const totalChanges = changed.reduce((sum, item) => sum + item.count, 0);
  const totalDetected = detected.reduce((sum, item) => sum + item.count, 0);

  auditCount.textContent = totalChanges.toLocaleString('fr-FR');

  if (!audit.length) {
    auditSummary.textContent = 'Aucun artefact ni transformation détecté.';
    auditList.innerHTML = '';
    return;
  }

  const parts = [];
  if (totalChanges) parts.push(`${totalChanges.toLocaleString('fr-FR')} modification${totalChanges > 1 ? 's' : ''} appliquée${totalChanges > 1 ? 's' : ''}`);
  if (totalDetected) parts.push(`${totalDetected.toLocaleString('fr-FR')} élément${totalDetected > 1 ? 's' : ''} signalé${totalDetected > 1 ? 's' : ''} mais conservé${totalDetected > 1 ? 's' : ''}`);
  auditSummary.textContent = `${parts.join(' • ')}.`;

  const labels = { removed: 'Supprimé', replaced: 'Remplacé', reformatted: 'Reformaté', detected: 'Détecté' };
  auditList.innerHTML = audit
    .map((item) => `<details class="audit-item ${item.type}"><summary><span class="audit-type">${labels[item.type]}</span><strong>${item.label}</strong><span class="audit-number">× ${item.count}</span></summary><p>${item.detail}</p></details>`)
    .join('');
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
  renderMarkerPreview(input.value);
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add('show');
  window.setTimeout(() => toast.classList.remove('show'), 1800);
}

function formatCurrentText(showFeedback = false) {
  const result = cleanText(input.value);
  output.value = result.text;
  latestAudit = result.audit;
  renderAudit(latestAudit);
  updateStats();
  if (showFeedback && input.value.trim()) showToast('Post nettoyé et formaté');
}

cleanButton.addEventListener('click', () => formatCurrentText(true));

clearButton.addEventListener('click', () => {
  input.value = '';
  output.value = '';
  latestAudit = [];
  renderAudit([]);
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
Object.values(options).forEach((option) => option.addEventListener('change', () => {
  if (input.value) formatCurrentText();
}));

renderAudit([]);
updateStats();
