import { useState, useEffect, useCallback } from 'react';
import CSVUpload from './components/CSVUpload';
import Dashboard from './components/Dashboard';
import Settings from './components/Settings';
import ExportImport from './components/ExportImport';
import { parseCSV } from './utils/csvParser';
import { calculateAllMetrics } from './utils/calculations';
import { fetchCurrentPrices } from './api/coingecko';
import { saveReportToStorage, loadReportFromStorage, clearReportFromStorage } from './utils/encryption';

export default function App() {
    const [view, setView] = useState('upload'); // 'upload', 'loading', 'dashboard'
    const [trades, setTrades] = useState([]);
    const [metrics, setMetrics] = useState(null);
    const [warnings, setWarnings] = useState([]);
    const [errors, setErrors] = useState([]);
    const [showSettings, setShowSettings] = useState(false);
    const [showExport, setShowExport] = useState(false);
    const [settings, setSettings] = useState({
        slippagePercent: 0.5,
        gasFeePerTrade: 0.50
    });

    // Initialize Telegram Web App
    useEffect(() => {
        if (window.Telegram?.WebApp) {
            const tg = window.Telegram.WebApp;
            tg.ready();
            tg.expand();

            // Set header color
            tg.setHeaderColor('#0f172a');
            tg.setBackgroundColor('#0f172a');
        }
    }, []);

    // Load saved report on mount
    useEffect(() => {
        const saved = loadReportFromStorage();
        if (saved && saved.data) {
            setTrades(saved.data.trades || []);
            setMetrics(saved.data.metrics || null);
            setWarnings(saved.data.warnings || []);
            setSettings(saved.data.settings || settings);
            if (saved.data.metrics) {
                setView('dashboard');
            }
        }
    }, []);

    // Recalculate metrics when settings change
    const recalculateMetrics = useCallback(async (tradeData, currentSettings) => {
        if (tradeData.length === 0) return;

        const symbols = [...new Set(tradeData.map(t => t.symbol))];
        const { prices, warnings: priceWarnings } = await fetchCurrentPrices(symbols);

        const calculatedMetrics = calculateAllMetrics(tradeData, prices, currentSettings);
        setMetrics(calculatedMetrics);

        // Save to localStorage
        saveReportToStorage({
            trades: tradeData,
            metrics: calculatedMetrics,
            warnings: [...warnings.filter(w => w.type !== 'price'), ...priceWarnings],
            settings: currentSettings
        });

        return calculatedMetrics;
    }, [warnings]);

    // Handle CSV file upload
    const handleFileSelect = async (file) => {
        setView('loading');
        setErrors([]);

        try {
            // Parse CSV
            const { trades: parsedTrades, errors: parseErrors, warnings: parseWarnings } = await parseCSV(file);

            if (parseErrors.length > 0) {
                setErrors(parseErrors);
                setView('upload');
                return;
            }

            if (parsedTrades.length === 0) {
                setErrors([{ message: 'No valid trades found in the file.' }]);
                setView('upload');
                return;
            }

            setTrades(parsedTrades);
            setWarnings(parseWarnings);

            // Fetch prices and calculate metrics
            await recalculateMetrics(parsedTrades, settings);

            setView('dashboard');
        } catch (error) {
            console.error('Error processing file:', error);
            setErrors([{ message: `Error processing file: ${error.message}` }]);
            setView('upload');
        }
    };

    // Handle settings change
    const handleSettingsChange = async (newSettings) => {
        setSettings(newSettings);
        if (trades.length > 0) {
            setView('loading');
            await recalculateMetrics(trades, newSettings);
            setView('dashboard');
        }
    };

    // Handle report import
    const handleImport = (importedData) => {
        if (importedData.trades) {
            setTrades(importedData.trades);
            setMetrics(importedData.metrics);
            setWarnings(importedData.warnings || []);
            setSettings(importedData.settings || settings);
            setView('dashboard');

            // Save to localStorage
            saveReportToStorage(importedData);
        }
    };

    // Handle new upload
    const handleNewUpload = () => {
        setView('upload');
        setTrades([]);
        setMetrics(null);
        setWarnings([]);
        setErrors([]);
        clearReportFromStorage();
    };

    return (
        <div className="app">
            {/* Header */}
            <header className="header">
                <div className="header__logo">📊</div>
                <h1 className="header__title">RealPNL</h1>
                <p className="header__subtitle">See where your money really went</p>
            </header>

            {/* Errors */}
            {errors.length > 0 && (
                <div className="warnings">
                    {errors.map((error, index) => (
                        <div key={index} className="warning error">
                            <span className="warning__icon">❌</span>
                            <span>
                                {error.line && `Line ${error.line}: `}
                                {error.message}
                            </span>
                        </div>
                    ))}
                </div>
            )}

            {/* Main Content */}
            {view === 'upload' && (
                <CSVUpload onFileSelect={handleFileSelect} isLoading={false} />
            )}

            {view === 'loading' && (
                <div className="loading">
                    <div className="loading__spinner"></div>
                    <p className="loading__text">Analyzing your trades...</p>
                </div>
            )}

            {view === 'dashboard' && metrics && (
                <Dashboard
                    metrics={metrics}
                    warnings={warnings}
                    onSettingsClick={() => setShowSettings(true)}
                    onExportClick={() => setShowExport(true)}
                    onNewUpload={handleNewUpload}
                />
            )}

            {/* Settings Modal */}
            {showSettings && (
                <Settings
                    settings={settings}
                    onSettingsChange={handleSettingsChange}
                    onClose={() => setShowSettings(false)}
                />
            )}

            {/* Export/Import Modal */}
            {showExport && (
                <ExportImport
                    reportData={{
                        trades,
                        metrics,
                        warnings,
                        settings,
                        exportedAt: new Date().toISOString()
                    }}
                    onImport={handleImport}
                    onClose={() => setShowExport(false)}
                />
            )}

            {/* Footer */}
            <footer className="footer">
                <p className="footer__text">
                    🔒 All data stays on your device • No server storage
                </p>
            </footer>
        </div>
    );
}
