const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse');

async function extractPdfPages(filePath) {
  try {
    const dataBuffer = fs.readFileSync(filePath);
    const pdf = await pdfParse(dataBuffer);

    const pages = [];

    // Each page becomes a slide with extracted text content
    for (let i = 0; i < pdf.numpages; i++) {
      const pageNum = i + 1;

      // Simple approach: split text by form feed characters (page breaks)
      let content = '';
      if (pdf.text) {
        const pageTexts = pdf.text.split('\f');
        if (pageTexts[i]) {
          content = pageTexts[i].trim();
          // Limit to first 1000 chars per slide for readability
          if (content.length > 1000) {
            content = content.substring(0, 1000) + '...';
          }
        }
      }

      pages.push({
        pageNumber: pageNum,
        content: content || `[Page ${pageNum} - Text extraction from PDF]`,
        title: `Page ${pageNum}`
      });

      console.log(`✓ Extracted page ${pageNum}/${pdf.numpages}`);
    }

    return pages;
  } catch (err) {
    console.error('PDF extraction error:', err);
    throw new Error(`Failed to process PDF: ${err.message}`);
  }
}

module.exports = { extractPdfPages };
