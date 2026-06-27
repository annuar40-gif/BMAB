import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api';

function StatCard({ title, value, icon, color, subtitle }) {
  const colors = {
    blue: 'bg-blue-50 text-blue-600 border-blue-100',
    green: 'bg-green-50 text-green-600 border-green-100',
    yellow: 'bg-yellow-50 text-yellow-600 border-yellow-100',
    purple: 'bg-purple-50 text-purple-600 border-purple-100',
  };
  return (
    <div className="card">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-medium text-gray-500">{title}</p>
        <span className={`text-2xl p-2 rounded-lg border ${colors[color]}`}>{icon}</span>
      </div>
      <p className="text-3xl font-bold text-gray-900">{value}</p>
      {subtitle && <p className="text-sm text-gray-400 mt-1">{subtitle}</p>}
    </div>
  );
}

function ProgressBar({ value }) {
  const w = Math.min(100, Math.round(value));
  const color = w >= 80 ? 'bg-green-500' : w >= 50 ? 'bg-amber-500' : 'bg-red-400';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 bg-gray-100 rounded-full h-2">
        <div className={`h-2 rounded-full ${color}`} style={{ width: `${w}%` }} />
      </div>
      <span className="text-xs text-gray-500 w-10 text-right">{w}%</span>
    </div>
  );
}

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('modules');

  useEffect(() => {
    api.get('/admin/stats').then(r => setStats(r.data)).finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>
  );

  const { totalUsers, totalModules, totalCertificates, activeUsers, moduleStats, recentActivity, userProgress } = stats;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Overview</h1>
          <p className="text-gray-500 mt-1">Platform analytics and user progress</p>
        </div>
        <Link to="/admin/modules/new" className="btn-primary flex items-center gap-2">
          + New Module
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Learners" value={totalUsers} icon="👥" color="blue" subtitle={`${activeUsers} active`} />
        <StatCard title="Modules" value={totalModules} icon="📚" color="purple" />
        <StatCard title="Certificates Issued" value={totalCertificates} icon="🏆" color="yellow" />
        <StatCard title="Active Learners" value={activeUsers} icon="⚡" color="green" subtitle="started at least 1 module" />
      </div>

      {/* Module Performance */}
      <div className="card">
        <div className="flex items-center gap-4 mb-6 border-b border-gray-100 -mx-6 px-6 pb-4">
          <h2 className="text-lg font-semibold text-gray-900 flex-1">Learning Analytics</h2>
          <div className="flex gap-1">
            {[{ id: 'modules', label: 'By Module' }, { id: 'users', label: 'By User' }, { id: 'activity', label: 'Recent Activity' }].map(t => (
              <button key={t.id} onClick={() => setActiveTab(t.id)}
                className={`px-3 py-1.5 text-sm rounded-lg font-medium transition-colors ${activeTab === t.id ? 'bg-blue-600 text-white' : 'text-gray-500 hover:bg-gray-100'}`}>
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {activeTab === 'modules' && (
          <div className="overflow-x-auto">
            {moduleStats.length === 0 ? (
              <div className="text-center py-8 text-gray-400">No modules yet</div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500 border-b border-gray-100">
                    <th className="pb-3 pr-4 font-medium">Module</th>
                    <th className="pb-3 pr-4 font-medium text-center">Enrolled</th>
                    <th className="pb-3 pr-4 font-medium text-center">Passed</th>
                    <th className="pb-3 pr-4 font-medium text-center">Certificates</th>
                    <th className="pb-3 font-medium">Avg Score</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {moduleStats.map(m => (
                    <tr key={m.id} className="hover:bg-gray-50">
                      <td className="py-3 pr-4">
                        <Link to={`/admin/modules/${m.id}/edit`} className="font-medium text-gray-900 hover:text-blue-600 line-clamp-1">
                          {m.title}
                        </Link>
                      </td>
                      <td className="py-3 pr-4 text-center text-gray-600">{m.enrolled}</td>
                      <td className="py-3 pr-4 text-center">
                        <span className={`font-medium ${m.passed > 0 ? 'text-green-600' : 'text-gray-400'}`}>{m.passed}</span>
                        {m.enrolled > 0 && <span className="text-gray-400 text-xs ml-1">({Math.round((m.passed/m.enrolled)*100)}%)</span>}
                      </td>
                      <td className="py-3 pr-4 text-center">
                        <span className="text-yellow-600 font-medium">{m.certificates}</span>
                      </td>
                      <td className="py-3 w-40">
                        {m.avg_score != null ? <ProgressBar value={m.avg_score} /> : <span className="text-gray-300 text-xs">No attempts</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {activeTab === 'users' && (
          <div className="overflow-x-auto">
            {userProgress.length === 0 ? (
              <div className="text-center py-8 text-gray-400">No users yet</div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500 border-b border-gray-100">
                    <th className="pb-3 pr-4 font-medium">User</th>
                    <th className="pb-3 pr-4 font-medium">Email</th>
                    <th className="pb-3 pr-4 font-medium text-center">Started</th>
                    <th className="pb-3 pr-4 font-medium text-center">Passed</th>
                    <th className="pb-3 font-medium text-center">Certificates</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {userProgress.map(u => (
                    <tr key={u.id} className="hover:bg-gray-50">
                      <td className="py-3 pr-4">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-semibold">
                            {u.name[0]?.toUpperCase()}
                          </div>
                          <span className="font-medium text-gray-900">{u.name}</span>
                        </div>
                      </td>
                      <td className="py-3 pr-4 text-gray-500">{u.email}</td>
                      <td className="py-3 pr-4 text-center text-gray-600">{u.modules_started}</td>
                      <td className="py-3 pr-4 text-center">
                        <span className={`font-medium ${u.modules_passed > 0 ? 'text-green-600' : 'text-gray-400'}`}>{u.modules_passed}</span>
                      </td>
                      <td className="py-3 text-center">
                        <span className={`font-medium ${u.certificates > 0 ? 'text-yellow-600' : 'text-gray-400'}`}>
                          {u.certificates > 0 ? `🏆 ${u.certificates}` : '—'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {activeTab === 'activity' && (
          <div className="space-y-3">
            {recentActivity.length === 0 ? (
              <div className="text-center py-8 text-gray-400">No activity yet</div>
            ) : (
              recentActivity.map((a, i) => (
                <div key={i} className="flex items-center gap-4 py-2 border-b border-gray-50 last:border-0">
                  <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-sm font-medium text-gray-600">
                    {a.name[0]?.toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{a.name}</p>
                    <p className="text-xs text-gray-400 truncate">{a.module_title}</p>
                  </div>
                  <div className="text-right">
                    <span className={`text-sm font-medium ${a.quiz_passed ? 'text-green-600' : 'text-amber-600'}`}>
                      {a.quiz_score != null ? `${a.quiz_score}%` : 'In progress'}
                    </span>
                    <p className="text-xs text-gray-400">{a.quiz_attempts} attempt{a.quiz_attempts !== 1 ? 's' : ''}</p>
                  </div>
                  {a.quiz_passed ? (
                    <span className="text-lg">🏆</span>
                  ) : (
                    <span className="text-lg">⏳</span>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
