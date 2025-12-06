import React from 'react';

/**
 * A simple and consistent markdown-to-HTML renderer for the specific syntax used by the AI tutor.
 * This ensures that formatting is uniform across all components of the application.
 * NOTE: This is not a full-featured or secure markdown parser. It is designed to work only
 * with the trusted output from the Gemini API as defined in the system instructions.
 */
const renderTable = (tableMarkdown: string): string => {
    const rows = tableMarkdown.trim().split('\n');
    if (rows.length < 2) return tableMarkdown; // Not a valid table

    const headerRow = rows[0];
    const separatorRow = rows[1]; // We don't use this for alignment, but it's a key part of the structure
    const bodyRows = rows.slice(2);

    // Basic validation
    if (!headerRow.includes('|') || !separatorRow.match(/\|[:-\s]+\|/)) {
        return tableMarkdown;
    }

    const renderCells = (row: string, cellType: 'th' | 'td'): string => {
        return row
            .split('|')
            .map(cell => cell.trim())
            .filter(cell => cell) // Filter out empty cells from start/end pipes
            .map(cell => `<${cellType}>${cell}</${cellType}>`)
            .join('');
    };

    const headerHtml = `<thead><tr>${renderCells(headerRow, 'th')}</tr></thead>`;
    const bodyHtml = `<tbody>${bodyRows.map(row => `<tr>${renderCells(row, 'td')}</tr>`).join('')}</tbody>`;

    return `<table>${headerHtml}${bodyHtml}</table>`;
};


export const renderMarkdown = (text: string) => {
    if (!text) return { __html: '' };

    // The order of these replacements is important.
    // Block elements are processed first, then inline elements.
    let html = text
      // 1. Escape basic HTML tags to prevent injection from malformed AI output.
      .replace(/</g, '&lt;').replace(/>/g, '&gt;')
    
       // 2. Process Markdown tables
      .replace(/^((?:\|.*\|[\r\n]+)+)/gm, (match) => renderTable(match))

      // 3. Process special [EXAMPLE] blocks.
      .replace(/\[EXAMPLE\]([\s\S]*?)\[\/EXAMPLE\]/g, (match, content) => {
        const innerContent = content.trim()
            // Bold text inside examples. Use a bright white color to stand out on the dark background.
            .replace(/\*\*(.*?)\*\*/g, '<strong class="text-white font-semibold">$1</strong>')
            // Handle newlines inside examples
            .replace(/\n/g, '<br/>'); 
        return `<div class="my-4 p-4 bg-gray-900 border-l-4 border-green-500 rounded-r-lg shadow-inner">
                  <div class="font-bold text-green-400 mb-2 tracking-wide">EXAMPLE</div>
                  <div class="text-slate-300 text-sm">${innerContent}</div>
                </div>`;
      })

      // 4. Process headings with a more robust, single-pass function.
      .replace(/^(#+)\s*(.*$)/gim, (match, hashes, content) => {
          const level = hashes.length;
          switch (level) {
              case 1:
                  return `<p class="text-2xl font-bold text-teal-800 dark:text-teal-200 mt-8 mb-4">${content}</p>`;
              case 2:
                  return `<p class="text-xl font-bold text-teal-700 dark:text-teal-300 mt-6 mb-3">${content}</p>`;
              case 3:
              default:
                  return `<p class="text-lg font-bold text-emerald-600 dark:text-green-400 mt-4 mb-2">${content}</p>`;
          }
      })
      
      // 5. Process list items. This creates list-item-like paragraphs, which is visually sufficient.
      .replace(/^\s*\*\s(.*$)/gim, '<p class="pl-6 relative before:content-[\'•\'] before:absolute before:left-2 before:text-[color:var(--accent-secondary)]">$1</p>')
      
      // 6. Process inline bold text, styling it as a formula/keyword highlight.
      // FIX: Changed font-semibold to font-bold to match the topic header style.
      .replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-[color:var(--accent-primary)]">$1</strong>')

      // 7. Handle newlines. Any remaining newline characters should become <br> tags.
      // This helps preserve formatting for simple line breaks that aren't full paragraphs.
      .replace(/\n/g, '<br />');

    // Remove breaks that are directly before a list item paragraph, as they create too much space.
    html = html.replace(/<br \s*\/?>(\s*<p class="pl-6)/g, '$1');

    return { __html: html };
};