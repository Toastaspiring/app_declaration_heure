document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const monthSelect = document.getElementById('month');
    const yearInput = document.getElementById('year');
    const generateBtn = document.getElementById('generate-btn');
    const downloadBtn = document.getElementById('download-btn');
    const timesheetContainer = document.getElementById('timesheet-container');
    const summarySection = document.getElementById('summary-section');
    const monthlyTotalEl = document.getElementById('monthly-total');
    const employeeNameInput = document.getElementById('employee-name');
    const companyNameInput = document.getElementById('company-name');
    const loader = document.getElementById('loader');

    // --- Constants for Local Storage ---
    const DRAFT_STORAGE_KEY = 'timesheetDraft';
    const PATTERN_STORAGE_KEY = 'timesheetHourPattern';

    // --- Local Storage Utilities ---
    const getFromStorage = (key) => {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : null;
    };

    const saveToStorage = (key, data) => {
        localStorage.setItem(key, JSON.stringify(data));
    };

    // --- Core Application Logic ---

    const initDateSelector = () => {
        const months = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];
        const now = new Date();
        const currentMonth = draft ? parseInt(draft.month) : now.getMonth() + 1;
        monthSelect.innerHTML = months.map((month, index) =>
            `<option value="${index + 1}" ${currentMonth === (index + 1) ? 'selected' : ''}>${month}</option>`
        ).join('');
        yearInput.value = draft ? draft.year : now.getFullYear();
    };

    const generateTable = (draftData = null) => {
        const month = parseInt(monthSelect.value);
        const year = parseInt(yearInput.value);
        if (!month || !year) return;

        const daysInMonth = new Date(year, month, 0).getDate();
        const hourPattern = getFromStorage(PATTERN_STORAGE_KEY) || { startTime: '09:00', endTime: '17:00', break: '60' };

        let tableHTML = `
            <h2 class="text-2xl font-semibold mb-4 text-center">Fiche d'heures pour ${monthSelect.options[monthSelect.selectedIndex].text} ${year}</h2>
            <table class="w-full text-sm text-left text-gray-500 border-collapse border border-gray-300">
                <thead class="text-xs text-gray-700 uppercase bg-gray-100">
                    <tr>
                        <th class="px-4 py-3 border border-gray-300">Date</th>
                        <th class="px-4 py-3 border border-gray-300">Jour</th>
                        <th class="px-4 py-3 border border-gray-300">Début</th>
                        <th class="px-4 py-3 border border-gray-300">Fin</th>
                        <th class="px-4 py-3 border border-gray-300">Pause (min)</th>
                        <th class="px-4 py-3 border border-gray-300 text-right">Total Jour</th>
                    </tr>
                </thead>
                <tbody id="timesheet-body">`;

        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, month - 1, day);
            const dayOfWeek = date.toLocaleDateString('fr-FR', { weekday: 'long' });
            const isWeekend = date.getDay() === 0 || date.getDay() === 6;

            const draftDay = draftData?.table ? draftData.table.find(d => d.day === day) : null;

            const startTime = draftDay ? draftDay.startTime : (isWeekend ? '' : hourPattern.startTime);
            const endTime = draftDay ? draftDay.endTime : (isWeekend ? '' : hourPattern.endTime);
            const breakTime = draftDay ? draftDay.break : (isWeekend ? '0' : hourPattern.break);

            tableHTML += `
                <tr class="data-row ${isWeekend ? 'bg-gray-50' : 'bg-white'}" data-day="${day}" data-is-weekend="${isWeekend}">
                    <td class="px-4 py-2 border border-gray-300 font-medium">${date.toLocaleDateString('fr-FR')}</td>
                    <td class="px-4 py-2 border border-gray-300 capitalize">${dayOfWeek}</td>
                    <td class="px-4 py-2 border border-gray-300"><input type="time" value="${startTime}" class="w-full bg-transparent p-1 rounded"></td>
                    <td class="px-4 py-2 border border-gray-300"><input type="time" value="${endTime}" class="w-full bg-transparent p-1 rounded"></td>
                    <td class="px-4 py-2 border border-gray-300"><input type="number" min="0" value="${breakTime}" class="w-20 bg-transparent p-1 rounded"></td>
                    <td class="px-4 py-2 border border-gray-300 text-right font-bold daily-total">0.00 h</td>
                </tr>`;
        }

        tableHTML += '</tbody></table>';
        timesheetContainer.innerHTML = tableHTML;
        summarySection.classList.remove('hidden');

        document.getElementById('timesheet-body').addEventListener('input', handleTableInput);
        updateTotals();
    };

    const handleTableInput = (event) => {
        updateTotals();
        const row = event.target.closest('.data-row');
        if (row && row.dataset.isWeekend === 'false') {
            const inputs = row.querySelectorAll('input');
            const newPattern = { startTime: inputs[0].value, endTime: inputs[1].value, break: inputs[2].value };
            saveToStorage(PATTERN_STORAGE_KEY, newPattern);
        }
    };

    const updateTotals = () => {
        let monthlyTotalMinutes = 0;
        const rows = document.querySelectorAll('#timesheet-body .data-row');

        rows.forEach(row => {
            const inputs = row.querySelectorAll('input');
            const startTime = inputs[0].value;
            const endTime = inputs[1].value;
            const breakMinutes = parseInt(inputs[2].value) || 0;
            const dailyTotalEl = row.querySelector('.daily-total');

            let dailyMinutes = 0;
            if (startTime && endTime) {
                const start = new Date(`1970-01-01T${startTime}:00`);
                const end = new Date(`1970-01-01T${endTime}:00`);
                if (end > start) {
                    dailyMinutes = (end - start) / 60000 - breakMinutes;
                }
            }

            dailyMinutes = Math.max(0, dailyMinutes);
            monthlyTotalMinutes += dailyMinutes;
            dailyTotalEl.textContent = `${(dailyMinutes / 60).toFixed(2)} h`;
        });

        monthlyTotalEl.textContent = `${(monthlyTotalMinutes / 60).toFixed(2)} h`;
        saveDraft();
    };

    const saveDraft = () => {
        if (document.querySelectorAll('#timesheet-body .data-row').length === 0) return;
        const tableData = Array.from(document.querySelectorAll('#timesheet-body .data-row')).map(row => {
            const inputs = row.querySelectorAll('input');
            return {
                day: parseInt(row.dataset.day),
                startTime: inputs[0].value,
                endTime: inputs[1].value,
                break: inputs[2].value
            };
        });
        const draft = {
            employeeName: employeeNameInput.value,
            companyName: companyNameInput.value,
            month: monthSelect.value,
            year: yearInput.value,
            table: tableData
        };
        saveToStorage(DRAFT_STORAGE_KEY, draft);
    };

    const loadDraft = () => {
        const draft = getFromStorage(DRAFT_STORAGE_KEY);
        if (draft) {
            employeeNameInput.value = draft.employeeName;
            companyNameInput.value = draft.companyName;
            return draft;
        }
        return null;
    };

    const downloadPDF = () => {
        loader.style.display = 'flex';
        downloadBtn.disabled = true;

        try {
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();

            const employeeName = employeeNameInput.value || "Non spécifié";
            const companyName = companyNameInput.value || "Non spécifié";
            const monthText = monthSelect.options[monthSelect.selectedIndex].text;
            const year = yearInput.value;
            const monthlyTotal = monthlyTotalEl.textContent;

            // --- PDF Header ---
            doc.setFontSize(20);
            doc.text(companyName, 14, 22);
            doc.setFontSize(12);
            doc.text(employeeName, 14, 30);

            doc.setFontSize(14);
            doc.text(`Fiche d'heures - ${monthText} ${year}`, 196, 22, { align: 'right' });

            // --- PDF Table ---
            const tableData = Array.from(document.querySelectorAll('#timesheet-body .data-row')).map(row => {
                const cells = row.querySelectorAll('td');
                const inputs = row.querySelectorAll('input');
                return [
                    cells[0].textContent,
                    cells[1].textContent,
                    inputs[0].value || '-',
                    inputs[1].value || '-',
                    inputs[2].value,
                    cells[5].textContent,
                ];
            });

            doc.autoTable({
                head: [['Date', 'Jour', 'Début', 'Fin', 'Pause (min)', 'Total Jour']],
                body: tableData,
                startY: 40,
                theme: 'grid',
                headStyles: { fillColor: [230, 230, 230], textColor: 40 },
                styles: { fontSize: 9, cellPadding: 2 },
                columnStyles: {
                    5: { halign: 'right' }
                }
            });

            // --- PDF Footer ---
            const finalY = doc.autoTable.previous.finalY;
            doc.setFontSize(12);
            doc.setFont('helvetica', 'bold');
            doc.text(`Total Mensuel: ${monthlyTotal}`, 196, finalY + 10, { align: 'right' });

            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            doc.setLineWidth(0.5);

            const signatureY = finalY + 40;
            doc.line(20, signatureY, 80, signatureY);
            doc.text("Signature de l'employé(e)", 50, signatureY + 5, { align: 'center' });

            doc.line(130, signatureY, 190, signatureY);
            doc.text("Signature de l'employeur", 160, signatureY + 5, { align: 'center' });

            // --- Save PDF ---
            doc.save(`fiche-heures-${employeeName.replace(/\s/g, '_')}-${monthText}-${year}.pdf`);

        } catch (error) {
            console.error("Erreur lors de la génération du PDF:", error);
            alert("Une erreur est survenue. Vérifiez la console pour plus de détails.");
        } finally {
            loader.style.display = 'none';
            downloadBtn.disabled = false;
        }
    };

    // --- Initialisation ---
    const draft = loadDraft();
    initDateSelector();
    if (draft) {
        generateTable(draft);
    }

    // --- Event Listeners ---
    generateBtn.addEventListener('click', () => {
        // Clear draft when generating a new clean sheet
        localStorage.removeItem(DRAFT_STORAGE_KEY);
        // Reset name fields if they were from a draft
        const pattern = getFromStorage(PATTERN_STORAGE_KEY);
        if (!pattern) { // Only clear names if no pattern is set, to avoid clearing user input
            employeeNameInput.value = '';
            companyNameInput.value = '';
        }
        generateTable();
    });
    downloadBtn.addEventListener('click', downloadPDF);
    employeeNameInput.addEventListener('input', saveDraft);
    companyNameInput.addEventListener('input', saveDraft);
    monthSelect.addEventListener('change', saveDraft);
    yearInput.addEventListener('change', saveDraft);
});
