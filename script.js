
const getBasePath = () => {
  
  if (window.location.hostname === 'dis-craft.github.io') {
    return '/cad/pdfs/';
  }
  return './pdfs/';
};

const basePath = getBasePath();

// Dynamically load files for a selected set
function loadSetFiles(setName) {
  const fileListDiv = document.getElementById("fileList");
  fileListDiv.innerHTML = ""; // Clear previous files
  for (let i = 1; i <= 5; i++) {https://github.com/dis-craft/cad
    const filePath = `${basePath}${setName}/file${i}.pdf`;
    const fileCheckbox = `
      <div class="pdf-item">
        <input type="checkbox" value="${filePath}"> File ${i}
      </div>`;
    fileListDiv.innerHTML += fileCheckbox;
  }
}

async function generateCombinedPDF() {
  try {
    // Get user inputs
    const name = document.getElementById("userName").value.trim();
    const usn = document.getElementById("userUSN").value.trim();
    const section = document.getElementById("userSection").value.trim();

    // Check if Name and USN are within the limit of 25 characters
    if (name.length > 25 || usn.length > 25) {
      alert("Name and USN must be 25 characters or less.");
      return;
    }

    if (!name || !usn || !section) {
      alert("Please fill in all fields (Name, USN, Section).");
      return;
    }

    // Get selected files
    const selectedFiles = Array.from(document.querySelectorAll("#fileList input[type=checkbox]:checked")).map(
      checkbox => checkbox.value
    );

    if (selectedFiles.length === 0) {
      alert("Please select at least one file.");
      return;
    }

    // Creating a new PDF file.
    const mergedPdf = await PDFLib.PDFDocument.create();
    let successCount = 0;

    for (const fileUrl of selectedFiles) {
      try {
        const response = await fetch(fileUrl, {
          method: 'GET',
          mode: 'cors', // Enable CORS
          cache: 'no-cache', // Disable caching
          headers: {
            'Accept': 'application/pdf'
          }
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const pdfBytes = await response.arrayBuffer();
        const pdfDoc = await PDFLib.PDFDocument.load(pdfBytes);

        // Copy pages and add grid to each page
        const pages = await mergedPdf.copyPages(pdfDoc, pdfDoc.getPageIndices());
        pages.forEach(page => {
          const { width, height } = page.getSize();

          // Grid dimensions and position
          const gridWidth = 150;
          const gridHeight = 60;
          const gridX = width - gridWidth - 10;
          const gridY = 20;

          // Draw grid for NAME
          page.drawRectangle({
            x: gridX,
            y: gridY + 60,
            width: gridWidth,
            height: 20,
            borderColor: PDFLib.rgb(0, 0, 0),
            borderWidth: 2,
          });

          // Draw grid for USN
          page.drawRectangle({
            x: gridX,
            y: gridY + 40,
            width: gridWidth,
            height: 20,
            borderColor: PDFLib.rgb(0, 0, 0),
            borderWidth: 2,
          });

          // Draw grid for SECTION
          page.drawRectangle({
            x: gridX,
            y: gridY + 20,
            width: gridWidth,
            height: 20,
            borderColor: PDFLib.rgb(0, 0, 0),
            borderWidth: 2,
          });

          // Adding labels and user data
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

    // Saving and downloading the pdf
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
}
