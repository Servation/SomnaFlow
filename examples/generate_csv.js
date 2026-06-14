const fs = require('fs');
let csv = 'timestamp,heart_rate,hrv,sleep_phase\n';
let current = new Date('2023-11-01T22:00:00Z').getTime();

// Generate 480 minutes (8 hours) of simulated sleep data
for(let i = 0; i < 480; i++) { 
    const ts = new Date(current).toISOString();
    
    // Base heart rate dips lower during deep sleep
    let hrBase = 60;
    let hrvBase = 50;
    let phase = 'light';
    
    // Simulate typical sleep cycles
    if (i < 20) {
        phase = 'awake';
        hrBase = 70;
    } else if (i > 60 && i < 140) {
        phase = 'deep';
        hrBase = 52;
        hrvBase = 70;
    } else if (i > 180 && i < 220) {
        phase = 'rem';
        hrBase = 62;
        hrvBase = 45;
    } else if (i > 260 && i < 330) {
        phase = 'deep';
        hrBase = 50;
        hrvBase = 75;
    } else if (i > 380 && i < 430) {
        phase = 'rem';
        hrBase = 65;
        hrvBase = 40;
    } else if (i > 465) {
        phase = 'awake';
        hrBase = 72;
    }

    // Add slight random variance
    let hr = hrBase + Math.floor(Math.random() * 5) - 2;
    let hrv = hrvBase + Math.floor(Math.random() * 10) - 5;

    csv += `${ts},${hr},${hrv},${phase}\n`;
    
    // Advance by 1 minute
    current += 60000; 
}

fs.writeFileSync('sample_sleep_data.csv', csv);
console.log('Successfully generated sample_sleep_data.csv (481 lines)');
