import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../../api';

function SlideForm({ slide, onSave, onCancel, moduleId }) {
  const [form, setForm] = useState({ title: slide?.title || '', content: slide?.content || '', slide_order: slide?.slide_order || '' });
  const [imageFile, setImageFile] = useState(null);
  const [preview, setPreview] = useState(slide?.image_url || null);
  const [saving, setSaving] = useState(false);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    const fd = new FormData();
    fd.append('title', form.title);
    fd.append('content', form.content);
    if (form.slide_order) fd.append('slide_order', form.slide_order);
    if (imageFile) fd.append('image', imageFile);

    try {
      if (slide?.id) {
        await api.put(`/admin/modules/${moduleId}/slides/${slide.id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      } else {
        await api.post(`/admin/modules/${moduleId}/slides`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      }
      onSave();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to save slide');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="label">Slide Title</label>
        <input className="input" placeholder="e.g. Introduction" value={form.title}
          onChange={e => setForm({ ...form, title: e.target.value })} />
      </div>
      <div>
        <label className="label">Content</label>
        <textarea className="input min-h-32 resize-y" placeholder="Slide content or notes..."
          value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} />
      </div>
      <div>
        <label className="label">Image (optional)</label>
        <input type="file" accept="image/*" onChange={handleImageChange}
          className="block w-full text-sm text-gray-500 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-600 hover:file:bg-blue-100" />
        {preview && (
          <div className="mt-2 relative">
            <img src={preview} alt="Preview" className="h-32 rounded-lg object-cover border border-gray-200" />
            <button type="button" onClick={() => { setPreview(null); setImageFile(null); }}
              className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">×</button>
          </div>
        )}
      </div>
      <div>
        <label className="label">Order (optional)</label>
        <input type="number" className="input" placeholder="Slide number" value={form.slide_order}
          onChange={e => setForm({ ...form, slide_order: e.target.value })} />
      </div>
      <div className="flex gap-3 pt-2">
        <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Saving...' : slide?.id ? 'Update Slide' : 'Add Slide'}</button>
        <button type="button" className="btn-secondary" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  );
}

function QuestionForm({ question, onSave, onCancel, moduleId }) {
  const [form, setForm] = useState({
    question: question?.question || '',
    option_a: question?.option_a || '',
    option_b: question?.option_b || '',
    option_c: question?.option_c || '',
    option_d: question?.option_d || '',
    correct_answer: question?.correct_answer || 'a',
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (question?.id) {
        await api.put(`/admin/modules/${moduleId}/questions/${question.id}`, form);
      } else {
        await api.post(`/admin/modules/${moduleId}/questions`, form);
      }
      onSave();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to save question');
    } finally {
      setSaving(false);
    }
  };

  const opts = ['a', 'b', 'c', 'd'];
  const labels = { a: 'A', b: 'B', c: 'C', d: 'D' };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="label">Question <span className="text-red-500">*</span></label>
        <textarea className="input resize-y" rows={2} placeholder="Enter your question..." required
          value={form.question} onChange={e => setForm({ ...form, question: e.target.value })} />
      </div>
      {opts.map(opt => (
        <div key={opt} className={`flex items-center gap-3 p-3 rounded-lg border-2 transition-colors ${form.correct_answer === opt ? 'border-green-400 bg-green-50' : 'border-gray-200'}`}>
          <input type="radio" name="correct" value={opt} checked={form.correct_answer === opt}
            onChange={() => setForm({ ...form, correct_answer: opt })}
            className="w-4 h-4 accent-green-600 flex-shrink-0" />
          <span className={`font-semibold w-6 ${form.correct_answer === opt ? 'text-green-600' : 'text-gray-400'}`}>{labels[opt]}.</span>
          <input className="flex-1 bg-transparent outline-none text-sm" placeholder={`Option ${labels[opt]}...`} required
            value={form[`option_${opt}`]} onChange={e => setForm({ ...form, [`option_${opt}`]: e.target.value })} />
          {form.correct_answer === opt && <span className="text-green-500 text-xs font-medium">✓ Correct</span>}
        </div>
      ))}
      <p className="text-xs text-gray-400">Click the radio button to mark the correct answer</p>
      <div className="flex gap-3 pt-2">
        <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Saving...' : question?.id ? 'Update Question' : 'Add Question'}</button>
        <button type="button" className="btn-secondary" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  );
}

export default function AdminModuleEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isNew = !id;

  const [module, setModule] = useState(null);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [moduleForm, setModuleForm] = useState({ title: '', description: '', pass_score: 70 });
  const [thumbnail, setThumbnail] = useState(null);
  const [thumbnailPreview, setThumbnailPreview] = useState(null);

  const [activeSection, setActiveSection] = useState('details');
  const [showSlideForm, setShowSlideForm] = useState(false);
  const [editingSlide, setEditingSlide] = useState(null);
  const [showQuestionForm, setShowQuestionForm] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [uploadingPdf, setUploadingPdf] = useState(false);
  const [pdfProgress, setPdfProgress] = useState(null);

  const fetchModule = async () => {
    if (!id) return;
    try {
      const { data } = await api.get(`/admin/modules/${id}`);
      setModule(data);
      setModuleForm({ title: data.title, description: data.description || '', pass_score: data.pass_score });
      setThumbnailPreview(data.thumbnail);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchModule(); }, [id]);

  const handleSaveModule = async (e) => {
    e.preventDefault();
    setSaving(true);
    const fd = new FormData();
    fd.append('title', moduleForm.title);
    fd.append('description', moduleForm.description);
    fd.append('pass_score', moduleForm.pass_score);
    if (thumbnail) fd.append('thumbnail', thumbnail);

    try {
      if (isNew) {
        const { data } = await api.post('/admin/modules', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        navigate(`/admin/modules/${data.id}/edit`, { replace: true });
      } else {
        await api.put(`/admin/modules/${id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        await fetchModule();
        setActiveSection('slides');
      }
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to save module');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSlide = async (slideId) => {
    if (!window.confirm('Delete this slide?')) return;
    await api.delete(`/admin/modules/${id}/slides/${slideId}`);
    await fetchModule();
  };

  const handleDeleteQuestion = async (qId) => {
    if (!window.confirm('Delete this question?')) return;
    await api.delete(`/admin/modules/${id}/questions/${qId}`);
    await fetchModule();
  };

  const handlePdfUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingPdf(true);
    setPdfProgress('Processing PDF...');
    const fd = new FormData();
    fd.append('pdf', file);
    try {
      const { data } = await api.post(`/admin/modules/${id}/upload-pdf`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (e) => {
          if (e.total) {
            const pct = Math.round((e.loaded / e.total) * 100);
            setPdfProgress(`Uploading: ${pct}%`);
          }
        }
      });
      setPdfProgress(`✓ Created ${data.slideCount} slides!`);
      setTimeout(() => { setUploadingPdf(false); setPdfProgress(null); }, 2000);
      await fetchModule();
      e.target.value = '';
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to upload PDF');
      setUploadingPdf(false);
      setPdfProgress(null);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>
  );

  const sections = [
    { id: 'details', label: 'Module Details', icon: '⚙️' },
    { id: 'slides', label: `Slides (${module?.slides?.length || 0})`, icon: '📖', disabled: isNew },
    { id: 'questions', label: `Questions (${module?.questions?.length || 0})`, icon: '❓', disabled: isNew },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link to="/admin/modules" className="text-gray-400 hover:text-gray-600 text-sm">← Modules</Link>
        <span className="text-gray-300">/</span>
        <span className="text-sm text-gray-600 font-medium">{isNew ? 'New Module' : (module?.title || 'Edit')}</span>
      </div>

      <div className="flex gap-2 bg-gray-100 rounded-xl p-1 w-fit">
        {sections.map(s => (
          <button key={s.id} onClick={() => !s.disabled && setActiveSection(s.id)} disabled={s.disabled}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${activeSection === s.id ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>
            <span>{s.icon}</span>{s.label}
          </button>
        ))}
      </div>

      {activeSection === 'details' && (
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">{isNew ? 'Create New Module' : 'Edit Module'}</h2>
          <form onSubmit={handleSaveModule} className="space-y-5">
            <div>
              <label className="label">Module Title <span className="text-red-500">*</span></label>
              <input className="input" placeholder="e.g. Introduction to Web Development" required
                value={moduleForm.title} onChange={e => setModuleForm({ ...moduleForm, title: e.target.value })} />
            </div>
            <div>
              <label className="label">Description</label>
              <textarea className="input resize-y" rows={3} placeholder="Brief description of this module..."
                value={moduleForm.description} onChange={e => setModuleForm({ ...moduleForm, description: e.target.value })} />
            </div>
            <div>
              <label className="label">Pass Score (%)</label>
              <input type="number" className="input" min={0} max={100} value={moduleForm.pass_score}
                onChange={e => setModuleForm({ ...moduleForm, pass_score: e.target.value })} />
              <p className="text-xs text-gray-400 mt-1">Users need this score on the quiz to earn a certificate</p>
            </div>
            <div>
              <label className="label">Thumbnail Image</label>
              <input type="file" accept="image/*" onChange={e => {
                const f = e.target.files[0];
                if (f) { setThumbnail(f); setThumbnailPreview(URL.createObjectURL(f)); }
              }} className="block w-full text-sm text-gray-500 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-600 hover:file:bg-blue-100" />
              {thumbnailPreview && (
                <div className="mt-2">
                  <img src={thumbnailPreview} alt="Thumbnail" className="h-32 rounded-lg object-cover border border-gray-200" />
                </div>
              )}
            </div>
            <div className="flex gap-3 pt-2">
              <button type="submit" className="btn-primary" disabled={saving}>
                {saving ? 'Saving...' : isNew ? 'Create Module' : 'Save Changes'}
              </button>
              <Link to="/admin/modules" className="btn-secondary">Cancel</Link>
            </div>
          </form>
        </div>
      )}

      {activeSection === 'slides' && module && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Slides</h2>
            {!showSlideForm && !uploadingPdf && (
              <div className="flex gap-2">
                <label className="btn-primary flex items-center gap-2 cursor-pointer">
                  📄 Upload PDF
                  <input type="file" accept="application/pdf" onChange={handlePdfUpload} disabled={uploadingPdf} className="hidden" />
                </label>
                <button onClick={() => { setEditingSlide(null); setShowSlideForm(true); }} className="btn-primary">
                  + Add Slide
                </button>
              </div>
            )}
          </div>

          {uploadingPdf && (
            <div className="card bg-blue-50 border-blue-200">
              <div className="flex items-center gap-3">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                <span className="text-blue-700 font-medium">{pdfProgress}</span>
              </div>
            </div>
          )}

          {showSlideForm && (
            <div className="card border-blue-100">
              <h3 className="font-medium text-gray-900 mb-4">{editingSlide ? 'Edit Slide' : 'New Slide'}</h3>
              <SlideForm slide={editingSlide} moduleId={id} onSave={() => { setShowSlideForm(false); setEditingSlide(null); fetchModule(); }}
                onCancel={() => { setShowSlideForm(false); setEditingSlide(null); }} />
            </div>
          )}

          {module.slides.length === 0 && !showSlideForm ? (
            <div className="card text-center py-10">
              <div className="text-4xl mb-3">📄</div>
              <p className="text-gray-500">No slides yet. Add your first slide.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {module.slides.map((slide, idx) => (
                <div key={slide.id} className="card flex gap-4 items-start hover:shadow-md transition-shadow">
                  <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-semibold flex-shrink-0">
                    {idx + 1}
                  </div>
                  {slide.image_url && (
                    <img src={slide.image_url} alt="" className="w-16 h-12 object-cover rounded-lg flex-shrink-0 border border-gray-100" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900">{slide.title || <span className="text-gray-400">Untitled</span>}</p>
                    {slide.content && <p className="text-sm text-gray-500 mt-1 line-clamp-2">{slide.content}</p>}
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <button onClick={() => { setEditingSlide(slide); setShowSlideForm(true); }}
                      className="text-xs btn-secondary py-1.5 px-3">Edit</button>
                    <button onClick={() => handleDeleteSlide(slide.id)}
                      className="text-xs btn-danger py-1.5 px-3">Delete</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeSection === 'questions' && module && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">MCQ Questions</h2>
              <p className="text-sm text-gray-400 mt-0.5">Pass score: {module.pass_score}%</p>
            </div>
            {!showQuestionForm && (
              <button onClick={() => { setEditingQuestion(null); setShowQuestionForm(true); }} className="btn-primary">
                + Add Question
              </button>
            )}
          </div>

          {showQuestionForm && (
            <div className="card border-blue-100">
              <h3 className="font-medium text-gray-900 mb-4">{editingQuestion ? 'Edit Question' : 'New Question'}</h3>
              <QuestionForm question={editingQuestion} moduleId={id}
                onSave={() => { setShowQuestionForm(false); setEditingQuestion(null); fetchModule(); }}
                onCancel={() => { setShowQuestionForm(false); setEditingQuestion(null); }} />
            </div>
          )}

          {module.questions.length === 0 && !showQuestionForm ? (
            <div className="card text-center py-10">
              <div className="text-4xl mb-3">❓</div>
              <p className="text-gray-500">No questions yet. Add your first question.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {module.questions.map((q, idx) => (
                <div key={q.id} className="card hover:shadow-md transition-shadow">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-7 h-7 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center text-xs font-semibold flex-shrink-0">
                      {idx + 1}
                    </div>
                    <p className="font-medium text-gray-900 flex-1">{q.question}</p>
                    <div className="flex gap-2 flex-shrink-0">
                      <button onClick={() => { setEditingQuestion(q); setShowQuestionForm(true); }}
                        className="text-xs btn-secondary py-1.5 px-3">Edit</button>
                      <button onClick={() => handleDeleteQuestion(q.id)}
                        className="text-xs btn-danger py-1.5 px-3">Delete</button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 ml-10">
                    {['a', 'b', 'c', 'd'].map(opt => (
                      <div key={opt} className={`text-sm px-3 py-1.5 rounded-lg ${q.correct_answer === opt ? 'bg-green-100 text-green-800 font-medium' : 'bg-gray-50 text-gray-600'}`}>
                        <span className="font-medium mr-1">{opt.toUpperCase()}.</span>
                        {q[`option_${opt}`]}
                        {q.correct_answer === opt && <span className="ml-1 text-green-600">✓</span>}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
