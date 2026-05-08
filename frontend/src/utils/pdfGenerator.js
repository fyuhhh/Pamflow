import jsPDF from 'jspdf';
import 'jspdf-autotable';

/**
 * Generates a professional PDF report for a single task
 * @param {Object} task - The task data
 * @param {Array} history - The task history data
 * @param {Array} auditLogs - The audit logs data
 */
export const generateTaskPDF = (task, history = [], auditLogs = []) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  const margin = 15;

  // --- Header Branding ---
  doc.setFillColor(0, 74, 113); // Corporate Blue
  doc.rect(0, 0, pageWidth, 40, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('Pamflow', margin, 20);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('LAPORAN PENYELESAIAN TUGAS', margin, 30);
  
  doc.setFontSize(9);
  doc.text(`ID Laporan: RP-${task.id}-${Date.now().toString().slice(-6)}`, pageWidth - margin, 20, { align: 'right' });
  doc.text(`Tanggal Cetak: ${new Date().toLocaleString('id-ID')}`, pageWidth - margin, 27, { align: 'right' });

  // --- Task Metadata Section ---
  doc.setTextColor(51, 51, 51);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('INFORMASI TUGAS', margin, 55);
  
  doc.autoTable({
    startY: 60,
    margin: { left: margin, right: margin },
    head: [],
    body: [
      ['ID Tugas', `: PAM-${task.id}`, 'Nama Tugas', `: ${task.nama_tugas || '-'}`],
      ['Perusahaan', `: ${task.perusahaan || '-'}`, 'Departemen', `: ${task.departemen || '-'}`],
      ['No. Perintah', `: ${task.nomor_perintah_kerja || '-'}`, 'Urgensi', `: ${task.urgensi || 'Normal'}`],
      ['Jadwal Mulai', `: ${new Date(task.tanggal_mulai).toLocaleDateString('id-ID')}`, 'Aturan Waktu', `: ${task.aturan_waktu || '-'}`],
      ['Status Akhir', `: ${task.progres || '-'}`, 'Lokasi', `: ${task.lokasi || '-'}`],
    ],
    theme: 'plain',
    styles: { fontSize: 9, cellPadding: 2 },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 30 },
      1: { cellWidth: 60 },
      2: { fontStyle: 'bold', cellWidth: 30 },
      3: { cellWidth: 60 }
    }
  });

  // --- Task Description ---
  const currentY = doc.lastAutoTable.finalY + 10;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('DESKRIPSI TUGAS', margin, currentY);
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  const splitDesc = doc.splitTextToSize(task.deskripsi || 'Tidak ada deskripsi.', pageWidth - (margin * 2));
  doc.text(splitDesc, margin, currentY + 7);

  // --- Form Submission Data (Pengerjaan) ---
  let detailsY = currentY + 7 + (splitDesc.length * 5) + 10;
  if (detailsY > 250) { doc.addPage(); detailsY = 20; }
  
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('DETAIL PENGERJAAN', margin, detailsY);

  let submissionData = [];
  try {
    if (task.submission_data) {
      const parsed = typeof task.submission_data === 'string' ? JSON.parse(task.submission_data) : task.submission_data;
      submissionData = Object.entries(parsed).map(([key, val]) => [key, val]);
    }
  } catch (e) {
    console.error('Error parsing submission data for PDF:', e);
  }

  if (submissionData.length > 0) {
    doc.autoTable({
      startY: detailsY + 5,
      margin: { left: margin, right: margin },
      head: [['Field Laporan', 'Nilai / Jawaban']],
      body: submissionData,
      theme: 'striped',
      headStyles: { fillColor: [0, 149, 232], textColor: 255 },
      styles: { fontSize: 9 }
    });
  } else {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'italic');
    doc.text('Tidak ada data form yang dikirim.', margin, detailsY + 10);
    doc.lastAutoTable = { finalY: detailsY + 15 };
  }

  // --- Activity History ---
  let historyY = doc.lastAutoTable.finalY + 15;
  if (historyY > 230) { doc.addPage(); historyY = 20; }
  
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('RIWAYAT AKTIVITAS', margin, historyY);

  const historyBody = history.map(h => [
    new Date(h.waktu_mulai || h.created_at).toLocaleString('id-ID'),
    h.nama_agen || 'Sistem',
    h.progres || '-',
    h.catatan || '-'
  ]);

  doc.autoTable({
    startY: historyY + 5,
    margin: { left: margin, right: margin },
    head: [['Waktu', 'Oleh', 'Aktivitas', 'Catatan']],
    body: historyBody.length > 0 ? historyBody : [['-', '-', 'Belum ada riwayat', '-']],
    theme: 'grid',
    headStyles: { fillColor: [241, 241, 244], textColor: [126, 130, 153], fontStyle: 'bold' },
    styles: { fontSize: 8 }
  });

  // --- Footer ---
  const totalPages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(161, 165, 183);
    doc.text(`© 2026 IT Dept. Pamflow. - Halaman ${i} dari ${totalPages}`, pageWidth / 2, doc.internal.pageSize.height - 10, { align: 'center' });
  }

  doc.save(`Laporan_Tugas_PAM_${task.id}.pdf`);
};

/**
 * Generates a professional PDF summary for a list of tasks
 * @param {Array} tasks - The filtered list of tasks
 */
export const generateSummaryPDF = (tasks) => {
  const doc = new jsPDF('landscape');
  const pageWidth = doc.internal.pageSize.width;
  const margin = 15;

  // Header
  doc.setFillColor(0, 74, 113);
  doc.rect(0, 0, pageWidth, 35, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('Pamflow - Ringkasan Tugas', margin, 18);
  
  doc.setFontSize(9);
  doc.text(`Total Tugas: ${tasks.length} | Dicetak pada: ${new Date().toLocaleString('id-ID')}`, margin, 28);

  const tableBody = tasks.map((t, idx) => [
    idx + 1,
    `PAM-${t.id}`,
    t.nama_tugas,
    t.departemen,
    t.progres,
    t.urgensi,
    new Date(t.tanggal_mulai).toLocaleDateString('id-ID')
  ]);

  doc.autoTable({
    startY: 45,
    margin: { left: margin, right: margin },
    head: [['No', 'ID', 'Nama Tugas', 'Departemen', 'Progres', 'Urgensi', 'Tanggal']],
    body: tableBody,
    theme: 'striped',
    headStyles: { fillColor: [0, 149, 232], textColor: 255 },
    styles: { fontSize: 8 }
  });

  // Footer
  const totalPages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(161, 165, 183);
    doc.text(`© 2026 IT Dept. Pamflow. - Halaman ${i} dari ${totalPages}`, pageWidth / 2, doc.internal.pageSize.height - 10, { align: 'center' });
  }

  doc.save(`Ringkasan_Tugas_${new Date().toISOString().split('T')[0]}.pdf`);
};
