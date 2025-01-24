// Base path configuration
function getBasePath() {
  if (window.location.hostname === 'dis-craft.github.io') {
    return '/cad/pdfs/';
  }
  return './pdfs/';
}

const basePath = getBasePath();
console.log('Base path:', basePath);

// Make functions globally accessible
window.loadSetFiles = function(setName) {
  console.log('Loading files for set:', setName);
  const fileListDiv = document.getElementById("fileList");
  if (!fileListDiv) {
    console.error('Could not find fileList element');
    return;
  }
  
  fileListDiv.innerHTML = ""; // Clear previous files
  for (let i = 1; i <= 5; i++) {
    const filePath = `${basePath}${setName}/file${i}.pdf`;
    console.log('Adding file path:', filePath);
    const fileCheckbox = `
      <div class="pdf-item">
        <input type="checkbox" value="${filePath}"> File ${i}
      </div>`;
    fileListDiv.innerHTML += fileCheckbox;
  }
  console.log('Final fileList HTML:', fileListDiv.innerHTML);
};

window.generateCombinedPDF = async function() {
  try {
    const name = document.getElementById("userName").value.trim();
    const usn = document.getElementById("userUSN").value.trim();
    const section = document.getElementById("userSection").value.trim();

    console.log('User inputs:', { name, usn, section });

    if (name.length > 25 || usn.length > 25) {
      alert("Name and USN must be 25 characters or less.");
      return;
    }

    if (!name || !usn || !section) {
      alert("Please fill in all fields (Name, USN, Section).");
      return;
    }

    const selectedFiles = Array.from(document.querySelectorAll("#fileList input[type=checkbox]:checked"))
      .map(checkbox => checkbox.value);

    console.log('Selected files:', selectedFiles);

    if (selectedFiles.length === 0) {
      alert("Please select at least one file.");
      return;
    }

    const mergedPdf = await PDFLib.PDFDocument.create();
    let successCount = 0;

    for (const fileUrl of selectedFiles) {
      try {
        console.log('Processing file:', fileUrl);
        const response = await fetch(fileUrl, {
          method: 'GET',
          mode: 'cors',
          cache: 'no-cache',
          headers: {
            'Accept': 'application/pdf'
          }
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const pdfBytes = await response.arrayBuffer();
        const pdfDoc = await PDFLib.PDFDocument.load(pdfBytes);
        console.log('Successfully loaded PDF:', fileUrl);

        const pages = await mergedPdf.copyPages(pdfDoc, pdfDoc.getPageIndices());
        pages.forEach(page => {
          const { width, height } = page.getSize();
          console.log('Processing page with dimensions:', { width, height });

          const gridWidth = 150;
          const gridHeight = 60;
          const gridX = width - gridWidth - 10;
          const gridY = 20;

          // Draw grids
          page.drawRectangle({
            x: gridX,
            y: gridY + 60,
            width: gridWidth,
            height: 20,
            borderColor: PDFLib.rgb(0, 0, 0),
            borderWidth: 2,
          });

          page.drawRectangle({
            x: gridX,
            y: gridY + 40,
            width: gridWidth,
            height: 20,
            borderColor: PDFLib.rgb(0, 0, 0),
            borderWidth: 2,
          });

          page.drawRectangle({
            x: gridX,
            y: gridY + 20,
            width: gridWidth,
            height: 20,
            borderColor: PDFLib.rgb(0, 0, 0),
            borderWidth: 2,
          });

          // Add text
          page.drawText(`NAME: ${name}`, { x: gridX + 5, y: gridY + 65, size: 10 });
          page.drawText(`USN: ${usn}`, { x: gridX + 5, y: gridY + 45, size: 10 });
          page.drawText(`SECTION: "${section}"`, { x: gridX + 5, y: gridY + 25, size: 10 });

          mergedPdf.addPage(page);
        });
        successCount++;
      } catch (error) {
        console.error(`Error processing file: ${fileUrl}`, error);
        alert(`Error loading PDF file: ${fileUrl}. Please try again or contact support if the issue persists.\nError details: ${error.message}`);
        return;
      }
    }

    if (successCount === 0) {
      throw new Error('No PDFs were successfully processed');
    }

    const pdfBytes = await mergedPdf.save();
    const blob = new Blob([pdfBytes], { type: "application/pdf" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${name}_${usn}_Combined.pdf`;
    link.click();
  } catch (error) {
    console.error('Error generating PDF:', error);
    alert(`An error occurred while generating the PDF: ${error.message}\nPlease try again or contact support if the issue persists.`);
  }
};

window.previewCombinedPDF = async function() {
  try {
    const name = document.getElementById("userName").value.trim();
    const usn = document.getElementById("userUSN").value.trim();
    const section = document.getElementById("userSection").value.trim();

    const selectedFiles = Array.from(document.querySelectorAll("#fileList input[type=checkbox]:checked"))
      .map(checkbox => checkbox.value);

    if (selectedFiles.length === 0) {
      alert("Please select at least one file.");
      return;
    }

    const mergedPdf = await PDFLib.PDFDocument.create();
    for (const fileUrl of selectedFiles) {
      const response = await fetch(fileUrl);
      const pdfBytes = await response.arrayBuffer();
      const pdfDoc = await PDFLib.PDFDocument.load(pdfBytes);
      const pages = await mergedPdf.copyPages(pdfDoc, pdfDoc.getPageIndices());
      pages.forEach(page => {
        mergedPdf.addPage(page);
      });
    }

    const pdfBytes = await mergedPdf.save();
    const blob = new Blob([pdfBytes], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    window.open(url);
  } catch (error) {
    console.error('Error generating preview PDF:', error);
    alert('An error occurred while generating the preview PDF.');
  }
};

