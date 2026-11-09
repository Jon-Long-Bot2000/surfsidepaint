const status = document.querySelector('#viewer-status');
const pages = document.querySelector('#pdf-pages');
const fallback = document.querySelector('#fallback');

try {
  const pdfjs = await import('./vendor/pdf.min.mjs');
  pdfjs.GlobalWorkerOptions.workerSrc = new URL('./vendor/pdf.worker.min.mjs', import.meta.url).href;
  const pdf = await pdfjs.getDocument({
    url: new URL('./1693Poli_Surfside_Proposal.pdf', import.meta.url).href,
    isEvalSupported: false,
  }).promise;

  for (let number = 1; number <= pdf.numPages; number++) {
    const page = await pdf.getPage(number);
    const pageElement = document.createElement('section');
    pageElement.className = 'pdf-page';
    pageElement.setAttribute('aria-label', `Proposal, page ${number} of ${pdf.numPages}`);
    const canvas = document.createElement('canvas');
    canvas.setAttribute('aria-hidden', 'true');
    pageElement.append(canvas);
    pages.append(pageElement);

    // Render at a fixed high resolution so text stays sharp on phones and desktops.
    const viewport = page.getViewport({ scale: 3 });
    canvas.width = Math.ceil(viewport.width);
    canvas.height = Math.ceil(viewport.height);
    await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;

    const content = await page.getTextContent();
    const accessibleText = document.createElement('p');
    accessibleText.className = 'screen-reader-text';
    accessibleText.textContent = content.items.map(item => item.str || '').join(' ');
    pageElement.append(accessibleText);
  }

  status.hidden = true;
} catch (error) {
  pages.replaceChildren();
  status.hidden = true;
  fallback.hidden = false;
  console.error('The PDF viewer could not load; showing the document preview.', error);
}
