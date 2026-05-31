export function TypingIndicator() {
  return (
    <div className="message-row assistant">
      <div className="typing-indicator">
        <div className="typing-dots">
          <div className="typing-dot" />
          <div className="typing-dot" />
          <div className="typing-dot" />
        </div>
        <span className="typing-label">PakLaw AI is thinking…</span>
      </div>
    </div>
  )
}
