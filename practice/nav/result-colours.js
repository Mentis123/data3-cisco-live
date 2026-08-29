(() => {
  const practiceColours = Object.fromEntries(
    TAXONOMY.practice.items.map(([name, , colour]) => [name, colour])
  );

  const hexToRgb = hex => {
    const value = String(hex || '#00AEFF').replace('#', '');
    const full = value.length === 3 ? value.split('').map(char => char + char).join('') : value;
    const number = Number.parseInt(full, 16);
    return `${(number >> 16) & 255}, ${(number >> 8) & 255}, ${number & 255}`;
  };

  const originalResultCard = resultCard;
  resultCard = item => {
    const primaryPractice = item.practices[0] || 'Unknown';
    const colour = practiceColours[primaryPractice] || '#00AEFF';
    const markup = originalResultCard(item);
    return markup.replace(
      'class="resultCard"',
      `class="resultCard" data-primary-practice="${escapeHtml(primaryPractice)}" style="--practice-colour:${colour};--practice-rgb:${hexToRgb(colour)}"`
    );
  };

  render();
})();
