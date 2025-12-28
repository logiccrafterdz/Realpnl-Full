export default function MetricCard({
    label,
    value,
    context,
    isPositive = null,
    isEstimate = false,
    large = false
}) {
    const valueClass = isPositive === null
        ? ''
        : isPositive
            ? 'metric-card__value--positive'
            : 'metric-card__value--negative';

    return (
        <div className={`card metric-card ${large ? 'metric-card--large' : ''}`}>
            <span className="metric-card__label">
                {label}
                {isEstimate && (
                    <span className="metric-card__badge metric-card__badge--estimate">
                        Estimate
                    </span>
                )}
            </span>
            <span className={`metric-card__value ${valueClass}`} style={large ? { fontSize: '2.25rem' } : {}}>
                {value}
            </span>
            {context && (
                <span className="metric-card__context">{context}</span>
            )}
        </div>
    );
}
