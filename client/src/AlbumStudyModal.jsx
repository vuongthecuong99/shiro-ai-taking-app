import { useState } from 'react';
import { generateSummaryFromText, generateQuizFromText, generateFlashcardsFromText } from './api/notes';

function AlbumStudyModal({ categoryName, notes, onClose }) {
  const [tab, setTab] = useState('summary');
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState('');
  const [quiz, setQuiz] = useState(null);
  const [flashcards, setFlashcards] = useState(null);
  const [currentCard, setCurrentCard] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [answers, setAnswers] = useState({});

  const combinedText = notes.map((n) => `${n.title}\n${n.content}`).join('\n\n---\n\n');

  const handleSummarize = async () => {
    setLoading(true);
    const res = await generateSummaryFromText(combinedText);
    setSummary(res.data.summary);
    setLoading(false);
  };

  const handleQuiz = async () => {
    setLoading(true);
    const res = await generateQuizFromText(combinedText);
    setQuiz(res.data.quiz);
    setAnswers({});
    setLoading(false);
  };

  const handleFlashcards = async () => {
    setLoading(true);
    const res = await generateFlashcardsFromText(combinedText);
    setFlashcards(res.data.flashcards);
    setCurrentCard(0);
    setFlipped(false);
    setLoading(false);
  };

  const overlayStyle = {
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
    background: 'rgba(0,0,0,0.6)', display: 'flex',
    alignItems: 'center', justifyContent: 'center', zIndex: 1000
  };
  const modalStyle = {
    background: '#1e1e1e', color: '#fff', borderRadius: 10,
    padding: 20, width: 500, maxHeight: '80vh', overflowY: 'auto'
  };
  const tabStyle = (active) => ({
    padding: '8px 16px', cursor: 'pointer',
    borderBottom: active ? '2px solid #7c5cff' : '2px solid transparent',
    fontWeight: active ? 'bold' : 'normal'
  });

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
        <h2>{categoryName} — Study All ({notes.length} notes)</h2>

        <div style={{ display: 'flex', gap: 10, marginBottom: 15, borderBottom: '1px solid #444' }}>
          <div style={tabStyle(tab === 'summary')} onClick={() => setTab('summary')}>Summary</div>
          <div style={tabStyle(tab === 'quiz')} onClick={() => setTab('quiz')}>Quiz</div>
          <div style={tabStyle(tab === 'flashcards')} onClick={() => setTab('flashcards')}>Flashcards</div>
        </div>

        {tab === 'summary' && (
          <div>
            <p>{summary || 'No summary yet.'}</p>
            <button onClick={handleSummarize} disabled={loading}>
              {loading ? 'Generating...' : 'Generate Summary'}
            </button>
          </div>
        )}

        {tab === 'quiz' && (
          <div>
            <button onClick={handleQuiz} disabled={loading}>
              {loading ? 'Generating...' : 'Generate Quiz'}
            </button>
            {quiz && quiz.map((q, i) => (
              <div key={i} style={{ marginTop: 15, padding: 10, border: '1px solid #444', borderRadius: 6 }}>
                <p><strong>Q{i + 1}: {q.question}</strong></p>
                {q.options.map((opt, j) => {
                  const isSelected = answers[i] === j;
                  const isCorrect = j === q.correctIndex;
                  const showResult = answers[i] !== undefined;
                  let bg = '#2a2a2a';
                  if (showResult && isSelected && isCorrect) bg = '#2e7d32';
                  if (showResult && isSelected && !isCorrect) bg = '#c62828';
                  if (showResult && !isSelected && isCorrect) bg = '#2e7d32';
                  return (
                    <div
                      key={j}
                      onClick={() => setAnswers({ ...answers, [i]: j })}
                      style={{ background: bg, padding: 8, marginTop: 5, borderRadius: 4, cursor: 'pointer' }}
                    >
                      {opt}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        )}

        {tab === 'flashcards' && (
          <div>
            <button onClick={handleFlashcards} disabled={loading}>
              {loading ? 'Generating...' : 'Generate Flashcards'}
            </button>
            {flashcards && flashcards.length > 0 && (
              <div style={{ marginTop: 15 }}>
                <div
                  onClick={() => setFlipped(!flipped)}
                  style={{
                    background: '#2a2a2a', padding: 30, borderRadius: 8,
                    minHeight: 100, cursor: 'pointer', textAlign: 'center'
                  }}
                >
                  {flipped ? flashcards[currentCard].back : flashcards[currentCard].front}
                </div>
                <p style={{ textAlign: 'center', marginTop: 5, fontSize: 12, color: '#888' }}>
                  Click card to flip
                </p>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10 }}>
                  <button
                    onClick={() => { setCurrentCard(Math.max(0, currentCard - 1)); setFlipped(false); }}
                    disabled={currentCard === 0}
                  >
                    Previous
                  </button>
                  <span>{currentCard + 1} / {flashcards.length}</span>
                  <button
                    onClick={() => { setCurrentCard(Math.min(flashcards.length - 1, currentCard + 1)); setFlipped(false); }}
                    disabled={currentCard === flashcards.length - 1}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        <button onClick={onClose} style={{ marginTop: 20 }}>Close</button>
      </div>
    </div>
  );
}

export default AlbumStudyModal;