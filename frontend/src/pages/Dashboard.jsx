import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';

function ProgressBar({ value, max, color = 'blue' }) {
  const pct = max ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div className="w-full bg-gray-100 rounded-full h-2">
      <div className={`h-2 rounded-full bg-${color}-500 transition-all`} style={{ width: `${pct}%` }} />
    </div>
  );
}

function ModuleCard({ module }) {
  const { progress, slideCount, questionCount, hasCertificate } = module;
  const slidesCompleted = progress?.slides_completed || 0;
  const quizPassed = progress?.quiz_passed;
  const quizScore = progress?.quiz_score;

  let status = 'not-started';
  if (hasCertificate || quizPassed) status = 'completed';
  else if (slidesCompleted > 0 || progress?.quiz_attempts > 0) status = 'in-progress';

  const statusConfig = {
    'not-started': { label: 'Start Learning', color: 'bg-blue-50 text-blue-700', badge: 'New' },
    'in-progress': { label: 'Continue', color: 'bg-amber-50 text-amber-700', badge: 'In Progress' },
    'completed': { label: 'Review', color: 'bg-green-50 text-green-700', badge: 'Completed' },
  };
  const sc = statusConfig[status];

  return (
    <Link to={`/modules/${module.id}`} className="card hover:shadow-md transition-shadow group">
      {module.thumbnail && (
        <div className="h-40 -mx-6 -mt-6 mb-4 rounded-t-xl overflow-hidden bg-gray-100">
          <img src={module.thumbnail} alt={module.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        </div>
      )}
      {!module.thumbnail && (
        <div className="h-32 -mx-6 -mt-6 mb-4 rounded-t-xl bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center text-5xl">
          📚
        </div>
      )}
      <div className="flex items-start justify-between mb-2">
        <h3 className="font-semibold text-gray-900 text-lg leading-tight flex-1 pr-2">{module.title}</h3>
        <span className={`text-xs font-medium px-2 py-1 rounded-full whitespace-nowrap ${sc.color}`}>{sc.badge}</span>
      </div>
      {module.description && <p className="text-gray-500 text-sm mb-4 line-clamp-2">{module.description}</p>}

      <div className="space-y-3 mt-auto">
        <div>
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>Slides</span>
            <span>{slidesCompleted}/{slideCount}</span>
          </div>
          <ProgressBar value={slidesCompleted} max={slideCount} color="blue" />
        </div>

        <div className="flex items-center gap-4 text-xs text-gray-400">
          <span>📖 {slideCount} slides</span>
          <span>❓ {questionCount} questions</span>
          {quizScore !== null && quizScore !== undefined && (
            <span className={quizPassed ? 'text-green-600' : 'text-amber-600'}>
              {quizPassed ? '✓' : '✗'} {quizScore}%
            </span>
          )}
          {hasCertificate && <span className="text-yellow-600">🏆 Certified</span>}
        </div>
      </div>
    </Link>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/modules').then(r => setModules(r.data)).finally(() => setLoading(false));
  }, []);

  const completed = modules.filter(m => m.progress?.quiz_passed).length;
  const inProgress = modules.filter(m => m.progress && !m.progress.quiz_passed && (m.progress.slides_completed > 0 || m.progress.quiz_attempts > 0)).length;

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>
  );

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Welcome back, {user?.name}! 👋</h1>
        <p className="text-gray-500 mt-1">Continue your learning journey</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Modules', value: modules.length, icon: '📚', color: 'blue' },
          { label: 'In Progress', value: inProgress, icon: '⏳', color: 'amber' },
          { label: 'Completed', value: completed, icon: '✅', color: 'green' },
          { label: 'Certificates', value: modules.filter(m => m.hasCertificate).length, icon: '🏆', color: 'yellow' },
        ].map(stat => (
          <div key={stat.label} className="card">
            <div className="text-2xl mb-1">{stat.icon}</div>
            <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
            <div className="text-sm text-gray-500">{stat.label}</div>
          </div>
        ))}
      </div>

      {modules.length === 0 ? (
        <div className="text-center py-16 card">
          <div className="text-5xl mb-4">📭</div>
          <h3 className="text-lg font-semibold text-gray-700">No modules yet</h3>
          <p className="text-gray-500 mt-1">Check back later for new learning content</p>
        </div>
      ) : (
        <>
          <h2 className="text-lg font-semibold text-gray-800 mb-4">All Modules</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {modules.map(m => <ModuleCard key={m.id} module={m} />)}
          </div>
        </>
      )}
    </div>
  );
}
