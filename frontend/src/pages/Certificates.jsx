import React, { useState, useEffect, useRef } from 'react';
import api from '../api';
import { useAuth } from '../context/AuthContext';

function CertificateCard({ cert, user }) {
  const canvasRef = useRef(null);

  const downloadCertificate = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 1200;
    canvas.height = 850;
    const ctx = canvas.getContext('2d');

    // Background
    const grad = ctx.createLinearGradient(0, 0, 1200, 850);
    grad.addColorStop(0, '#1e3a8a');
    grad.addColorStop(1, '#1e40af');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 1200, 850);

    // White content area
    ctx.fillStyle = '#ffffff';
    ctx.roundRect(60, 60, 1080, 730, 20);
    ctx.fill();

    // Gold border
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 4;
    ctx.roundRect(60, 60, 1080, 730, 20);
    ctx.stroke();

    // Inner gold border
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 1.5;
    ctx.roundRect(80, 80, 1040, 690, 15);
    ctx.stroke();

    // Header background
    ctx.fillStyle = '#1e40af';
    ctx.roundRect(60, 60, 1080, 160, [20, 20, 0, 0]);
    ctx.fill();

    // Trophy emoji area
    ctx.font = '70px serif';
    ctx.fillStyle = '#fbbf24';
    ctx.textAlign = 'center';
    ctx.fillText('🏆', 600, 145);

    // Certificate title
    ctx.fillStyle = '#1e3a8a';
    ctx.font = 'bold 52px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText('CERTIFICATE OF PARTICIPATION', 600, 310);

    // Divider
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(200, 330);
    ctx.lineTo(1000, 330);
    ctx.stroke();

    // "This is to certify that"
    ctx.font = 'italic 24px Georgia, serif';
    ctx.fillStyle = '#6b7280';
    ctx.textAlign = 'center';
    ctx.fillText('This is to certify that', 600, 390);

    // Name
    ctx.font = 'bold 46px Georgia, serif';
    ctx.fillStyle = '#111827';
    ctx.textAlign = 'center';
    ctx.fillText(user?.name || 'Participant', 600, 450);

    // Underline
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 2;
    const nameWidth = ctx.measureText(user?.name || 'Participant').width;
    ctx.beginPath();
    ctx.moveTo(600 - nameWidth / 2, 465);
    ctx.lineTo(600 + nameWidth / 2, 465);
    ctx.stroke();

    // "has successfully completed"
    ctx.font = 'italic 22px Georgia, serif';
    ctx.fillStyle = '#6b7280';
    ctx.textAlign = 'center';
    ctx.fillText('has successfully completed the module', 600, 510);

    // Module title
    ctx.font = 'bold 32px Georgia, serif';
    ctx.fillStyle = '#1e40af';
    ctx.textAlign = 'center';
    const maxWidth = 900;
    const moduleTitle = cert.module_title;
    if (ctx.measureText(`"${moduleTitle}"`).width > maxWidth) {
      ctx.font = 'bold 24px Georgia, serif';
    }
    ctx.fillText(`"${moduleTitle}"`, 600, 565);

    // Date
    const dateStr = new Date(cert.issued_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    ctx.font = '18px Georgia, serif';
    ctx.fillStyle = '#6b7280';
    ctx.textAlign = 'center';
    ctx.fillText(`Issued on ${dateStr}`, 600, 615);

    // Certificate ID
    ctx.font = '13px monospace';
    ctx.fillStyle = '#9ca3af';
    ctx.textAlign = 'center';
    ctx.fillText(`Certificate ID: ${cert.certificate_id}`, 600, 700);

    // Seal
    ctx.beginPath();
    ctx.arc(600, 655, 35, 0, Math.PI * 2);
    ctx.fillStyle = '#1e40af';
    ctx.fill();
    ctx.font = 'bold 14px sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.fillText('CERTIFIED', 600, 659);

    // Download
    const link = document.createElement('a');
    link.download = `certificate-${cert.certificate_id}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  const issueDate = new Date(cert.issued_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div className="card border-2 border-yellow-200 hover:border-yellow-400 transition-colors">
      <div className="bg-gradient-to-r from-blue-700 to-indigo-800 rounded-xl p-6 mb-4 text-center text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-2 left-4 text-6xl text-yellow-300">✦</div>
          <div className="absolute bottom-2 right-4 text-6xl text-yellow-300">✦</div>
        </div>
        <div className="text-4xl mb-2">🏆</div>
        <div className="text-xs uppercase tracking-widest text-blue-200 mb-1">Certificate of Participation</div>
        <div className="font-bold text-lg">{cert.module_title}</div>
      </div>

      <div className="space-y-2 text-sm text-gray-600 mb-4">
        <div className="flex justify-between">
          <span className="text-gray-400">Recipient</span>
          <span className="font-medium text-gray-700">{user?.name}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">Issued</span>
          <span className="font-medium text-gray-700">{issueDate}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">Certificate ID</span>
          <span className="font-mono text-xs text-gray-500 truncate ml-4">{cert.certificate_id}</span>
        </div>
      </div>

      <button onClick={downloadCertificate} className="btn-primary w-full flex items-center justify-center gap-2">
        <span>⬇</span> Download Certificate
      </button>
    </div>
  );
}

export default function Certificates() {
  const { user } = useAuth();
  const [certs, setCerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/certificates').then(r => setCerts(r.data)).finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>
  );

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">My Certificates 🏆</h1>
        <p className="text-gray-500 mt-1">Download and share your achievements</p>
      </div>

      {certs.length === 0 ? (
        <div className="card text-center py-16">
          <div className="text-5xl mb-4">🎯</div>
          <h3 className="text-lg font-semibold text-gray-700">No certificates yet</h3>
          <p className="text-gray-500 mt-1">Complete a module and pass the quiz to earn your certificate</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {certs.map(cert => <CertificateCard key={cert.id} cert={cert} user={user} />)}
        </div>
      )}
    </div>
  );
}
