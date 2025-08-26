document.addEventListener('DOMContentLoaded', () => {
    console.log("Application Initializing...");

    // --- DOM Elements ---
    const monthSelect = document.getElementById('month');
    const yearInput = document.getElementById('year');
    const generateBtn = document.getElementById('generate-btn');
    const downloadBtn = document.getElementById('download-btn');
    const timesheetContainer = document.getElementById('timesheet-container');
    const actionsSection = document.getElementById('actions-section');
    const employeeNameInput = document.getElementById('employee-name');
    const companyNameInput = document.getElementById('company-name');
    const loader = document.getElementById('loader');

    const signatureModal = document.getElementById('signature-modal');
    const openSignatureModalBtn = document.getElementById('open-signature-modal-btn');
    const closeSignatureModalBtn = document.getElementById('close-signature-modal-btn');
    const employeeSignatureCanvas = document.getElementById('employee-signature-canvas');
    const employerSignatureCanvas = document.getElementById('employer-signature-canvas');
    const clearEmployeeSignatureBtn = document.getElementById('clear-employee-signature');
    const clearEmployerSignatureBtn = document.getElementById('clear-employer-signature');

    // --- State ---
    let employeeSignaturePad, employerSignaturePad;

    // --- Constants ---
    const DRAFT_STORAGE_KEY = 'timesheetDraft';
    const PATTERN_STORAGE_KEY = 'timesheetHourPattern';

    // --- Utilities ---
    const getFromStorage = (key) => {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error(`Error reading from localStorage for key: ${key}`, error);
            return null;
        }
    };
    const saveToStorage = (key, data) => {
        try {
            localStorage.setItem(key, JSON.stringify(data));
        } catch (error) {
            console.error(`Error saving to localStorage for key: ${key}`, error);
        }
    };

    // --- Signature Pad Logic ---
    const initializeSignaturePads = () => {
        console.log("Initializing signature pads...");
        try {
            const adjustCanvas = (canvas) => {
                const ratio = Math.max(window.devicePixelRatio || 1, 1);
                canvas.width = canvas.offsetWidth * ratio;
                canvas.height = canvas.offsetHeight * ratio;
                canvas.getContext("2d").scale(ratio, ratio);
            };
            adjustCanvas(employeeSignatureCanvas);
            adjustCanvas(employerSignatureCanvas);
            employeeSignaturePad = new SignaturePad(employeeSignatureCanvas, { backgroundColor: 'rgb(255, 255, 255)' });
            employerSignaturePad = new SignaturePad(employerSignatureCanvas, { backgroundColor: 'rgb(255, 255, 255)' });

            const draft = getFromStorage(DRAFT_STORAGE_KEY);
            if (draft?.signatures) {
                console.log("Found existing signatures in draft, loading them.");
                if(draft.signatures.employee) employeeSignaturePad.fromDataURL(draft.signatures.employee);
                if(draft.signatures.employer) employerSignaturePad.fromDataURL(draft.signatures.employer);
            }

            employeeSignaturePad.onEnd = () => { console.log("Employee signature updated."); saveSignaturesToDraft(); };
            employerSignaturePad.onEnd = () => { console.log("Employer signature updated."); saveSignaturesToDraft(); };
            console.log("Signature pads initialized successfully.");
        } catch(error) {
            console.error("Failed to initialize signature pads.", error);
            alert("Erreur: Impossible d'initialiser le module de signature.");
        }
    };

    const saveSignaturesToDraft = () => {
        console.log("Saving signatures to draft...");
        const draft = getFromStorage(DRAFT_STORAGE_KEY) || {};
        draft.signatures = {
            employee: employeeSignaturePad.isEmpty() ? null : employeeSignaturePad.toDataURL(),
            employer: employerSignaturePad.isEmpty() ? null : employerSignaturePad.toDataURL()
        };
        saveToStorage(DRAFT_STORAGE_KEY, draft);
    };

    openSignatureModalBtn.addEventListener('click', () => signatureModal.style.display = 'flex');
    closeSignatureModalBtn.addEventListener('click', () => signatureModal.style.display = 'none');
    clearEmployeeSignatureBtn.addEventListener('click', () => { employeeSignaturePad.clear(); saveSignaturesToDraft(); });
    clearEmployerSignatureBtn.addEventListener('click', () => { employerSignaturePad.clear(); saveSignaturesToDraft(); });

    // --- Core Application Logic ---
    const initDateSelector = () => {
        const months = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];
        const now = new Date();
        const draft = getFromStorage(DRAFT_STORAGE_KEY);
        const currentMonth = draft ? parseInt(draft.month) : now.getMonth() + 1;
        monthSelect.innerHTML = months.map((month, index) => `<option value="${index + 1}" ${currentMonth === (index + 1) ? 'selected' : ''}>${month}</option>`).join('');
        yearInput.value = draft ? draft.year : now.getFullYear();
    };

    const generateTable = (draftData = null) => {
        const month = parseInt(monthSelect.value);
        const year = parseInt(yearInput.value);
        console.log(`Generating table for ${month}/${year}.`);
        if (!month || !year) {
            console.error("Cannot generate table: month or year is not set.");
            return;
        }

        const daysInMonth = new Date(year, month, 0).getDate();
        const hourPattern = getFromStorage(PATTERN_STORAGE_KEY) || { startTime: '09:00', endTime: '17:00', break: '60' };
        if (!draftData) console.log("No draft data provided, using default hour pattern.", hourPattern);

        let tableHTML = `<h2 class="text-2xl font-semibold mb-4 text-center">Fiche d'heures pour ${monthSelect.options[monthSelect.selectedIndex].text} ${year}</h2><table class="w-full text-sm text-left text-gray-500 border-collapse border border-gray-300"><thead class="text-xs text-gray-700 uppercase bg-gray-100"><tr><th class="px-4 py-3 border border-gray-300">Date</th><th class="px-4 py-3 border border-gray-300">Jour</th><th class="px-4 py-3 border border-gray-300">Début</th><th class="px-4 py-3 border border-gray-300">Fin</th><th class="px-4 py-3 border border-gray-300">Pause (min)</th><th class="px-4 py-3 border border-gray-300 text-right">Total Jour</th></tr></thead><tbody id="timesheet-body">`;

        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, month - 1, day);
            const dayOfWeek = date.toLocaleDateString('fr-FR', { weekday: 'long' });
            const isWeekend = date.getDay() === 0 || date.getDay() === 6;
            const draftDay = draftData?.table?.find(d => d.day === day);
            const startTime = draftDay ? draftDay.startTime : (isWeekend ? '' : hourPattern.startTime);
            const endTime = draftDay ? draftDay.endTime : (isWeekend ? '' : hourPattern.endTime);
            const breakTime = draftDay ? draftDay.break : (isWeekend ? '0' : hourPattern.break);
            tableHTML += `<tr class="data-row ${isWeekend ? 'bg-gray-50' : 'bg-white'}" data-day="${day}" data-is-weekend="${isWeekend}"><td class="px-4 py-2 border border-gray-300 font-medium">${date.toLocaleDateString('fr-FR')}</td><td class="px-4 py-2 border border-gray-300 capitalize">${dayOfWeek}</td><td class="px-4 py-2 border border-gray-300"><input type="time" value="${startTime}" class="w-full bg-transparent p-1 rounded"></td><td class="px-4 py-2 border border-gray-300"><input type="time" value="${endTime}" class="w-full bg-transparent p-1 rounded"></td><td class="px-4 py-2 border border-gray-300"><input type="number" min="0" value="${breakTime}" class="w-20 bg-transparent p-1 rounded"></td><td class="px-4 py-2 border border-gray-300 text-right font-bold daily-total">0.00 h</td></tr>`;
            if (date.getDay() === 0 || day === daysInMonth) {
                tableHTML += `<tr class="weekly-total-row bg-gray-200 font-bold"><td colspan="5" class="px-4 py-2 border border-gray-300 text-right">Total Semaine</td><td class="px-4 py-2 border border-gray-300 text-right weekly-total">0.00 h</td></tr>`;
            }
        }

        tableHTML += '</tbody></table>';
        timesheetContainer.innerHTML = tableHTML;
        actionsSection.classList.remove('hidden');
        document.getElementById('timesheet-body').addEventListener('input', handleTableInput);
        updateTotals();
    };

    const handleTableInput = (event) => {
        updateTotals();
        const row = event.target.closest('.data-row');
        if (row && row.dataset.isWeekend === 'false') {
            console.log("Weekday hour pattern changed, updating in storage.");
            const inputs = row.querySelectorAll('input');
            const newPattern = { startTime: inputs[0].value, endTime: inputs[1].value, break: inputs[2].value };
            saveToStorage(PATTERN_STORAGE_KEY, newPattern);
        }
    };

    const updateTotals = () => {
        console.log("Calculating totals...");
        let weeklyMinutes = 0;
        document.querySelectorAll('#timesheet-body tr').forEach(row => {
            if (row.classList.contains('data-row')) {
                const inputs = row.querySelectorAll('input');
                const startTime = inputs[0].value, endTime = inputs[1].value;
                const breakMinutes = parseInt(inputs[2].value) || 0;
                let dailyMinutes = 0;
                if (startTime && endTime) {
                    const start = new Date(`1970-01-01T${startTime}:00`);
                    const end = new Date(`1970-01-01T${endTime}:00`);
                    if (end > start) dailyMinutes = (end - start) / 60000 - breakMinutes;
                }
                dailyMinutes = Math.max(0, dailyMinutes);
                weeklyMinutes += dailyMinutes;
                row.querySelector('.daily-total').textContent = `${(dailyMinutes / 60).toFixed(2)} h`;
            } else if (row.classList.contains('weekly-total-row')) {
                row.querySelector('.weekly-total').textContent = `${(weeklyMinutes / 60).toFixed(2)} h`;
                weeklyMinutes = 0;
            }
        });
        saveDraft();
    };

    const saveDraft = () => {
        console.log("Saving draft to localStorage...");
        if (document.querySelectorAll('#timesheet-body .data-row').length === 0) {
            console.log("No data rows to save, skipping draft save.");
            return;
        }
        const draft = getFromStorage(DRAFT_STORAGE_KEY) || {};
        draft.employeeName = employeeNameInput.value;
        draft.companyName = companyNameInput.value;
        draft.month = monthSelect.value;
        draft.year = yearInput.value;
        draft.table = Array.from(document.querySelectorAll('#timesheet-body .data-row')).map(row => {
            const inputs = row.querySelectorAll('input');
            return { day: parseInt(row.dataset.day), startTime: inputs[0].value, endTime: inputs[1].value, break: inputs[2].value };
        });
        saveToStorage(DRAFT_STORAGE_KEY, draft);
    };

    const loadDraft = () => {
        console.log("Attempting to load draft from localStorage...");
        const draft = getFromStorage(DRAFT_STORAGE_KEY);
        if (draft) {
            console.log("Draft found.", draft);
            employeeNameInput.value = draft.employeeName || '';
            companyNameInput.value = draft.companyName || '';
            return draft;
        }
        console.log("No draft found.");
        return null;
    };

    const downloadPDF = () => {
        console.log("Starting PDF generation...");
        loader.style.display = 'flex';
        downloadBtn.disabled = true;

        try {
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();
            const employeeName = employeeNameInput.value || "Non spécifié";
            const companyName = companyNameInput.value || "Non spécifié";
            const monthText = monthSelect.options[monthSelect.selectedIndex].text;
            const year = yearInput.value;
            doc.setFontSize(20);
            doc.text(companyName, 14, 22);
            doc.setFontSize(12);
            doc.text(employeeName, 14, 30);
            doc.setFontSize(14);
            doc.text(`Fiche d'heures - ${monthText} ${year}`, 196, 22, { align: 'right' });

            const tableData = Array.from(document.querySelectorAll('#timesheet-body tr')).map(row => {
                if (row.classList.contains('data-row')) {
                    const cells = row.querySelectorAll('td');
                    const inputs = row.querySelectorAll('input');
                    return [cells[0].textContent, cells[1].textContent, inputs[0].value || '-', inputs[1].value || '-', inputs[2].value, cells[5].textContent];
                } else if (row.classList.contains('weekly-total-row')) {
                    const cells = row.querySelectorAll('td');
                    const total = cells[1] ? cells[1].textContent : '0.00 h'; // Get total from the correct cell
                    return { content: `Total Semaine: ${total}`, styles: { halign: 'right', fontStyle: 'bold' } };
                }
            }).filter(Boolean);

            doc.autoTable({
                head: [['Date', 'Jour', 'Début', 'Fin', 'Pause (min)', 'Total Jour']],
                body: tableData,
                startY: 40,
                theme: 'grid',
                headStyles: { fillColor: [230, 230, 230], textColor: 40 },
                styles: { fontSize: 9, cellPadding: 2 },
                columnStyles: { 5: { halign: 'right' } },
                didParseCell: function(data) {
                    if (data.row.raw.content) {
                        data.cell.styles.fillColor = '#E5E7EB';
                        data.cell.styles.fontStyle = 'bold';
                        data.cell.styles.halign = 'right';
                        data.cell.colSpan = 6;
                        data.cell.text = [data.row.raw.content];
                    }
                }
            });

            const finalY = doc.autoTable.previous.finalY;
            const signatureY = finalY + 15;
            const draft = getFromStorage(DRAFT_STORAGE_KEY);
            if (draft?.signatures) {
                if (draft.signatures.employee) doc.addImage(draft.signatures.employee, 'PNG', 20, signatureY, 60, 30);
                if (draft.signatures.employer) doc.addImage(draft.signatures.employer, 'PNG', 130, signatureY, 60, 30);
            }

            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            doc.setLineWidth(0.5);
            doc.line(20, signatureY + 30, 80, signatureY + 30);
            doc.text("Signature de l'employé(e)", 50, signatureY + 35, { align: 'center' });
            doc.line(130, signatureY + 30, 190, signatureY + 30);
            doc.text("Signature de l'employeur", 160, signatureY + 35, { align: 'center' });

            doc.save(`fiche-heures-${employeeName.replace(/\s/g, '_')}-${monthText}-${year}.pdf`);
            console.log("PDF generated and saved successfully.");
        } catch (error) {
            console.error("Error during PDF generation:", error);
            alert("Une erreur est survenue lors de la génération du PDF. Vérifiez la console pour plus de détails.");
        } finally {
            loader.style.display = 'none';
            downloadBtn.disabled = false;
        }
    };

    // --- Initialisation ---
    const draft = loadDraft();
    initDateSelector();
    initializeSignaturePads();
    if (draft && draft.table && draft.table.length > 0) {
        console.log("Generating table from existing draft data.");
        generateTable(draft);
    }

    // --- Event Listeners ---
    generateBtn.addEventListener('click', () => {
        console.log("'Générer le tableau' button clicked.");
        const draft = getFromStorage(DRAFT_STORAGE_KEY);
        if (draft) {
            draft.table = [];
            saveToStorage(DRAFT_STORAGE_KEY, draft);
        }
        generateTable();
    });
    downloadBtn.addEventListener('click', downloadPDF);
    employeeNameInput.addEventListener('input', saveDraft);
    companyNameInput.addEventListener('input', saveDraft);
    monthSelect.addEventListener('change', saveDraft);
    yearInput.addEventListener('change', saveDraft);

    console.log("Application fully initialized and event listeners attached.");
});
