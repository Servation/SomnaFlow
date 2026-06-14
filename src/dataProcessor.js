function processSleepData(records) {
    let hrSum = 0, hrvSum = 0;
    let hrCount = 0, hrvCount = 0;
    let deepRemCount = 0;
    let totalCount = 0;
    let isPartialData = false;

    if (!records || records.length === 0) {
        throw new Error("No data found");
    }

    for (let i = 0; i < records.length; i++) {
        const row = records[i];
        totalCount++;

        if (row.heart_rate && row.heart_rate.trim() !== '') {
            hrSum += parseFloat(row.heart_rate);
            hrCount++;
        }
        if (row.hrv && row.hrv.trim() !== '') {
            hrvSum += parseFloat(row.hrv);
            hrvCount++;
        }
        if (row.sleep_phase) {
            const phase = row.sleep_phase.toLowerCase().trim();
            if (phase === 'deep' || phase === 'rem') {
                deepRemCount++;
            }
        }
    }

    if (hrCount < totalCount || hrvCount < totalCount) {
        isPartialData = true;
    }

    const total_hours = totalCount / 60;
    const hrv_avg = hrvCount > 0 ? hrvSum / hrvCount : 0;
    
    let sleep_score = 50; 
    if (totalCount > 0) {
        const deepRemRatio = deepRemCount / totalCount;
        sleep_score = Math.min(100, Math.round((deepRemRatio * 100) + (hrv_avg / 2)));
    }

    const date = records[0].timestamp ? new Date(records[0].timestamp).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];

    // Explicitly clear arrays for garbage collection
    records.length = 0;

    return {
        date,
        sleep_score,
        total_hours: Number(total_hours.toFixed(2)),
        hrv_avg: Number(hrv_avg.toFixed(1)),
        is_partial_data: isPartialData
    };
}

module.exports = { processSleepData };
