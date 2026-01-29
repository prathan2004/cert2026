document.addEventListener('DOMContentLoaded', () => {
    // -------------------------------------------------------------------------
    // 🟠 ส่วนตั้งค่า: ใส่ลิงก์ Google Sheet ที่ Publish เป็น CSV ตรงนี้
    // -------------------------------------------------------------------------
    // วิธีหาลิงก์:
    // 1. ไปที่ไฟล์ Google Sheet ของคุณ
    // 2. เมนู "ไฟล์" (File) > "แชร์" (Share) > "เผยแพร่ไปยังเว็บ" (Publish to web)
    // 3. ตรง "ทั้งเอกสาร" ให้เลือกเฉพาะแผ่นงานที่ต้องการ (เช่น Sheet1)
    // 4. ตรง "เว็บเพจ" ให้เปลี่ยนเป็น "ค่าที่คั่นด้วยเครื่องหมายจุลภาค (.csv)"
    // 5. กดปุ่ม "เผยแพร่" (Publish) แล้วคัดลอกลิงก์มาวางด้านล่างนี้

    const GOOGLE_SHEET_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vRTqpvcgikcMG4YrRGJDN-q25OZ59GAnlKt30VfynFbV_EethjS32ExsknyV25N7xGudBnbJ4So7WmJ/pub?gid=0&single=true&output=csv";

    // -------------------------------------------------------------------------

    const searchInput = document.getElementById('searchInput');
    const resultsArea = document.getElementById('resultsArea');
    let certificates = [];

    // Validation
    if (GOOGLE_SHEET_CSV_URL.includes("...")) {
        showError("กรุณาแก้ไขไฟล์ assets/js/script.js เพื่อใส่ลิงก์ Google Sheet CSV ของท่าน");
        return;
    }

    // 1. Fetch and Parse Data from Google Sheet
    fetch(GOOGLE_SHEET_CSV_URL)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.text();
        })
        .then(csvText => {
            parseCSV(csvText);
        })
        .catch(error => {
            console.error('Error fetching data:', error);
            showError(`
                <span class="fw-bold">ไม่สามารถดึงข้อมูลจาก Google Sheet ได้</span><br>
                <small class="text-muted" style="font-size: 0.85rem;">
                    หากท่านเปิดไฟล์ HTML โดยตรง (file://) อาจติดปัญหาความปลอดภัย (CORS)<br>
                    แนะนำให้เปิดผ่าน <strong>Live Server</strong> ใน VS Code
                </small>
            `);
        });

    function parseCSV(text) {
        // Simple CSV parser that handles basic Google Sheet output
        // Assuming NO commas inside the cell data for simplicity, or simple split
        // For production, a robust regex CSV parser is recommended, but split('\n') is usually fine for this use case if data is clean.

        const lines = text.trim().split(/\r?\n/); // Handle both CRLF and LF

        // Remove Header row (Assuming Row 1 is Header: Name, Filename)
        const dataLines = lines.slice(1);

        certificates = dataLines
            .map(line => {
                // Handle quoted cells from Google Sheets (e.g. "Name, Surname", filename.pdf)
                // This regex splits by comma but ignores commas inside quotes
                const parts = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);

                if (parts.length >= 2) {
                    // Remove quotes if present
                    const name = parts[0].replace(/^"|"$/g, '').trim();
                    const filename = parts[1].replace(/^"|"$/g, '').trim();

                    return { name, filename };
                }
                return null;
            })
            .filter(item => item !== null && item.name !== "");

        console.log(`Loaded ${certificates.length} certificates.`);
    }

    // Helper to show error
    function showError(message) {
        resultsArea.innerHTML = `
            <div class="text-center text-danger py-4 state-error">
                <i class="bi bi-exclamation-triangle fs-1 d-block mb-2 text-danger"></i>
                <span>${message}</span>
            </div>`;
    }

    // 2. Search Logic
    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.trim().toLowerCase();
        renderResults(query);
    });

    function renderResults(query) {
        resultsArea.innerHTML = '';

        if (query.length === 0) {
            resultsArea.innerHTML = `
                <div class="text-center text-muted py-4 state-empty">
                    <i class="bi bi-person-badge fs-1 d-block mb-2 opacity-50"></i>
                    <span>กรุณาพิมพ์ชื่อเพื่อค้นหา</span>
                </div>`;
            return;
        }

        const matches = certificates.filter(cert =>
            cert.name.toLowerCase().includes(query)
        );

        if (matches.length === 0) {
            resultsArea.innerHTML = `
                <div class="text-center text-muted py-4 state-no-results">
                    <i class="bi bi-search fs-1 d-block mb-2 opacity-50"></i>
                    <span>ไม่พบข้อมูลสำหรับ "${query}"</span>
                </div>`;
            return;
        }

        matches.forEach(cert => {
            const card = document.createElement('div');
            card.className = 'result-item d-flex justify-content-between align-items-center';

            // Generate link (assuming PDF is still local in 'certificates' folder)
            // If PDF link comes from Sheet, change this logic.
            // For now, assuming current requirement: Sheet has Filename, File is local/hosted.
            const fileLink = `certificates/${cert.filename}`;

            card.innerHTML = `
                <div>
                    <h5 class="mb-1 text-primary fw-bold">${cert.name}</h5>
                    <small class="text-muted"><i class="bi bi-file-earmark-pdf me-1"></i>${cert.filename}</small>
                </div>
                <a href="${fileLink}" target="_blank" class="btn-download shadow-sm" download>
                    <i class="bi bi-download me-2"></i>ดาวน์โหลด
                </a>
            `;
            resultsArea.appendChild(card);
        });
    }
});
