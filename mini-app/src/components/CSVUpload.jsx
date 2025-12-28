import { useState, useRef } from 'react';

export default function CSVUpload({ onFileSelect, isLoading }) {
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef(null);

    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);

        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleFile(files[0]);
        }
    };

    const handleFileInput = (e) => {
        const files = e.target.files;
        if (files.length > 0) {
            handleFile(files[0]);
        }
    };

    const handleFile = (file) => {
        if (!file.name.endsWith('.csv')) {
            alert('Please upload a CSV file');
            return;
        }
        onFileSelect(file);
    };

    const handleClick = () => {
        fileInputRef.current?.click();
    };

    if (isLoading) {
        return (
            <div className="loading">
                <div className="loading__spinner"></div>
                <p className="loading__text">Analyzing your trades...</p>
            </div>
        );
    }

    return (
        <div
            className={`card card--upload ${isDragging ? 'dragging' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={handleClick}
        >
            <div className="upload__icon">📊</div>
            <h2 className="upload__title">Upload Trade History</h2>
            <p className="upload__text">
                Drag & drop your CSV file here, or click to browse
            </p>
            <p className="upload__text" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Required columns: date, symbol, action, price, amount
            </p>
            <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                className="upload__input"
                onChange={handleFileInput}
            />
        </div>
    );
}
