import CryptoJS from 'crypto-js';

const FILE_EXTENSION = '.realpnl';
const FILE_VERSION = '1.0';

/**
 * Encrypt report data with AES-256
 * @param {Object} data - The data to encrypt
 * @param {string} password - User-provided password
 * @returns {string} - Encrypted data as base64 string
 */
export function encryptReport(data, password) {
    const payload = {
        version: FILE_VERSION,
        exportedAt: new Date().toISOString(),
        data
    };

    const jsonString = JSON.stringify(payload);
    const encrypted = CryptoJS.AES.encrypt(jsonString, password).toString();

    return encrypted;
}

/**
 * Decrypt report data
 * @param {string} encryptedData - The encrypted data
 * @param {string} password - User-provided password
 * @returns {Object|null} - Decrypted data or null if failed
 */
export function decryptReport(encryptedData, password) {
    try {
        const decrypted = CryptoJS.AES.decrypt(encryptedData, password);
        const jsonString = decrypted.toString(CryptoJS.enc.Utf8);

        if (!jsonString) {
            return null;
        }

        const payload = JSON.parse(jsonString);
        return payload;
    } catch (error) {
        console.error('Decryption failed:', error);
        return null;
    }
}

/**
 * Download encrypted report as .clearsignal file
 * @param {Object} reportData - The report data to export
 * @param {string} password - User-provided password
 */
export function downloadEncryptedReport(reportData, password) {
    const encrypted = encryptReport(reportData, password);

    const blob = new Blob([encrypted], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);

    const timestamp = new Date().toISOString().slice(0, 10);
    const filename = `realpnl-report-${timestamp}${FILE_EXTENSION}`;

    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
}

/**
 * Read and decrypt a .clearsignal file
 * @param {File} file - The file to read
 * @param {string} password - User-provided password
 * @returns {Promise<Object|null>} - Decrypted data or null
 */
export async function readEncryptedReport(file, password) {
    return new Promise((resolve) => {
        const reader = new FileReader();

        reader.onload = (e) => {
            const encryptedData = e.target.result;
            const decrypted = decryptReport(encryptedData, password);
            resolve(decrypted);
        };

        reader.onerror = () => {
            resolve(null);
        };

        reader.readAsText(file);
    });
}

/**
 * Save report to localStorage
 */
export function saveReportToStorage(reportData) {
    try {
        localStorage.setItem('realpnl_report', JSON.stringify({
            savedAt: new Date().toISOString(),
            data: reportData
        }));
        return true;
    } catch (error) {
        console.error('Failed to save to localStorage:', error);
        return false;
    }
}

/**
 * Load report from localStorage
 */
export function loadReportFromStorage() {
    try {
        const stored = localStorage.getItem('realpnl_report');
        if (!stored) return null;
        return JSON.parse(stored);
    } catch (error) {
        console.error('Failed to load from localStorage:', error);
        return null;
    }
}

/**
 * Clear report from localStorage
 */
export function clearReportFromStorage() {
    localStorage.removeItem('realpnl_report');
}
