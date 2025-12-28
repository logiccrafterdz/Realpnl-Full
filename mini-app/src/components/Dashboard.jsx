import MetricCard from './MetricCard';
import { formatCurrency, formatPercent } from '../utils/calculations';

export default function Dashboard({ metrics, warnings, onSettingsClick, onExportClick, onNewUpload }) {
    const { summary, feeLeak, winRate, pnl } = metrics;

    return (
        <div className="dashboard">
            {/* Summary Banner */}
            <div className="summary-banner">
                <p className="summary-banner__text">
                    Your real return after fees & timing:{' '}
                    <span className="summary-banner__highlight">
                        {formatPercent(summary.netPnLPercent)}
                    </span>
                    {' '}vs HODL{' '}
                    <span className="summary-banner__highlight">
                        {formatPercent(summary.hodlPercent)}
                    </span>
                </p>
            </div>

            {/* Warnings */}
            {warnings && warnings.length > 0 && (
                <div className="warnings">
                    {warnings.map((warning, index) => (
                        <div key={index} className="warning">
                            <span className="warning__icon">⚠️</span>
                            <span>{warning.message}</span>
                        </div>
                    ))}
                </div>
            )}

            {/* Main Metrics */}
            <div className="metrics-grid">
                <MetricCard
                    label="Net P&L"
                    value={formatCurrency(summary.netPnL)}
                    context={formatPercent(summary.netPnLPercent)}
                    isPositive={summary.netPnL >= 0}
                    large
                />
                <MetricCard
                    label="HODL Return"
                    value={formatCurrency(summary.hodlReturn)}
                    context={formatPercent(summary.hodlPercent)}
                    isPositive={summary.hodlReturn >= 0}
                    large
                />
            </div>

            <div className="metrics-grid">
                <MetricCard
                    label="vs HODL"
                    value={formatPercent(summary.vsHodl)}
                    context={summary.vsHodl >= 0 ? "Outperformed" : "Underperformed"}
                    isPositive={summary.vsHodl >= 0}
                />
                <MetricCard
                    label="Total Fees"
                    value={formatCurrency(summary.totalFees)}
                    context="Fees + Slippage + Gas"
                    isEstimate={feeLeak.isEstimate}
                />
            </div>

            <div className="metrics-grid">
                <MetricCard
                    label="Win Rate"
                    value={`${summary.winRate.toFixed(1)}%`}
                    context={`${winRate.winning}W / ${winRate.losing}L`}
                    isPositive={summary.winRate >= 50}
                />
                <MetricCard
                    label="Max Drawdown"
                    value={`${summary.maxDrawdown.toFixed(1)}%`}
                    context="Peak to trough"
                    isPositive={false}
                />
            </div>

            {/* Additional Stats */}
            <div className="card">
                <h3 style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '12px' }}>
                    Trade Summary
                </h3>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Total Bought</span>
                    <span style={{ fontWeight: 600 }}>{formatCurrency(pnl.totalBuyValue)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Total Sold</span>
                    <span style={{ fontWeight: 600 }}>{formatCurrency(pnl.totalSellValue)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Exchange Fees</span>
                    <span style={{ fontWeight: 600 }}>{formatCurrency(pnl.totalFees)}</span>
                </div>
            </div>

            {/* Actions */}
            <div className="btn-group">
                <button className="btn btn--primary" onClick={onExportClick}>
                    🔒 Export Report
                </button>
                <button className="btn btn--secondary" onClick={onSettingsClick}>
                    ⚙️ Settings
                </button>
            </div>

            <div style={{ marginTop: '12px' }}>
                <button className="btn btn--danger" onClick={onNewUpload}>
                    📤 New Upload
                </button>
            </div>
        </div>
    );
}
