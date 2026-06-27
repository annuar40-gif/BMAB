import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../api';

function SlideViewer({ slides, currentSlide, onNext, onPrev, onComplete }) {
  const slide = slides[currentSlide];
  const isLast = currentSlide === slides.length - 1;

  if (!slide) return null;

  return (
    <div className="card min-h-96 flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded">
            Slide {currentSlide + 1} of {slides.length}
          </span>
        </div>
        <div className="flex gap-1">
          {slides.map((_, i) => (
            <div key={i} className={`h-1.5 w-6 rounded-full transition-colors ${i <= currentSlide ? 'bg-blue-500' : 'bg-gray-200'}`} />
          ))}
        </div>
      </div>

      {slide.image_url && (
        <div className="mb-4 rounded-xl overflow-hidden bg-gray-50 border">
          <img src={slide.image_url} alt={slide.title || `Slide ${currentSlide + 1}`}
            className="w-full max-h-80 object-contain mx-auto" />
        </div>
      )}

      <div className="flex-1">
        {slide.title && <h2 className="text-xl font-bold text-gray-900 mb-3">{slide.title}</h2>}
        {slide.content && (
          <div className="text-gray-700 leading-relaxed whitespace-pre-wrap text-base">{slide.content}</div>
        )}
        {!slide.content && !slide.image_url && (
          <div className="flex items-center justify-center h-40 text-gray-400 text-4xl">📄</div>
        )}
      </div>

      <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-100">
        <button onClick={onPrev} disabled={currentSlide === 0}
          className="btn-secondary disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2">
          ← Previous
        </button>
        {isLast ? (
          <button onClick={onComplete} className="btn-primary flex items-center gap-2">
            Complete & Take Quiz →
          </button>
        ) : (
          <button onClick={onNext} className="btn-primary flex items-center gap-2">
            Next →
          </button>
        )}
      </div>
    </div>
  );
}

function QuizView({ questions, onSubmit, passScore, previousScore, quizPassed }) {
  const [answers, setAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const allAnswered = questions.every(q => answers[q.id]);
  const options = ['a', 'b', 'c', 'd'];
  const optionLabels = { a: 'A', b: 'B', c: 'C', d: 'D' };

  const handleSubmit = async () => {
    if (!allAnswered) return;
    setSubmitting(true);
    await onSubmit(answers);
    setSubmitting(false);
  };

  return (
    <div className="space-y-6">
      <div className="card bg-blue-50 border-blue-100">
        <div className="flex items-start gap-3">
          <span className="text-2xl">📝</span>
          <div>
            <h3 className="font-semibold text-blue-900">Module Quiz</h3>
            <p className="text-blue-700 text-sm mt-1">
              Answer all {questions.length} questions. You need {passScore}% to pass and earn your certificate.
              {previousScore !== null && previousScore !== undefined && (
                <span className="ml-2">Previous best: <strong>{previousScore}%</strong></span>
              )}
            </p>
          </div>
        </div>
      </div>

      {questions.map((q, idx) => (
        <div key={q.id} className="card">
          <p className="font-semibold text-gray-900 mb-4">
            <span className="text-blue-500 mr-2">Q{idx + 1}.</span>
            {q.question}
          </p>
          <div className="space-y-2">
            {options.map(opt => {
              const text = q[`option_${opt}`];
              const selected = answers[q.id] === opt;
              return (
                <label key={opt}
                  className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${selected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'}`}>
                  <input type="radio" name={`q${q.id}`} value={opt} checked={selected}
                    onChange={() => setAnswers({ ...answers, [q.id]: opt })}
                    className="mt-0.5 accent-blue-600" />
                  <span className="text-gray-700">
                    <span className="font-medium text-gray-500 mr-1">{optionLabels[opt]}.</span>
                    {text}
                  </span>
                </label>
              );
            })}
          </div>
        </div>
      ))}

      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">{Object.keys(answers).length}/{questions.length} answered</p>
        <button onClick={handleSubmit} disabled={!allAnswered || submitting} className="btn-primary px-8 py-3">
          {submitting ? 'Submitting...' : 'Submit Quiz'}
        </button>
      </div>
    </div>
  );
}

function QuizResult({ result, passScore, onRetry, moduleId }) {
  const { score, passed, correct, total, certificate } = result;

  return (
    <div className="space-y-6">
      <div className={`card text-center border-2 ${passed ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
        <div className="text-5xl mb-3">{passed ? '🎉' : '😔'}</div>
        <h2 className="text-2xl font-bold text-gray-900">{passed ? 'Congratulations!' : 'Keep Trying!'}</h2>
        <p className="text-gray-600 mt-1">{passed ? `You passed with ${score}%` : `You scored ${score}% (need ${passScore}%)`}</p>

        <div className="flex items-center justify-center gap-8 mt-6">
          <div>
            <div className="text-3xl font-bold text-gray-900">{score}%</div>
            <div className="text-sm text-gray-500">Score</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-gray-900">{correct}/{total}</div>
            <div className="text-sm text-gray-500">Correct</div>
          </div>
          <div>
            <div className={`text-3xl font-bold ${passed ? 'text-green-600' : 'text-red-600'}`}>
              {passed ? 'PASS' : 'FAIL'}
            </div>
            <div className="text-sm text-gray-500">Result</div>
          </div>
        </div>
      </div>

      {passed && certificate && (
        <div className="card border-yellow-200 bg-yellow-50 text-center">
          <div className="text-4xl mb-2">🏆</div>
          <h3 className="font-semibold text-yellow-800 text-lg">Certificate Earned!</h3>
          <p className="text-yellow-700 text-sm mt-1">Certificate ID: {certificate.certificate_id}</p>
          <Link to="/certificates" className="btn-primary mt-4 inline-block">
            View My Certificates
          </Link>
        </div>
      )}

      <div className="card">
        <h3 className="font-semibold text-gray-800 mb-4">Review Answers</h3>
        <div className="space-y-3">
          {result.results.map((r, i) => (
            <div key={r.questionId} className={`flex items-center gap-3 p-3 rounded-lg ${r.isCorrect ? 'bg-green-50' : 'bg-red-50'}`}>
              <span className={`text-lg ${r.isCorrect ? 'text-green-600' : 'text-red-600'}`}>
                {r.isCorrect ? '✓' : '✗'}
              </span>
              <span className="text-sm text-gray-700">Question {i + 1}</span>
              {!r.isCorrect && (
                <span className="text-xs text-red-600 ml-auto">
                  Correct: <strong>{r.correctAnswer?.toUpperCase()}</strong>
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {!passed && (
        <div className="flex justify-center">
          <button onClick={onRetry} className="btn-primary px-8 py-3">
            Retry Quiz
          </button>
        </div>
      )}
    </div>
  );
}

export default function ModuleView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [module, setModule] = useState(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('slides'); // slides | quiz | result
  const [currentSlide, setCurrentSlide] = useState(0);
  const [quizResult, setQuizResult] = useState(null);

  const fetchModule = useCallback(async () => {
    try {
      const { data } = await api.get(`/modules/${id}`);
      setModule(data);
      const savedSlide = data.progress?.slides_completed || 0;
      if (data.progress?.quiz_passed) {
        setView('result');
      } else {
        setCurrentSlide(Math.min(savedSlide, Math.max(0, data.slides.length - 1)));
      }
    } catch {
      navigate('/');
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => { fetchModule(); }, [fetchModule]);

  const handleSlideChange = async (newSlide) => {
    setCurrentSlide(newSlide);
    await api.post(`/modules/${id}/progress`, { slidesCompleted: newSlide + 1 });
  };

  const handleQuizSubmit = async (answers) => {
    const { data } = await api.post(`/modules/${id}/quiz`, { answers });
    setQuizResult(data);
    setView('result');
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>
  );

  if (!module) return null;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link to="/" className="text-gray-400 hover:text-gray-600 text-sm">← Back</Link>
        <span className="text-gray-300">/</span>
        <span className="text-sm text-gray-600 font-medium truncate">{module.title}</span>
      </div>

      <div className="flex items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{module.title}</h1>
          {module.description && <p className="text-gray-500 mt-1">{module.description}</p>}
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-1 mb-6 bg-gray-100 rounded-xl p-1 w-fit">
        <button onClick={() => setView('slides')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${view === 'slides' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>
          📖 Slides ({module.slides.length})
        </button>
        <button onClick={() => setView('quiz')}
          disabled={module.slides.length > 0 && (module.progress?.slides_completed || 0) < module.slides.length}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-40 ${view === 'quiz' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>
          📝 Quiz ({module.questions.length})
        </button>
        {(quizResult || module.progress?.quiz_passed) && (
          <button onClick={() => setView('result')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${view === 'result' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>
            📊 Result
          </button>
        )}
      </div>

      {view === 'slides' && module.slides.length === 0 && (
        <div className="card text-center py-12">
          <div className="text-4xl mb-3">📭</div>
          <p className="text-gray-500">No slides available yet</p>
          {module.questions.length > 0 && (
            <button onClick={() => setView('quiz')} className="btn-primary mt-4">Go to Quiz</button>
          )}
        </div>
      )}

      {view === 'slides' && module.slides.length > 0 && (
        <SlideViewer
          slides={module.slides}
          currentSlide={currentSlide}
          onPrev={() => handleSlideChange(currentSlide - 1)}
          onNext={() => handleSlideChange(currentSlide + 1)}
          onComplete={() => {
            handleSlideChange(module.slides.length - 1);
            setView('quiz');
          }}
        />
      )}

      {view === 'quiz' && !quizResult && (
        <QuizView
          questions={module.questions}
          passScore={module.pass_score}
          previousScore={module.progress?.quiz_score}
          quizPassed={module.progress?.quiz_passed}
          onSubmit={handleQuizSubmit}
        />
      )}

      {view === 'quiz' && quizResult && (
        <QuizResult result={quizResult} passScore={module.pass_score} onRetry={() => { setQuizResult(null); }} moduleId={id} />
      )}

      {view === 'result' && (
        <div>
          {quizResult ? (
            <QuizResult result={quizResult} passScore={module.pass_score} onRetry={() => { setQuizResult(null); setView('quiz'); }} moduleId={id} />
          ) : module.progress?.quiz_passed ? (
            <div className="card text-center border-2 border-green-200 bg-green-50">
              <div className="text-5xl mb-3">🎉</div>
              <h2 className="text-2xl font-bold text-gray-900">Module Completed!</h2>
              <p className="text-gray-600 mt-1">You passed with {module.progress.quiz_score}%</p>
              {module.certificate && (
                <div className="mt-4">
                  <p className="text-sm text-green-700 font-medium">Certificate ID: {module.certificate.certificate_id}</p>
                  <Link to="/certificates" className="btn-primary mt-3 inline-block">View Certificate</Link>
                </div>
              )}
            </div>
          ) : (
            <div className="card text-center">
              <p className="text-gray-500">No quiz result yet. Take the quiz to earn your certificate!</p>
              <button onClick={() => setView('quiz')} className="btn-primary mt-4">Take Quiz</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
