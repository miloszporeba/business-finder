export default function ProgressBar({ message, current, total }) {
  const percent = total > 0 ? Math.round((current / total) * 100) : 0;

  return (
    <div className="progress-section">
      <p className="progress-message">{message}</p>
      <div className="progress-bar-track">
        <div
          className="progress-bar-fill"
          style={{ width: `${percent}%` }}
        />
      </div>
      <p className="progress-detail">
        {current} / {total} ({percent}%)
      </p>
    </div>
  );
}
