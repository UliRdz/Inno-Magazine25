// PDF.js worker configuration
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

// Configuration - CHANGE THIS to your PDF path
const PDF_URL = './documents/magazine.pdf';

let pdfDoc = null;
let currentZoom = 1;
let totalPages = 0;
let renderedPages = {};

// Initialize the flipbook
async function initFlipbook() {
    try {
        // Load PDF
        const loadingTask = pdfjsLib.getDocument(PDF_URL);
        pdfDoc = await loadingTask.promise;
        totalPages = pdfDoc.numPages;
        
        console.log(`PDF loaded: ${totalPages} pages`);
        
        // Create flipbook structure
        const flipbook = document.getElementById('flipbook');
        flipbook.innerHTML = '';
        
        // Create pages
        for (let i = 1; i <= totalPages; i++) {
            const pageDiv = document.createElement('div');
            pageDiv.className = 'flipbook-page';
            pageDiv.id = `page-${i}`;
            flipbook.appendChild(pageDiv);
        }
        
        // Initialize Turn.js
        $('#flipbook').turn({
            width: 900,
            height: 600,
            autoCenter: true,
            acceleration: true,
            gradients: true,
            elevation: 50,
            when: {
                turning: function(event, page, view) {
                    renderVisiblePages(page);
                }
            }
        });
        
        // Render initial pages
        renderVisiblePages(1);
        
        updatePageInfo();
        setupControls();
        
    } catch (error) {
        console.error('Error loading PDF:', error);
        document.getElementById('flipbook').innerHTML = 
            '<div class="loading" style="color: #e74c3c;">Error loading PDF. Check console for details.</div>';
    }
}

// Render a specific page
async function renderPage(pageNum) {
    if (renderedPages[pageNum]) return;
    
    try {
        const page = await pdfDoc.getPage(pageNum);
        const viewport = page.getViewport({ scale: currentZoom * 1.5 });
        
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;
        
        await page.render({
            canvasContext: context,
            viewport: viewport
        }).promise;
        
        const pageDiv = document.getElementById(`page-${pageNum}`);
        pageDiv.innerHTML = '';
        pageDiv.appendChild(canvas);
        
        renderedPages[pageNum] = true;
        
    } catch (error) {
        console.error(`Error rendering page ${pageNum}:`, error);
    }
}

// Render visible pages and adjacent pages
function renderVisiblePages(currentPage) {
    const pagesToRender = [
        currentPage - 1,
        currentPage,
        currentPage + 1,
        currentPage + 2
    ].filter(p => p >= 1 && p <= totalPages);
    
    pagesToRender.forEach(pageNum => renderPage(pageNum));
}

// Update page info display
function updatePageInfo() {
    const currentPage = $('#flipbook').turn('page');
    document.getElementById('pageInfo').textContent = `Page ${currentPage} of ${totalPages}`;
    
    document.getElementById('prevBtn').disabled = currentPage === 1;
    document.getElementById('nextBtn').disabled = currentPage === totalPages;
}

// Setup control buttons
function setupControls() {
    document.getElementById('prevBtn').addEventListener('click', () => {
        $('#flipbook').turn('previous');
        updatePageInfo();
    });
    
    document.getElementById('nextBtn').addEventListener('click', () => {
        $('#flipbook').turn('next');
        updatePageInfo();
    });
    
    document.getElementById('zoomIn').addEventListener('click', () => {
        currentZoom = Math.min(currentZoom + 0.2, 3);
        updateZoom();
    });
    
    document.getElementById('zoomOut').addEventListener('click', () => {
        currentZoom = Math.max(currentZoom - 0.2, 0.5);
        updateZoom();
    });
    
    document.getElementById('fullscreen').addEventListener('click', () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
        } else {
            document.exitFullscreen();
        }
    });
    
    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowLeft') {
            $('#flipbook').turn('previous');
            updatePageInfo();
        } else if (e.key === 'ArrowRight') {
            $('#flipbook').turn('next');
            updatePageInfo();
        }
    });
}

// Update zoom level
function updateZoom() {
    document.getElementById('zoomLevel').textContent = `${Math.round(currentZoom * 100)}%`;
    renderedPages = {};
    const currentPage = $('#flipbook').turn('page');
    renderVisiblePages(currentPage);
}

// Initialize on page load
window.addEventListener('load', initFlipbook);