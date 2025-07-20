const fs = require('fs');
const { PDFDocument, StandardFonts, rgb } = require('pdf-lib');
const { createCanvas, loadImage } = require('canvas');
const path = require('path');

const mergePDFs = async (files, outputPath) => {
  const mergedPdf = await PDFDocument.create();

  for (const file of files) {
    const ext = path.extname(file).toLowerCase();
    if (ext === '.pdf') {
      const fileData = fs.readFileSync(file);
      const pdf = await PDFDocument.load(fileData);
      const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
      copiedPages.forEach((page) => mergedPdf.addPage(page));
    } else if (['.jpg', '.jpeg', '.png'].includes(ext)) {
      // Add image as a new PDF page
      const imageBytes = fs.readFileSync(file);
      let img;
      if (ext === '.jpg' || ext === '.jpeg') {
        img = await mergedPdf.embedJpg(imageBytes);
      } else {
        img = await mergedPdf.embedPng(imageBytes);
      }
      const page = mergedPdf.addPage([img.width, img.height]);
      page.drawImage(img, {
        x: 0,
        y: 0,
        width: img.width,
        height: img.height
      });
    }
    // Skip other file types
  }

  const mergedPdfFile = await mergedPdf.save();
  fs.writeFileSync(outputPath, mergedPdfFile);
};

module.exports = mergePDFs;
