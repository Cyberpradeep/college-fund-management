const fs = require('fs');
const { PDFDocument } = require('pdf-lib');
const path = require('path');

const mergePDFs = async (files, outputPath) => {
  const mergedPdf = await PDFDocument.create();

  for (const file of files) {
    const fileData = fs.readFileSync(file);
    const pdf = await PDFDocument.load(fileData);
    const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
    copiedPages.forEach((page) => mergedPdf.addPage(page));
  }

  const mergedPdfFile = await mergedPdf.save();
  fs.writeFileSync(outputPath, mergedPdfFile);
};

module.exports = mergePDFs;
