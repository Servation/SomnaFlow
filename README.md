# SomnaFlow

SomnaFlow is a privacy-first, zero-cloud sleep health and recovery analytics dashboard. It runs completely locally to ensure your sensitive biometric telemetry never touches a corporate server.

## Installation & Running

1. Clone or download this repository.
2. Run `npm install` to install dependencies.
3. Start the server with: `node server.js`
4. Open your browser and navigate to `http://localhost:3000`

On your first run, you will be prompted to create an **Encryption Password**. This password is used to generate a secure AES-256-CBC key that will encrypt your daily sleep records locally on your disk. Do not forget this password, as it is required to decrypt your history on subsequent startups.

## Expected CSV Format

Because wearable devices (like Apple Watch, Garmin, or Oura) all export their data in vastly different proprietary formats, SomnaFlow requires a **normalized CSV format** to process the data securely. 

You must flatten or export your biometric data into a CSV containing the following exact headers:

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

If any of these columns are entirely missing, the system will reject the CSV to prevent corrupted calculations. Partial data gaps (e.g. missing an HRV reading for a specific minute) are safely handled and flagged.
