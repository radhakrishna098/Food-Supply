import React, { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  MessageSquare,
  Send,
  Phone,
  MessageCircle,
  X,
  User,
  Clock,
  CheckCheck,
} from 'lucide-react';

export default function ChatModal({
  donationId,
  donationTitle,
  contactPhone,
  contactName,
  isOpen,
  onClose,
}) {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [newText, setNewText] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);

  const fetchMessages = async () => {
    if (!donationId) return;
    try {
      const res = await api.get(`/chat/${donationId}`);
      if (res.data.success) {
        setMessages(res.data.messages);
      }
    } catch (err) {
      console.error('Failed to load chat thread:', err);
    }
  };

  useEffect(() => {
    if (isOpen && donationId) {
      setLoading(true);
      fetchMessages().finally(() => setLoading(false));

      // Light interval polling every 4 seconds while chat is active
      const interval = setInterval(fetchMessages, 4000);
      return () => clearInterval(interval);
    }
  }, [isOpen, donationId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!newText.trim() || sending) return;

    const textToSend = newText.trim();
    setNewText('');
    setSending(true);

    try {
      const res = await api.post(`/chat/${donationId}`, { text: textToSend });
      if (res.data.success) {
        setMessages((prev) => [...prev, res.data.message]);
      }
    } catch (err) {
      console.error('Failed to send message:', err);
    } finally {
      setSending(false);
    }
  };

  if (!isOpen) return null;

  const cleanPhone = contactPhone?.replace(/[^0-9]/g, '');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl border border-stone-200 overflow-hidden flex flex-col h-[600px] max-h-[90vh] animate-in fade-in zoom-in-95">
        {/* HEADER */}
        <div className="bg-forest-900 text-white p-4 sm:p-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-forest-800 flex items-center justify-center text-forest-200 shrink-0">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-sm sm:text-base leading-tight">Rescue Coordination</h3>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/30">
                  Direct In-Platform
                </span>
              </div>
              <p className="text-xs text-forest-200 truncate max-w-[260px] sm:max-w-xs mt-0.5">
                {donationTitle || 'Surplus Food Rescue'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-forest-800 text-forest-300 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* QUICK CONTACT BAR (Phone & WhatsApp) */}
        {contactPhone && (
          <div className="bg-cream-100/80 px-4 py-2 border-b border-cream-200 flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 text-stone-600 truncate">
              <span className="font-bold text-stone-800 truncate">{contactName || 'Partner'}:</span>
              <span className="font-mono">{contactPhone}</span>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <a
                href={`tel:${contactPhone}`}
                className="px-2.5 py-1 rounded-lg bg-white border border-stone-300 hover:bg-stone-50 font-bold text-stone-700 flex items-center gap-1 transition-colors shadow-2xs"
                title="Direct Phone Call"
              >
                <Phone className="w-3 h-3 text-emerald-600" />
                <span>Call</span>
              </a>

              {cleanPhone && (
                <a
                  href={`https://wa.me/${cleanPhone}?text=${encodeURIComponent(`Hi! I am coordinating on FoodLoop regarding "${donationTitle}".`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 font-bold text-white flex items-center gap-1 transition-colors shadow-2xs"
                  title="Open WhatsApp Chat"
                >
                  <MessageCircle className="w-3 h-3" />
                  <span>WhatsApp</span>
                </a>
              )}
            </div>
          </div>
        )}

        {/* MESSAGES THREAD */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-stone-50/50">
          {loading && messages.length === 0 ? (
            <div className="h-full flex items-center justify-center text-xs text-stone-400">
              Loading coordination messages...
            </div>
          ) : messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-2 text-stone-400">
              <MessageSquare className="w-8 h-8 text-stone-300" />
              <p className="text-xs font-semibold text-stone-600">No messages in this rescue thread yet.</p>
              <p className="text-[11px] text-stone-400 max-w-xs">
                Send a quick message to coordinate loading dock access, arrival estimated time, or storage containers.
              </p>
            </div>
          ) : (
            messages.map((m) => {
              const isMe = m.sender?._id === user?._id || m.sender === user?._id;
              const dateStr = new Date(m.createdAt).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              });

              return (
                <div
                  key={m._id}
                  className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                >
                  <div className="flex items-center gap-1.5 mb-1 px-1 text-[11px] text-stone-500">
                    <span className="font-bold text-stone-700">{m.senderName}</span>
                    <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 rounded bg-stone-200 text-stone-700">
                      {m.senderRole}
                    </span>
                    <span>• {dateStr}</span>
                  </div>

                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-xs shadow-2xs leading-relaxed ${
                      isMe
                        ? 'bg-forest-800 text-white rounded-br-xs'
                        : 'bg-white text-stone-800 border border-stone-200 rounded-bl-xs'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{m.text}</p>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* INPUT BOX */}
        <form onSubmit={handleSend} className="p-3 bg-white border-t border-stone-200 flex items-center gap-2">
          <input
            type="text"
            value={newText}
            onChange={(e) => setNewText(e.target.value)}
            placeholder="Type coordination message or pickup update..."
            className="flex-1 px-4 py-2.5 rounded-xl border border-stone-300 text-xs focus:ring-2 focus:ring-forest-800 focus:outline-none"
          />
          <button
            type="submit"
            disabled={!newText.trim() || sending}
            className="p-2.5 rounded-xl bg-forest-800 hover:bg-forest-900 text-white font-bold transition-colors disabled:opacity-40"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
