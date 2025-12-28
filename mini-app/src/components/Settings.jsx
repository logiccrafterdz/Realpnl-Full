import { useState } from 'react';

export default function Settings({ settings, onSettingsChange, onClose }) {
    const [slippage, setSlippage] = useState(settings.slippagePercent);
    const [gasFee, setGasFee] = useState(settings.gasFeePerTrade);

    const handleApply = () => {
        onSettingsChange({
            slippagePercent: parseFloat(slippage) || 0.5,
            gasFeePerTrade: parseFloat(gasFee) || 0.50
        });
        onClose();
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
                <h2 className="modal__title">⚙️ Fee Assumptions</h2>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '20px' }}>
                    Adjust these values to estimate hidden trading costs
                </p>

                <div className="settings">
                    <div className="setting">
                        <label className="setting__label">Slippage %</label>
                        <div className="setting__value">
                            <input
                                type="number"
                                className="setting__input"
                                value={slippage}
                                onChange={(e) => setSlippage(e.target.value)}
                                min="0"
                                max="100"
                                step="0.1"
                            />
                            <span style={{ color: 'var(--text-muted)' }}>%</span>
                        </div>
                    </div>

                    <div className="setting">
                        <label className="setting__label">Gas/Network Fee</label>
                        <div className="setting__value">
                            <span style={{ color: 'var(--text-muted)' }}>$</span>
                            <input
                                type="number"
                                className="setting__input"
                                value={gasFee}
                                onChange={(e) => setGasFee(e.target.value)}
                                min="0"
                                step="0.01"
                            />
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>/trade</span>
                        </div>
                    </div>
                </div>

                <div className="btn-group" style={{ marginTop: '24px' }}>
                    <button className="btn btn--secondary" onClick={onClose}>
                        Cancel
                    </button>
                    <button className="btn btn--primary" onClick={handleApply}>
                        Apply
                    </button>
                </div>
            </div>
        </div>
    );
}
