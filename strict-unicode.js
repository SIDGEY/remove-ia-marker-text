(() => {
  const strictOption = document.querySelector('#strictUnicodePurge');
  if (!strictOption || typeof cleanText !== 'function') return;

  const baseCleanText = cleanText;

  const STRICT_RULES = [
    {
      label: 'ZWJ / ZWNJ',
      regex: /[\u200C\u200D]/gu,
      detail: 'Zero-width joiner/non-joiner supprimés en mode strict. Certains emojis composés peuvent être simplifiés.',
    },
    {
      label: 'Variation selectors',
      regex: /[\uFE00-\uFE0F]|[\u{E0100}-\u{E01EF}]/gu,
      detail: 'Sélecteurs de variation Unicode supprimés. Le rendu texte/emoji peut devenir plus neutre.',
    },
    {
      label: 'Tags Unicode',
      regex: /[\u{E0000}-\u{E007F}]/gu,
      detail: 'Caractères Unicode Tag supprimés.',
    },
    {
      label: 'Combining Grapheme Joiner',
      regex: /\u034F/gu,
      detail: 'Combining Grapheme Joiner invisible supprimé.',
    },
    {
      label: 'Hangul filler invisible',
      regex: /[\u115F\u1160\u3164\uFFA0]/gu,
      detail: 'Fillers Unicode visuellement vides supprimés.',
    },
    {
      label: 'Braille blank',
      regex: /\u2800/gu,
      detail: 'Braille Pattern Blank supprimé.',
    },
    {
      label: 'Objet de remplacement',
      regex: /[\uFFFC\uFFFD]/gu,
      detail: 'Caractères de remplacement/objet invisibles ou parasites supprimés.',
    },
    {
      label: 'Contrôles directionnels supplémentaires',
      regex: /[\u200E\u200F\u202A-\u202E\u2066-\u2069]/gu,
      detail: 'Marques et contrôles de direction de texte supprimés.',
    },
  ];

  function count(regex, text) {
    const flags = regex.flags.includes('g') ? regex.flags : `${regex.flags}g`;
    return [...text.matchAll(new RegExp(regex.source, flags))].length;
  }

  function appendAudit(audit, label, amount, detail) {
    if (!amount) return;
    const existing = audit.find((item) => item.type === 'removed' && item.label === label);
    if (existing) existing.count += amount;
    else audit.push({ type: 'removed', label, count: amount, detail });
  }

  function strictPurge(text, audit) {
    let result = text;

    for (const rule of STRICT_RULES) {
      const amount = count(rule.regex, result);
      if (!amount) continue;
      result = result.replace(rule.regex, '');
      appendAudit(audit, rule.label, amount, rule.detail);
    }

    // Normalise tout espace Unicode restant vers U+0020, sans toucher aux retours à la ligne.
    const exoticSpaces = /[\u00A0\u1680\u180E\u2000-\u200B\u202F\u205F\u2060\u3000\uFEFF]/gu;
    const spaceCount = count(exoticSpaces, result);
    if (spaceCount) {
      result = result.replace(exoticSpaces, ' ');
      const existing = audit.find((item) => item.type === 'replaced' && item.label === 'Espaces Unicode restants');
      if (existing) existing.count += spaceCount;
      else audit.push({
        type: 'replaced',
        label: 'Espaces Unicode restants',
        count: spaceCount,
        detail: 'Tout espace Unicode atypique restant a été normalisé vers un espace ASCII standard.',
      });
    }

    // Supprime une dernière fois les caractères de catégorie Cf connus comme purement formatants.
    const residualFormat = /[\u00AD\u061C\u180E\u200B-\u200F\u202A-\u202E\u2060-\u206F\uFEFF]/gu;
    const residualCount = count(residualFormat, result);
    if (residualCount) {
      result = result.replace(residualFormat, '');
      appendAudit(audit, 'Formats Unicode résiduels', residualCount, 'Dernier passage de purge sur les caractères Unicode de formatage invisibles.');
    }

    return result;
  }

  cleanText = function patchedCleanText(text) {
    const result = baseCleanText(text);
    if (!strictOption.checked) return result;

    result.text = strictPurge(result.text, result.audit);
    return result;
  };

  strictOption.addEventListener('change', () => {
    if (input.value) formatCurrentText();
  });
})();
