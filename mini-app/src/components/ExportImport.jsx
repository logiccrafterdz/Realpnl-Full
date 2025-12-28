import { useState, useRef } from 'react';
import { downloadEncryptedReport, readEncryptedReport } from '../utils/encryption';

export default function ExportImport({ reportData, onImport, onClose }) {
    const [mode, setMode] = useState('export'); // 'export' or 'import'
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [importFile, setImportFile] = useState(null);
    const fileInputRef = useRef(null);

    const handleExport = () => {
        if (password.length < 4) {
            setError('Password must be at least 4 characters');
            return;
        }
        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        downloadEncryptedReport(reportData, password);
        onClose();
    };

    const handleImport = async () => {
        if (!importFile) {
            setError('Please select a file');
            return;
        }
        if (!password) {
            setError('Please enter the password');
            return;
        }

        const result = await readEncryptedReport(importFile, password);

        if (!result) {
            setError('Failed to decrypt. Check your password.');
            return;
        }

        onImport(result.data);
        onClose();
    };

    const handleFileSelect = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            if (!file.name.endsWith('.realpnl')) {
                setError('Please select a .realpnl file');
                return;
            }
            setImportFile(file);
            setError('');
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
                <h2 className="modal__title">
                    {mode === 'export' ? '🔒 Export Report' : '📥 Import Report'}
                </h2>

                {/* Mode Tabs */}
                <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
                    <button
                        className={`btn btn--small ${mode === 'export' ? 'btn--primary' : 'btn--secondary'}`}
                        onClick={() => { setMode('export'); setError(''); }}
                    >
                        Export
                    </button>
                    <button
                        className={`btn btn--small ${mode === 'import' ? 'btn--primary' : 'btn--secondary'}`}
                        onClick={() => { setMode('import'); setError(''); }}
                    >
                        Import
                    </button>
                </div>

                {mode === 'export' ? (
                    <>
                        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                            Your report will be encrypted locally. Never share your password.
                        </p>

                        <input
                            type="password"
                            className="modal__input"
                            placeholder="Enter password"
                            value={password}
                            onChange={(e) => { setPassword(e.target.value); setError(''); }}
                        />

                        <input
                            type="password"
                            className="modal__input"
                            placeholder="Confirm password"
                            value={confirmPassword}
                            onChange={(e) => { setConfirmPassword(e.target.value); setError(''); }}
                        />
                    </>
                ) : (
                    <>
                        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                            Select a .realpnl file to restore your report.
                        </p>

                        <div
                            className="card card--upload"
                            style={{ padding: '20px', marginBottom: '16px' }}
                            onClick={() => fileInputRef.current?.click()}
                        >
                            {importFile ? (
                                <span style={{ color: 'var(--accent)' }}>✓ {importFile.name}</span>
                            ) : (
                                <span>Click to select file</span>
                            )}
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".realpnl"
                                style={{ display: 'none' }}
                                onChange={handleFileSelect}
                            />
                        </div>

                        <input
                            type="password"
                            className="modal__input"
                            placeholder="Enter password"
                            value={password}
                            onChange={(e) => { setPassword(e.target.value); setError(''); }}
                        />
                    </>
                )}

                {error && (
                    <div className="warning error" style={{ marginBottom: '16px' }}>
                        <span className="warning__icon">❌</span>
                        <span>{error}</span>
                    </div>
                )}

                <div className="btn-group">
                    <button className="btn btn--secondary" onClick={onClose}>
                        Cancel
                    </button>
                    <button
                        className="btn btn--primary"
                        onClick={mode === 'export' ? handleExport : handleImport}
                    >
                        {mode === 'export' ? 'Download' : 'Restore'}
                    </button>
                </div>
            </div>
        </div>
    );
}
