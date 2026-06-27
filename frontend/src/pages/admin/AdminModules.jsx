import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api';

export default function AdminModules() {
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(null);

  const fetchModules = () => {
    api.get('/admin/modules').then(r => setModules(r.data)).finally(() => setLoading(false));
  };

  useEffect(() => { fetchModules(); }, []);

  const handleDelete = async (id, title) => {
    if (!window.confirm(`Delete "${title}"? This cannot be undone.`)) return;
    setDeleting(id);
    try {
      await api.delete(`/admin/modules/${id}`);
      setModules(prev => prev.filter(m => m.id !== id));
    } catch {
      alert('Failed to delete module');
    } finally {
      setDeleting(null);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Modules</h1>
          <p className="text-gray-500 text-sm mt-1">{modules.length} module{modules.length !== 1 ? 's' : ''} total</p>
        </div>
        <Link to="/admin/modules/new" className="btn-primary flex items-center gap-2">
          + New Module
        </Link>
      </div>

      {modules.length === 0 ? (
        <div className="card text-center py-16">
          <div className="text-5xl mb-4">📭</div>
          <h3 className="text-lg font-semibold text-gray-700">No modules yet</h3>
          <p className="text-gray-500 mt-1 mb-6">Create your first learning module</p>
          <Link to="/admin/modules/new" className="btn-primary inline-block">Create Module</Link>
        </div>
      ) : (
        <div className="card overflow-hidden p-0">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-6 py-3 font-medium text-gray-500">Module</th>
                <th className="text-center px-4 py-3 font-medium text-gray-500">Slides</th>
                <th className="text-center px-4 py-3 font-medium text-gray-500">Questions</th>
                <th className="text-center px-4 py-3 font-medium text-gray-500">Pass Score</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Created</th>
                <th className="text-right px-6 py-3 font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {modules.map(m => (
                <tr key={m.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {m.thumbnail ? (
                        <img src={m.thumbnail} alt="" className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center text-lg flex-shrink-0">📚</div>
                      )}
                      <div>
                        <p className="font-medium text-gray-900">{m.title}</p>
                        {m.description && <p className="text-gray-400 text-xs line-clamp-1 mt-0.5">{m.description}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-center">
                    <span className={`font-medium ${m.slideCount > 0 ? 'text-blue-600' : 'text-gray-300'}`}>{m.slideCount}</span>
                  </td>
                  <td className="px-4 py-4 text-center">
                    <span className={`font-medium ${m.questionCount > 0 ? 'text-purple-600' : 'text-gray-300'}`}>{m.questionCount}</span>
                  </td>
                  <td className="px-4 py-4 text-center">
                    <span className="text-gray-600 font-medium">{m.pass_score}%</span>
                  </td>
                  <td className="px-4 py-4 text-gray-400 text-xs">
                    {new Date(m.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <Link to={`/admin/modules/${m.id}/edit`} className="btn-secondary text-xs py-1.5 px-3">
                        Edit
                      </Link>
                      <button onClick={() => handleDelete(m.id, m.title)} disabled={deleting === m.id}
                        className="btn-danger text-xs py-1.5 px-3 disabled:opacity-50">
                        {deleting === m.id ? '...' : 'Delete'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
