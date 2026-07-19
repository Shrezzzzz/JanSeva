import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import confetti from 'canvas-confetti';
import { CheckCircle, Share2, ArrowRight, ArrowLeft, Twitter, User, Sparkles } from 'lucide-react';
import MediaUpload, { type FilePreview } from './MediaUpload';
import AICategorizer from './AICategorizer';
import LocationPicker from './LocationPicker';
import VoiceInput from './VoiceInput';
import Button from '../ui/Button';
import { useGroqAI } from '../../hooks/useGroqAI';
import { uploadFiles } from '../../services/uploadService';
import { createIssue, fetchIssueById, joinDuplicateIssue } from '../../services/issueService';
import { useUIStore } from '../../store/uiStore';
import { useAuthStore } from '../../store/authStore';
import { ROUTES } from '../../config/routes';
import type { Category, Issue, Severity } from '../../types/issue.types';
import { issueIdDisplay } from '../../utils/formatters';

type Step = 1 | 2 | 3 | 'success';

const SEVERITY_OPTIONS: Severity[] = ['Low', 'Medium', 'High'];

export default function ReportForm() {
  const navigate = useNavigate();
  const { addToast } = useUIStore();
  const { isAuthenticated } = useAuthStore();
  const { result: aiResult, loading: aiLoading, analyzeImage } = useGroqAI();

  const [step,        setStep]        = useState<Step>(1);
  const [previews,    setPreviews]    = useState<FilePreview[]>([]);
  const [category,    setCategory]    = useState<Category | null>(null);
  const [lat,         setLat]         = useState<number | null>(null);
  const [lng,         setLng]         = useState<number | null>(null);
  const [address,     setAddress]     = useState('');
  const [zone,        setZone]        = useState('');
  const [description, setDescription] = useState('');
  const [severity,    setSeverity]    = useState<Severity>('Medium');
  const [anonymous,   setAnonymous]   = useState(false);
  const [overrideMode, setOverrideMode] = useState(false);
  const [submitting,  setSubmitting]  = useState(false);
  const [issueId,     setIssueId]     = useState('');
  const [submittedIssue, setSubmittedIssue] = useState<Issue | null>(null);
  const [joiningDuplicate, setJoiningDuplicate] = useState(false);
  const [aiPollExhausted,  setAiPollExhausted]  = useState(false);

  const handleFirstImage = useCallback(async (file: File) => {
    await analyzeImage(file);
  }, [analyzeImage]);

  const handleLocationChange = (newLat: number, newLng: number, addr: string, z: string) => {
    setLat(newLat); setLng(newLng); setAddress(addr); setZone(z);
  };

  const handleOverride = (cat: Category) => setCategory(cat);

  const effectiveCategory = (category ?? aiResult?.category) as Category | null;

  async function handleSubmit() {
    // Validate required fields and show explicit errors instead of silently returning
    if (!lat || !lng) {
      addToast({ type: 'error', title: 'Location required', message: 'Go back to Step 2 and pin your location on the map.' });
      return;
    }
    if (!effectiveCategory) {
      addToast({ type: 'error', title: 'Category required', message: 'Go back to Step 1 and select a category for your issue.' });
      return;
    }
    setSubmitting(true);
    try {
      let mediaUrls: string[] = [];
      if (previews.length) {
        try {
          const uploaded = await uploadFiles(previews.map((p) => p.file));
          mediaUrls = uploaded.map((u) => u.url);
        } catch (uploadErr) {
          // Upload failure should not block submission — continue without media
          console.warn('Media upload failed, submitting without photos:', uploadErr);
          addToast({
            type:    'info',
            title:   'Photos skipped',
            message: 'Could not upload photos — your report was still submitted.',
          });
        }
      }

      // Auto-generate title if AI didn't produce one and location is known
      const locationLabel = zone || address || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
      const title =
        (aiResult?.title?.trim()) ||
        `${effectiveCategory} at ${locationLabel}`;

      const payload = {
        title,
        description,
        category:     effectiveCategory,
        severity:     aiResult?.severity ?? severity,
        latitude:     lat,
        longitude:    lng,
        address,
        zone,
        mediaUrls,
        isAnonymous:  anonymous,
        aiCategory:   aiResult?.category,
        aiConfidence: aiResult?.confidence,
        aiSeverity:   aiResult?.severity,
        estimatedResolutionDays: aiResult?.estimatedResolutionDays,
        department:   aiResult?.department,
      };

      const issue = await createIssue(payload);
      setIssueId(issue.id);
      setSubmittedIssue(issue);
      confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
      setStep('success');
    } catch (e) {
      const msg =
        (e as { response?: { data?: { error?: string; message?: string } } })
          ?.response?.data?.error ??
        (e as { response?: { data?: { error?: string; message?: string } } })
          ?.response?.data?.message ??
        (e as Error).message ??
        'Submission failed. Please try again.';
      console.error('SUBMIT ERROR:', e);
      addToast({ type: 'error', title: 'Submission failed', message: msg });
    } finally {
      setSubmitting(false);
    }
  }

  useEffect(() => {
    if (step !== 'success' || !issueId) return;
    let attempts = 0;
    const interval = window.setInterval(async () => {
      attempts += 1;
      try {
        const fresh = await fetchIssueById(issueId);
        setSubmittedIssue(fresh);
        if (fresh.aiAnalyzedAt || attempts >= 8) {
          window.clearInterval(interval);
          if (!fresh.aiAnalyzedAt) setAiPollExhausted(true);
        }
      } catch {
        if (attempts >= 8) {
          window.clearInterval(interval);
          setAiPollExhausted(true);
        }
      }
    }, 2500);
    return () => window.clearInterval(interval);
  }, [issueId, step]);

  async function handleJoinDuplicate() {
    if (!issueId) return;
    setJoiningDuplicate(true);
    try {
      const original = await joinDuplicateIssue(issueId);
      addToast({
        type: 'success',
        title: 'Joined existing report',
        message: 'Your verification was added to the original issue.',
      });
      navigate(`${ROUTES.TRACK}/${original.id}`);
    } catch (e) {
      addToast({
        type: 'error',
        title: 'Could not join report',
        message: (e as Error).message || 'Please track your new report instead.',
      });
    } finally {
      setJoiningDuplicate(false);
    }
  }

  const STEP_LABELS = ['What did you find?', 'Where is it?', 'Tell us more'];

  if (step === 'success') {
    const issueUrl  = `${window.location.origin}/track/${issueId}`;
    const shareText = `I just reported a civic issue on JanSeva! Help verify it: ${issueUrl}`;

    return (
      <div className="flex flex-col items-center text-center py-8 animate-scale-in">
        <div className="w-16 h-16 rounded-full bg-[#E8F5EE] flex items-center justify-center mb-4">
          <CheckCircle size={32} className="text-[#1A6B3C]" />
        </div>
        <h2 className="font-display text-2xl text-[#0D0D0B]">Issue Reported!</h2>
        <p className="text-sm text-[#6F6F6F] mt-2">Your report has been submitted to JanSeva.</p>
        <div className="mt-3 px-4 py-2 rounded-xl bg-[#F7F7F5] font-mono text-sm text-[#0D0D0B]">
          {issueIdDisplay(issueId)}
        </div>
        <p className="text-xs text-[#6F6F6F] mt-2">
          Estimated resolution: <strong>{submittedIssue?.estimatedResolutionDays ?? aiResult?.estimatedResolutionDays ?? 5} days</strong>
        </p>

        <div className="mt-5 w-full text-left rounded-2xl border border-[#E5E5E0] bg-white p-4 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Sparkles size={16} className="text-[#1A6B3C]" />
              <span className="text-sm font-semibold text-[#0D0D0B]">AI Civic Brief</span>
            </div>
            {submittedIssue?.priorityScore ? (
              <span className="text-xs font-bold text-[#1A6B3C] bg-[#E8F5EE] px-2.5 py-1 rounded-full">
                Priority {submittedIssue.priorityScore}
              </span>
            ) : aiPollExhausted ? (
              <span className="text-xs text-[#6F6F6F]">Check tracking page</span>
            ) : (
              <span className="text-xs text-[#6F6F6F]">Preparing...</span>
            )}
          </div>
          <p className="text-xs text-[#0D0D0B] leading-relaxed">
            {submittedIssue?.citizenGuidance?.issueSummary || submittedIssue?.authoritySummary || (
              aiPollExhausted
                ? 'Still processing — check back on the tracking page for department and priority details.'
                : 'JanSeva AI is analyzing priority, department, safety guidance, and next steps.'
            )}
          </p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="rounded-xl bg-[#F7F7F5] p-2">
              <span className="block text-[#6F6F6F]">Department</span>
              <strong className="text-[#0D0D0B]">{submittedIssue?.department || aiResult?.department || (aiPollExhausted ? '—' : 'Assigning')}</strong>
            </div>
            <div className="rounded-xl bg-[#F7F7F5] p-2">
              <span className="block text-[#6F6F6F]">Severity</span>
              <strong className="text-[#0D0D0B]">{submittedIssue?.aiSeverity || submittedIssue?.severity || aiResult?.severity || severity}</strong>
            </div>
          </div>
          {submittedIssue?.citizenGuidance?.personalizedAdvice && (
            <p className="text-xs text-[#6F6F6F] leading-relaxed">{submittedIssue.citizenGuidance.personalizedAdvice}</p>
          )}
          {submittedIssue?.duplicateOf && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 space-y-2">
              <p className="text-xs font-semibold text-amber-900">Possible existing report found.</p>
              <p className="text-xs text-amber-800">You can join the existing report to increase its verification count, or continue tracking this new report.</p>
              <Button fullWidth variant="outline" loading={joiningDuplicate} onClick={handleJoinDuplicate}>
                Join existing report
              </Button>
            </div>
          )}
        </div>

        {/* Primary CTAs */}
        <div className="mt-8 flex flex-col gap-3 w-full">
          <Button fullWidth onClick={() => navigate(`${ROUTES.TRACK}/${issueId}`)} icon={<ArrowRight size={15} />}>
            Track this issue
          </Button>
          <Button
            fullWidth
            variant="outline"
            onClick={() => navigate(isAuthenticated() ? ROUTES.PROFILE : '/login')}
            icon={<User size={15} />}
          >
            {isAuthenticated() ? 'View in my Profile' : 'Create account to track this'}
          </Button>
        </div>

        {/* Share buttons */}
        <div className="mt-4 flex flex-wrap gap-3 justify-center w-full">
          {/* WhatsApp */}
          <a
            href={`https://wa.me/?text=${encodeURIComponent(shareText)}`}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium text-white transition-opacity hover:opacity-90"
            style={{ backgroundColor: '#25D366' }}
          >
            {/* WhatsApp icon */}
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
            </svg>
            Share on WhatsApp
          </a>

          {/* X (Twitter) */}
          <a
            href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium text-white bg-black transition-opacity hover:opacity-80"
          >
            <Twitter size={15} />
            Share on X
          </a>

          {/* Copy link */}
          <Button
            variant="outline"
            onClick={() => navigator.clipboard.writeText(issueUrl)}
            icon={<Share2 size={15} />}
          >
            Copy Link
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Step indicator */}
      <div className="flex items-center gap-2">
        {([1, 2, 3] as const).map((s) => (
          <div key={s} className="flex items-center gap-2 flex-1">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium transition-colors ${
              step === s ? 'bg-[#1A6B3C] text-white' : (step as number) > s ? 'bg-[#E8F5EE] text-[#1A6B3C]' : 'bg-[#F7F7F5] text-[#6F6F6F]'
            }`}>
              {(step as number) > s ? '✓' : s}
            </div>
            {s < 3 && <div className={`flex-1 h-px ${(step as number) > s ? 'bg-[#1A6B3C]' : 'bg-[#E5E5E0]'}`} />}
          </div>
        ))}
      </div>

      <h3 className="font-display text-xl text-[#0D0D0B]">{STEP_LABELS[(step as number) - 1]}</h3>

      {step === 1 && (
        <div className="space-y-4">
          <MediaUpload previews={previews} onChange={setPreviews} onFirstImage={handleFirstImage} />
          <AICategorizer
            result={aiResult}
            loading={aiLoading}
            onOverride={handleOverride}
            overrideMode={overrideMode}
            setOverrideMode={setOverrideMode}
            selected={effectiveCategory}
          />
          {/* Show hint when photo uploaded but AI failed to categorize */}
          {previews.length > 0 && !effectiveCategory && !aiLoading && (
            <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 px-3 py-2 rounded-xl">
              AI couldn't detect a category — please select one manually above.
            </p>
          )}
          <Button
            fullWidth
            onClick={() => setStep(2)}
            disabled={!effectiveCategory}
            icon={<ArrowRight size={15} />}
          >
            Next: Set Location
          </Button>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <LocationPicker lat={lat} lng={lng} address={address} zone={zone} onChange={handleLocationChange} />
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setStep(1)} icon={<ArrowLeft size={15} />}>Back</Button>
            <Button fullWidth onClick={() => setStep(3)} disabled={!lat || !lng} icon={<ArrowRight size={15} />}>Next: Add Details</Button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-sm font-medium text-[#0D0D0B]">Description</label>
              <VoiceInput onTranscript={(t) => setDescription((d) => d ? `${d} ${t}` : t)} />
            </div>
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what you see…"
              className="w-full rounded-xl border border-[#E5E5E0] px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#1A6B3C] focus:border-transparent"
            />
          </div>

          <div>
            <p className="text-sm font-medium text-[#0D0D0B] mb-2">Severity (optional)</p>
            <div className="flex flex-wrap gap-2">
              {SEVERITY_OPTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => setSeverity(s)}
                  className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors ${
                    severity === s
                      ? 'border-[#1A6B3C] bg-[#E8F5EE] text-[#1A6B3C]'
                      : 'border-[#E5E5E0] text-[#6F6F6F] hover:border-[#0D0D0B]'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={anonymous}
              onChange={(e) => setAnonymous(e.target.checked)}
              className="w-4 h-4 rounded accent-[#1A6B3C]"
            />
            <span className="text-sm text-[#6F6F6F]">Report without showing my name</span>
          </label>

          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setStep(2)} icon={<ArrowLeft size={15} />}>Back</Button>
            <Button fullWidth onClick={handleSubmit} loading={submitting}>Submit to JanSeva</Button>
          </div>
        </div>
      )}
    </div>
  );
}
