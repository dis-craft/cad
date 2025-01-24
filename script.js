
const basePath = '/pdfs/';

// Dynamically load files for a selected set
function loadSetFiles(setName) {
  const fileListDiv = document.getElementById("fileList");
  fileListDiv.innerHTML = ""; // Clear previous files
  for (let i = 1; i <= 5; i++) {
    const filePath = `${basePath}${setName}/file${i}.pdf`;
    const fileCheckbox = `
      <div class="pdf-item">
        <input type="checkbox" value="${filePath}"> File ${i}
      </div>`;
    fileListDiv.innerHTML += fileCheckbox;
  }
}

async function generateCombinedPDF() {
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

  for (const fileUrl of selectedFiles) {
    try {
      const pdfBytes = await fetch(fileUrl).then(res => res.arrayBuffer());
      const pdfDoc = await PDFLib.PDFDocument.load(pdfBytes);

      // Copy pages and add grid to each page
      const pages = await mergedPdf.copyPages(pdfDoc, pdfDoc.getPageIndices());
      pages.forEach(page => {
        const { width, height } = page.getSize();

        // Grid dimensions and position
        const gridWidth = 150;
        const gridHeight = 60;
        const gridX = width - gridWidth - 10; // Right edge
        const gridY = 20; // Bottom edge

        // Draw grid for NAME
        page.drawRectangle({
          x: gridX,
          y: gridY + 60, // Position below NAME
          width: gridWidth,
          height: 20,
          borderColor: PDFLib.rgb(0, 0, 0),
          borderWidth: 2,
        });

        // Draw grid for USN
        page.drawRectangle({
          x: gridX,
          y: gridY + 40, // Position above SECTION
          width: gridWidth,
          height: 20,
          borderColor: PDFLib.rgb(0, 0, 0),
          borderWidth: 2,
        });

        // Draw grid for SECTION
        page.drawRectangle({
          x: gridX,
          y: gridY + 20, // Position below the first grid
          width: gridWidth,
          height: 20,
          borderColor: PDFLib.rgb(0, 0, 0),
          borderWidth: 2,
        });

        // Adding labels and user data with "SECTION" in quotes...
        page.drawText(`NAME: ${name}`, { x: gridX + 5, y: gridY + 65, size: 10 });
        page.drawText(`USN: ${usn}`, { x: gridX + 5, y: gridY + 45, size: 10 });
        page.drawText(`SECTION: "${section}"`, { x: gridX + 5, y: gridY + 25, size: 10 });

        mergedPdf.addPage(page);
      });
    } catch (error) {
      console.error(`Error processing file: ${fileUrl}`, error);
    }
  }

  // Saving nd downloading the pdf
  const pdfBytes = await mergedPdf.save();
  const blob = new Blob([pdfBytes], { type: "application/pdf" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `${name}_${usn}_Combined.pdf`;
  link.click();
}
