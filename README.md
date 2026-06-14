# SomnaFlow 🌙

**SomnaFlow** is a professional-grade, privacy-first, zero-cloud sleep health and recovery analytics dashboard. It is designed for quantified-self enthusiasts who demand advanced biometric tracking without the risk of corporate surveillance or data monetization.

---

## 🛑 The Privacy Problem

Intimate biometric telemetry—such as minute-by-minute heart rate logs, respiration rates, and daily sleep cycles—is some of the most sensitive personal data in existence. However, major fitness tracker platforms (Apple, Garmin, Oura, Fitbit) often require users to upload this data to the cloud, where it is analyzed, stored indefinitely, and frequently monetized or exposed in security breaches. 

**SomnaFlow solves this privacy threat** by providing a local, isolated calculation engine that gives you absolute data sovereignty.

---

## ✨ Core Features

* **Zero-Cloud Architecture:** Everything runs on `localhost`. There are no external API calls, no analytics trackers, and no remote databases.
* **System-Theoretic Modular State Isolation:** Raw biometric data points exist *only* in volatile RAM during the calculation phase. Once your sleep score is generated, the raw arrays are explicitly destroyed and garbage-collected.
* **Military-Grade Local Encryption:** Your aggregate daily recovery scores are never stored as plain text. The system uses a native AES-256-CBC cipher to encrypt your `sleep_records.enc` ledger.
* **Premium Dark-Mode Dashboard:** An intuitive, drag-and-drop web UI featuring dynamic dual-axis charts (via Chart.js) to visualize your long-term recovery and HRV trends.

---

## 🔒 Security Model

1. **The System Lock State:** When you boot the SomnaFlow server, it starts in a strictly locked state. All API endpoints return a `403 Forbidden` response.
2. **Volatile Key Derivation:** You must unlock the system via the Web UI by providing an encryption password. This password derives a 32-byte secure key using SHA-256 that lives purely in volatile memory—it is never saved to a cookie, local storage, or a `.env` file.
3. **Encrypted Appends:** When a CSV is processed, the resulting aggregate JSON (Date, Sleep Score, HRV Average, Total Hours) is encrypted using a unique Initialization Vector (IV) and appended to the local `sleep_records.enc` file.

---

## 🚀 Installation & Running

1. Clone or download this repository.
2. Install the required Node.js dependencies:
   ```bash
   npm install
   ```
3. Start the local server:
   ```bash
   npm start
   ```
   *(Alternatively: `node server.js`)*
4. Open your browser and navigate to `http://localhost:3000`.
5. On your first run, enter a new password to initialize your encrypted database. **Remember this password!** You will need it every time you restart the server.

---

## 🧪 Testing the Dashboard

We have included a script to generate a highly realistic, 8-hour mock sleep session so you can test the UI immediately.

1. Navigate to the `/examples` folder.
2. You will find `sample_sleep_data.csv`. (If it's not there, run `node generate_csv.js` to create it).
3. Drag and drop `sample_sleep_data.csv` straight into the SomnaFlow dropzone. 
4. Watch the engine parse 480 rows of biometric data, encrypt the result, and instantly visualize your generated Sleep Score!

---

## 📊 Expected CSV Format

Because wearable devices export data in vastly different proprietary formats, SomnaFlow requires a **normalized CSV format** to process the data securely. You must flatten or export your biometric data into a CSV containing the following exact headers:

```csv
timestamp,heart_rate,hrv,sleep_phase
2023-11-01T22:00:00Z,65,55,awake
2023-11-01T22:05:00Z,60,60,light
2023-11-01T23:00:00Z,52,70,deep
```

* **`timestamp`**: ISO 8601 formatted date/time string.
* **`heart_rate`**: The raw BPM (beats per minute) reading.
* **`hrv`**: The Heart Rate Variability reading in ms.
* **`sleep_phase`**: The current stage of sleep. Acceptable values: `awake`, `light`, `deep`, `rem`.

*(Note: If any of these columns are entirely missing, the system will safely reject the file. However, partial data gaps—such as missing an HRV reading for a specific minute—are gracefully handled and flagged in the database as `is_partial_data`.)*
