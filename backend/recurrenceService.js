
/**
 * Calculates the next recurrence date based on frequency
 */
const calculateNextDate = (currentDateStr, frequency) => {
    if (!currentDateStr || !frequency) return null;
    const d = new Date(currentDateStr);
    if (isNaN(d.getTime())) return null; // Check for Invalid Date

    if (frequency === 'Setiap Hari') {
        d.setDate(d.getDate() + 1);
    } else if (frequency === 'Setiap Minggu') {
        d.setDate(d.getDate() + 7);
    } else if (frequency === 'Setiap Bulan') {
        d.setMonth(d.getMonth() + 1);
    } else {
        return null;
    }
    
    try {
        return d.toISOString().split('T')[0];
    } catch (e) {
        return null;
    }
};

/**
 * Main logic to process and generate recurring tasks
 */
const processRecurringTasks = async (db) => {
    console.log('[RecurrenceService] Checking for tasks to generate...');
    try {
        const today = new Date().toISOString().split('T')[0];
        
        // Find tasks that need generation
        const [tasks] = await db.query(
            "SELECT * FROM tasks WHERE pengulangan = 1 AND next_recurrence_date IS NOT NULL AND next_recurrence_date <= ?",
            [today]
        );

        for (const masterTask of tasks) {
            console.log(`[RecurrenceService] Generating instance for task ID: ${masterTask.id} (${masterTask.nama_tugas})`);

            // 1. Check termination conditions
            let shouldStop = false;
            if (masterTask.waktu_berakhir === 'Pada tanggal' && masterTask.tanggal_pengulangan_berakhir) {
                const end = new Date(masterTask.tanggal_pengulangan_berakhir).toISOString().split('T')[0];
                if (masterTask.next_recurrence_date > end) shouldStop = true;
            } else if (masterTask.waktu_berakhir === 'Setelah' && masterTask.kali_pengulangan > 0) {
                if (masterTask.recurrence_count >= masterTask.kali_pengulangan) shouldStop = true;
            }

            if (shouldStop) {
                console.log(`[RecurrenceService] Recurrence limit reached for task ${masterTask.id}. Stopping.`);
                await db.query("UPDATE tasks SET next_recurrence_date = NULL WHERE id = ?", [masterTask.id]);
                continue;
            }

            // 2. Clone the task
            // Shifting dates: new start = master's next_recurrence_date
            const newStartDate = masterTask.next_recurrence_date;
            
            // Calculate new end date by keeping the same duration
            let newEndDate = newStartDate;
            if (masterTask.tanggal_mulai && masterTask.tanggal_selesai) {
                const start = new Date(masterTask.tanggal_mulai);
                const end = new Date(masterTask.tanggal_selesai);
                const durationMs = end - start;
                const newEnd = new Date(new Date(newStartDate).getTime() + durationMs);
                newEndDate = newEnd.toISOString().split('T')[0];
            }

            const [result] = await db.query(
                `INSERT INTO tasks (
                    perusahaan, company_id, departemen, nama_tugas, jenis_tugas, urgensi, nomor_perintah_kerja,
                    deskripsi, lokasi, detail_alamat, aturan_waktu, tanggal_mulai, waktu_mulai,
                    tanggal_selesai, waktu_selesai, pengulangan, tugas_departemen, dept_task_id,
                    agen_id, verifikasi_kehadiran, maksimum_radius, selfie, butuh_persetujuan, admin_pemeriksa_id, 
                    details, progres, status
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    masterTask.perusahaan, masterTask.company_id, masterTask.departemen, masterTask.nama_tugas, masterTask.jenis_tugas || 'checklist', masterTask.urgensi, masterTask.nomor_perintah_kerja,
                    masterTask.deskripsi, masterTask.lokasi, masterTask.detail_alamat, masterTask.aturan_waktu, 
                    newStartDate, masterTask.waktu_mulai, 
                    newEndDate, masterTask.waktu_selesai, 
                    false, // The instance itself doesn't repeat (the master handles it)
                    masterTask.tugas_departemen,
                    masterTask.dept_task_id,
                    masterTask.agen_id, masterTask.verifikasi_kehadiran, 
                    masterTask.maksimum_radius, masterTask.selfie,
                    masterTask.butuh_persetujuan, masterTask.admin_pemeriksa_id, 
                    masterTask.details,
                    'Terbuka',
                    'Pending'
                ]
            );

            // 3. Update Master Task for the NEXT run
            const nextDate = calculateNextDate(masterTask.next_recurrence_date, masterTask.jenis_pengulangan);
            const newCount = masterTask.recurrence_count + 1;

            // Final check if the NEXT date would exceed the limit
            let finalNextDate = nextDate;
            if (masterTask.waktu_berakhir === 'Pada tanggal' && nextDate > new Date(masterTask.tanggal_pengulangan_berakhir).toISOString().split('T')[0]) {
                finalNextDate = null;
            } else if (masterTask.waktu_berakhir === 'Setelah' && newCount >= masterTask.kali_pengulangan) {
                finalNextDate = null;
            }

            await db.query(
                "UPDATE tasks SET next_recurrence_date = ?, recurrence_count = ? WHERE id = ?",
                [finalNextDate, newCount, masterTask.id]
            );
        }
    } catch (err) {
        console.error('[RecurrenceService] Error:', err.message);
    }
};

// Start the scheduler
const initRecurrenceScheduler = (db) => {
    // Run immediately on start
    processRecurringTasks(db);
    
    // Then run every hour
    setInterval(() => processRecurringTasks(db), 1000 * 60 * 60);
};

module.exports = {
    initRecurrenceScheduler,
    calculateNextDate
};
