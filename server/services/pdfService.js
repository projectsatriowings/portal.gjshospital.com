import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { getTranslationsDict } from './translationService.js';

const uploadsPdfDir = path.join(process.cwd(), 'uploads', 'pdf');
if (!fs.existsSync(uploadsPdfDir)) {
  fs.mkdirSync(uploadsPdfDir, { recursive: true });
}

// Helper to strip non-latin1 / non-standard font chars for standard PDFKit Helvetica
function cleanPdfText(text) {
  if (!text) return '';
  return String(text)
    .replace(/[^\x00-\x7F]/g, ' ') // Strip non-ASCII/Emoji for standard PDFKit fonts
    .replace(/\s+/g, ' ')
    .trim();
}

// 1. Generate Compact A5 Printed Appointment Slip PDF
export async function generateAppointmentSlipPdf(app) {
  const dict = await getTranslationsDict();
  const fileName = `slip-${app.id}-${Date.now()}.pdf`;
  const filePath = path.join(uploadsPdfDir, fileName);
  const pdfUrl = `/uploads/pdf/${fileName}`;

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A5', margin: 20 });
    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    // HEADER BANNER
    doc.rect(20, 20, doc.page.width - 40, 50).fill('#0f172a');
    doc.fillColor('#ffffff').fontSize(16).font('Helvetica-Bold')
       .text(cleanPdfText(dict.hospital_name || 'G.J.S Multi-Speciality Hospital'), 30, 30, { align: 'center' });
    doc.fontSize(10).font('Helvetica')
       .text(cleanPdfText(dict.appointment_slip || 'OPD Appointment Slip'), 30, 52, { align: 'center' });

    // VERY LARGE BOLD TOKEN NUMBER (Dominant element)
    doc.rect(40, 85, doc.page.width - 80, 60).fill('#0284c7');
    doc.fillColor('#ffffff').fontSize(11).font('Helvetica-Bold')
       .text(cleanPdfText(dict.token_number || 'TOKEN NUMBER').toUpperCase(), 40, 95, { align: 'center' });
    doc.fontSize(32).font('Helvetica-Bold')
       .text(`Token #${cleanPdfText(app.token_number || 'N/A')}`, 40, 110, { align: 'center' });

    // APPOINTMENT DETAILS
    doc.fillColor('#0f172a').fontSize(12).font('Helvetica-Bold')
       .text(`${cleanPdfText(dict.patient_name || 'Patient')}: ${cleanPdfText(app.patient_name)}`, 30, 160);
    doc.fontSize(12).font('Helvetica-Bold')
       .text(`${cleanPdfText(dict.doctor || 'Doctor')}: ${cleanPdfText(app.doctor_name || 'Assigned Specialist')}`, 30, 180);
    doc.fontSize(11).font('Helvetica')
       .text(`${cleanPdfText(dict.department || 'Department')}: ${cleanPdfText(app.department_name || app.department || 'General Medicine')}`, 30, 200);

    const dateStr = new Date(app.appointment_date || app.preferred_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    doc.text(`${cleanPdfText(dict.date || 'Date')}: ${dateStr}`, 30, 220);
    doc.text(`${cleanPdfText(dict.time || 'Time')}: ${cleanPdfText(app.preferred_time || '10:00 AM')}`, 30, 240);

    // INSTRUCTION BOX
    doc.rect(30, 270, doc.page.width - 60, 55).fillAndStroke('#f8fafc', '#cbd5e1');
    doc.fillColor('#1e293b').fontSize(10).font('Helvetica-Bold')
       .text(cleanPdfText(dict.instructions_title || 'Instructions'), 40, 278);
    doc.fontSize(9.5).font('Helvetica')
       .text(cleanPdfText(dict.instructions_arrive_early || 'Please arrive 15 minutes prior to your preferred time slot.'), 40, 294, { width: doc.page.width - 80 });

    // FOOTER HELPDESK NUMBER
    doc.rect(20, doc.page.height - 50, doc.page.width - 40, 30).fill('#0f172a');
    doc.fillColor('#38bdf8').fontSize(11).font('Helvetica-Bold')
       .text(`${cleanPdfText(dict.contact_hospital || 'Helpdesk')}: +91 94431 23456`, 30, doc.page.height - 40, { align: 'center' });

    doc.end();

    stream.on('finish', () => resolve(pdfUrl));
    stream.on('error', (err) => reject(err));
  });
}

// 2. Generate Prescription PDF
export async function generatePrescriptionPdf(prescription, medicines = [], patient = {}, doctor = {}) {
  const dict = await getTranslationsDict();
  const fileName = `prescription-${prescription.id}-${Date.now()}.pdf`;
  const filePath = path.join(uploadsPdfDir, fileName);
  const pdfUrl = `/uploads/pdf/${fileName}`;

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 35 });
    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    // LETTERHEAD
    doc.rect(35, 35, doc.page.width - 70, 60).fill('#0f172a');
    doc.fillColor('#ffffff').fontSize(18).font('Helvetica-Bold')
       .text(cleanPdfText(dict.hospital_name || 'G.J.S Multi-Speciality Hospital'), 45, 48);
    doc.fontSize(10).font('Helvetica')
       .text('24x7 Multi-Speciality Care | Ph: +91 94431 23456', 45, 72);

    doc.fillColor('#0284c7').fontSize(16).font('Helvetica-Bold')
       .text('Rx', doc.page.width - 80, 52);

    // PATIENT & DOCTOR INFO BOX
    doc.rect(35, 110, doc.page.width - 70, 75).fillAndStroke('#f8fafc', '#e2e8f0');
    
    doc.fillColor('#0f172a').fontSize(11).font('Helvetica-Bold')
       .text(`Patient: ${cleanPdfText(patient.name || prescription.patient_name || 'N/A')}`, 45, 120);
    doc.fontSize(10).font('Helvetica')
       .text(`Age/Gender: ${cleanPdfText(String(patient.age || 'N/A'))} yrs / ${cleanPdfText(patient.gender || 'N/A')}`, 45, 138);
    doc.text(`UHID: ${cleanPdfText(patient.uhid || 'N/A')}`, 45, 154);

    doc.fontSize(11).font('Helvetica-Bold')
       .text(`Doctor: ${cleanPdfText(doctor.name || prescription.doctor_name || 'Consultant')}`, 320, 120);
    doc.fontSize(10).font('Helvetica')
       .text(`Department: ${cleanPdfText(doctor.specialty || prescription.department_name || 'General Medicine')}`, 320, 138);
    doc.text(`Date: ${new Date(prescription.created_at || Date.now()).toLocaleDateString()}`, 320, 154);

    // DIAGNOSIS
    let y = 205;
    doc.fillColor('#0f172a').fontSize(12).font('Helvetica-Bold')
       .text(`Diagnosis:`, 35, y);
    doc.fontSize(11).font('Helvetica')
       .text(cleanPdfText(prescription.diagnosis || 'General OPD Consultation'), 110, y);

    // MEDICINES TABLE
    y += 35;
    doc.rect(35, y, doc.page.width - 70, 24).fill('#0284c7');
    doc.fillColor('#ffffff').fontSize(10).font('Helvetica-Bold');
    doc.text('Medicine Name', 45, y + 7);
    doc.text('Dosage', 250, y + 7);
    doc.text('Duration', 350, y + 7);
    doc.text('Instructions', 450, y + 7);

    y += 24;
    medicines.forEach((med, idx) => {
      const rowBg = idx % 2 === 0 ? '#ffffff' : '#f8fafc';
      doc.rect(35, y, doc.page.width - 70, 24).fillAndStroke(rowBg, '#f1f5f9');
      doc.fillColor('#0f172a').fontSize(10).font('Helvetica');
      doc.text(cleanPdfText(med.name), 45, y + 7);
      doc.text(cleanPdfText(med.dosage || '1-0-1'), 250, y + 7);
      doc.text(cleanPdfText(med.duration || '5 days'), 350, y + 7);
      doc.text(cleanPdfText(med.instructions || 'After food'), 450, y + 7);
      y += 24;
    });

    // NOTES & FOLLOW UP
    y += 20;
    if (prescription.notes) {
      doc.fillColor('#0f172a').fontSize(11).font('Helvetica-Bold').text('Advice / Notes:', 35, y);
      doc.fontSize(10.5).font('Helvetica').text(cleanPdfText(prescription.notes), 35, y + 16);
      y += 40;
    }

    if (prescription.follow_up_date) {
      const followUpStr = new Date(prescription.follow_up_date).toLocaleDateString();
      doc.rect(35, y, doc.page.width - 70, 30).fillAndStroke('#f0fdf4', '#bbf7d0');
      doc.fillColor('#15803d').fontSize(11).font('Helvetica-Bold')
         .text(`Recommended Follow-Up Date: ${followUpStr}`, 45, y + 8);
    }

    // SIGNATURE FOOTER
    doc.fillColor('#64748b').fontSize(10).font('Helvetica')
       .text('Doctor Signature / Stamp', doc.page.width - 180, doc.page.height - 70, { align: 'right' });

    doc.end();
    stream.on('finish', () => resolve(pdfUrl));
    stream.on('error', (err) => reject(err));
  });
}

// 3. Generate Invoice / Bill PDF
export async function generateInvoicePdf(bill, items = [], patient = {}, buyOutsideMeds = []) {
  const dict = await getTranslationsDict();
  const fileName = `invoice-${bill.id}-${Date.now()}.pdf`;
  const filePath = path.join(uploadsPdfDir, fileName);
  const pdfUrl = `/uploads/pdf/${fileName}`;

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 35 });
    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    // HEADER
    doc.rect(35, 35, doc.page.width - 70, 60).fill('#0f172a');
    doc.fillColor('#ffffff').fontSize(18).font('Helvetica-Bold')
       .text(cleanPdfText(dict.hospital_name || 'G.J.S Multi-Speciality Hospital'), 45, 48);
    doc.fontSize(10).font('Helvetica')
       .text('TAX INVOICE / OPD RECEIPT', 45, 72);

    doc.fillColor('#38bdf8').fontSize(13).font('Helvetica-Bold')
       .text(`INV #: ${cleanPdfText(bill.bill_number)}`, doc.page.width - 200, 50, { align: 'right' });

    // PATIENT INFO & INVOICE META
    doc.rect(35, 110, doc.page.width - 70, 65).fillAndStroke('#f8fafc', '#e2e8f0');
    doc.fillColor('#0f172a').fontSize(11).font('Helvetica-Bold')
       .text(`Billed To: ${cleanPdfText(patient.name || bill.patient_name || 'Patient')}`, 45, 120);
    doc.fontSize(10).font('Helvetica')
       .text(`Mobile: ${cleanPdfText(patient.mobile || bill.mobile || 'N/A')}`, 45, 138);
    doc.text(`UHID: ${cleanPdfText(patient.uhid || 'N/A')}`, 45, 154);

    doc.fontSize(10).font('Helvetica-Bold')
       .text(`Date: ${new Date(bill.created_at || Date.now()).toLocaleDateString()}`, 350, 120);
    doc.text(`Payment Status: ${cleanPdfText(bill.status)}`, 350, 138);
    doc.text(`Payment Method: ${cleanPdfText(bill.payment_method || 'CASH')}`, 350, 154);

    // ITEMS TABLE
    let y = 195;
    doc.rect(35, y, doc.page.width - 70, 24).fill('#0f172a');
    doc.fillColor('#ffffff').fontSize(10).font('Helvetica-Bold');
    doc.text('Category', 45, y + 7);
    doc.text('Description', 160, y + 7);
    doc.text('Qty', 380, y + 7);
    doc.text('Amount (Rs)', 460, y + 7);

    y += 24;
    items.forEach((item, idx) => {
      const rowBg = idx % 2 === 0 ? '#ffffff' : '#f8fafc';
      doc.rect(35, y, doc.page.width - 70, 24).fillAndStroke(rowBg, '#f1f5f9');
      doc.fillColor('#0f172a').fontSize(10).font('Helvetica');
      doc.text(cleanPdfText(item.category), 45, y + 7);
      doc.text(cleanPdfText(item.description), 160, y + 7);
      doc.text(String(item.quantity || 1), 380, y + 7);
      doc.text(`Rs. ${parseFloat(item.amount).toFixed(2)}`, 460, y + 7);
      y += 24;
    });

    // ─── BUY OUTSIDE / UNAVAILABLE MEDICINES SECTION ───
    if (Array.isArray(buyOutsideMeds) && buyOutsideMeds.length > 0) {
      y += 10;
      doc.rect(35, y, doc.page.width - 70, 20).fill('#ea580c'); // Distinct orange header
      doc.fillColor('#ffffff').fontSize(9).font('Helvetica-Bold')
         .text('UNAVAILABLE MEDICINES (TO BUY OUTSIDE)', 45, y + 6);
      y += 20;

      buyOutsideMeds.forEach((med, idx) => {
        const rowBg = idx % 2 === 0 ? '#fff7ed' : '#ffffff'; // Light orange row background
        doc.rect(35, y, doc.page.width - 70, 20).fillAndStroke(rowBg, '#ffedd5');
        doc.fillColor('#c2410c').fontSize(9).font('Helvetica');
        doc.text('OUTSIDE', 45, y + 5);
        doc.text(cleanPdfText(`${med.name} (${med.dosage || 'Standard'})`), 160, y + 5);
        doc.text(cleanPdfText(med.duration || 'N/A'), 380, y + 5);
        doc.font('Helvetica-Bold').text('N/A (Outside)', 460, y + 5);
        y += 20;
      });
    }

    // SUMMARY TOTALS
    y += 15;
    const total = parseFloat(bill.total_amount || 0).toFixed(2);
    const paid = parseFloat(bill.paid_amount || 0).toFixed(2);
    const balance = (parseFloat(total) - parseFloat(paid)).toFixed(2);

    doc.rect(doc.page.width - 240, y, 205, 75).fillAndStroke('#f8fafc', '#cbd5e1');
    doc.fillColor('#0f172a').fontSize(11).font('Helvetica-Bold')
       .text(`Total Amount:`, doc.page.width - 230, y + 10);
    doc.text(`Rs. ${total}`, doc.page.width - 100, y + 10, { align: 'right' });

    doc.text(`Paid Amount:`, doc.page.width - 230, y + 30);
    doc.fillColor('#15803d').text(`Rs. ${paid}`, doc.page.width - 100, y + 30, { align: 'right' });

    doc.fillColor('#0f172a').text(`Balance Due:`, doc.page.width - 230, y + 50);
    doc.fillColor(parseFloat(balance) > 0 ? '#dc2626' : '#15803d')
       .text(`Rs. ${balance}`, doc.page.width - 100, y + 50, { align: 'right' });

    // FOOTER
    doc.fillColor('#64748b').fontSize(10).font('Helvetica')
       .text('Thank you for choosing G.J.S Multi-Speciality Hospital!', 45, doc.page.height - 50);

    doc.end();
    stream.on('finish', () => resolve(pdfUrl));
    stream.on('error', (err) => reject(err));
  });
}

// 4. Generate Revenue Financial Report PDF (Confidential - Admin Only)
export async function generateRevenueReportPdf(reportData, periodLabel) {
  return new Promise((resolve, reject) => {
    const filename = `revenue-report-${Date.now()}.pdf`;
    const filepath = path.join(uploadsPdfDir, filename);
    const pdfUrl = `/uploads/pdf/${filename}`;

    const doc = new PDFDocument({ size: 'A4', margin: 35 });
    const stream = fs.createWriteStream(filepath);
    doc.pipe(stream);

    // HEADER
    doc.rect(0, 0, doc.page.width, 85).fill('#0f2b48');
    doc.fillColor('#ffffff').fontSize(18).font('Helvetica-Bold').text('G.J.S Multi-Speciality Hospital', 45, 20);
    doc.fontSize(11).font('Helvetica').text('FINANCIAL REVENUE AUDIT REPORT (CONFIDENTIAL - ADMIN ONLY)', 45, 45);
    doc.fontSize(9).text(`Generated: ${new Date().toLocaleString()} | Period: ${cleanPdfText(periodLabel)}`, 45, 62);

    // SUMMARY CARDS
    let y = 105;
    doc.rect(35, y, doc.page.width - 70, 70).fillAndStroke('#f0f9ff', '#bae6fd');
    doc.fillColor('#0369a1').fontSize(12).font('Helvetica-Bold').text(`Period Financial Performance (${cleanPdfText(periodLabel)})`, 45, y + 10);
    doc.fillColor('#0f172a').fontSize(16).font('Helvetica-Bold').text(`Total Revenue: Rs. ${parseFloat(reportData.total_revenue || 0).toFixed(2)}`, 45, y + 30);
    doc.fontSize(10).font('Helvetica').text(`Paid Invoices: ${reportData.paid_bills_count || 0} | Avg Transaction: Rs. ${parseFloat(reportData.average_bill_amount || 0).toFixed(2)}`, 45, y + 52);

    // CATEGORY BREAKDOWN
    y += 90;
    doc.fillColor('#0f172a').fontSize(12).font('Helvetica-Bold').text('Revenue Breakdown by Service Category', 35, y);
    y += 20;

    doc.rect(35, y, doc.page.width - 70, 22).fill('#0f172a');
    doc.fillColor('#ffffff').fontSize(10).font('Helvetica-Bold');
    doc.text('Category', 45, y + 6);
    doc.text('Amount (Rs)', 350, y + 6);

    y += 22;
    const cats = reportData.category_breakdown || [];
    cats.forEach((c, idx) => {
      const rowBg = idx % 2 === 0 ? '#ffffff' : '#f8fafc';
      doc.rect(35, y, doc.page.width - 70, 22).fillAndStroke(rowBg, '#f1f5f9');
      doc.fillColor('#0f172a').fontSize(10).font('Helvetica');
      doc.text(cleanPdfText(c.category), 45, y + 6);
      doc.text(`Rs. ${parseFloat(c.amount || 0).toFixed(2)}`, 350, y + 6);
      y += 22;
    });

    // PAYMENT METHOD BREAKDOWN
    y += 25;
    doc.fillColor('#0f172a').fontSize(12).font('Helvetica-Bold').text('Revenue Breakdown by Payment Method', 35, y);
    y += 20;

    doc.rect(35, y, doc.page.width - 70, 22).fill('#0f172a');
    doc.fillColor('#ffffff').fontSize(10).font('Helvetica-Bold');
    doc.text('Payment Method', 45, y + 6);
    doc.text('Amount (Rs)', 350, y + 6);

    y += 22;
    const methods = reportData.payment_method_breakdown || [];
    methods.forEach((m, idx) => {
      const rowBg = idx % 2 === 0 ? '#ffffff' : '#f8fafc';
      doc.rect(35, y, doc.page.width - 70, 22).fillAndStroke(rowBg, '#f1f5f9');
      doc.fillColor('#0f172a').fontSize(10).font('Helvetica');
      doc.text(cleanPdfText(m.method), 45, y + 6);
      doc.text(`Rs. ${parseFloat(m.amount || 0).toFixed(2)}`, 350, y + 6);
      y += 22;
    });

    // FOOTER
    doc.fillColor('#64748b').fontSize(9).font('Helvetica')
       .text('This is an automated confidential financial report generated by GJS HMS System.', 35, doc.page.height - 40);

    doc.end();
    stream.on('finish', () => resolve(pdfUrl));
    stream.on('error', (err) => reject(err));
  });
}

// 5. Generate Printed "Buy Outside Note" PDF (Part 4)
export async function generateBuyOutsideNotePdf(prescription, notDispensedMedicines, patientInfo) {
  return new Promise((resolve, reject) => {
    const filename = `buy-outside-note-${prescription.id}-${Date.now()}.pdf`;
    const filepath = path.join(uploadsPdfDir, filename);
    const pdfUrl = `/uploads/pdf/${filename}`;

    const doc = new PDFDocument({ size: 'A5', margin: 25 });
    const stream = fs.createWriteStream(filepath);
    doc.pipe(stream);

    // HEADER
    doc.rect(0, 0, doc.page.width, 65).fill('#7c2d12');
    doc.fillColor('#ffffff').fontSize(15).font('Helvetica-Bold').text('G.J.S Multi-Speciality Hospital', 30, 15, { align: 'center' });
    doc.fontSize(10).font('Helvetica').text('OUTSIDE PHARMACY PURCHASE SLIP', 30, 36, { align: 'center' });
    doc.fontSize(8).text('Hospital Pharmacy Stock Exemption / Patient Opt-Out Note', 30, 48, { align: 'center' });

    // PATIENT DETAILS
    let y = 80;
    doc.rect(25, y, doc.page.width - 50, 45).fillAndStroke('#fff7ed', '#fed7aa');
    doc.fillColor('#9a3412').fontSize(9.5).font('Helvetica-Bold');
    doc.text(`Patient: ${cleanPdfText(patientInfo.name || 'Patient')}`, 35, y + 8);
    doc.text(`UHID: ${cleanPdfText(patientInfo.uhid || 'N/A')}`, 240, y + 8);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 35, y + 26);
    doc.text(`Prescription ID: #${prescription.id}`, 240, y + 26);

    // INSTRUCTION NOTICE BANNER
    y += 55;
    doc.rect(25, y, doc.page.width - 50, 32).fill('#ea580c');
    doc.fillColor('#ffffff').fontSize(9).font('Helvetica-Bold')
       .text('Not available at hospital pharmacy - please purchase from an outside pharmacy.', 30, y + 10, { align: 'center' });

    // MEDICINES TABLE
    y += 42;
    doc.rect(25, y, doc.page.width - 50, 20).fill('#0f172a');
    doc.fillColor('#ffffff').fontSize(9).font('Helvetica-Bold');
    doc.text('Medicine Name', 35, y + 5);
    doc.text('Dosage / Instructions', 200, y + 5);
    doc.text('Reason / Note', 310, y + 5);

    y += 20;
    notDispensedMedicines.forEach((m, idx) => {
      const rowBg = idx % 2 === 0 ? '#ffffff' : '#f8fafc';
      doc.rect(25, y, doc.page.width - 50, 22).fillAndStroke(rowBg, '#f1f5f9');
      doc.fillColor('#0f172a').fontSize(8.5).font('Helvetica-Bold');
      doc.text(cleanPdfText(m.name), 35, y + 6);
      doc.font('Helvetica').text(`${cleanPdfText(m.dosage || '')} (${cleanPdfText(m.duration || '')})`, 200, y + 6);
      doc.fillColor('#c2410c').text(cleanPdfText(m.dispensed_note || 'Out of stock'), 310, y + 6);
      y += 22;
    });

    // FOOTER
    doc.fillColor('#64748b').fontSize(8).font('Helvetica')
       .text('Pharmacist Authorization Stamp & Signature', 35, doc.page.height - 35);

    doc.end();
    stream.on('finish', () => resolve(pdfUrl));
    stream.on('error', (err) => reject(err));
  });
}
