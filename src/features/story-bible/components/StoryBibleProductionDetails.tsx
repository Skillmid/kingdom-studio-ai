"use client";

interface StoryBibleProductionDetailsProps {
  genre: string; targetAudience: string; tone: string; language: string; visualStyle: string; aspectRatio: string; durationMinutes: number; universe: string; timePeriod: string; primaryLocation: string;
  onGenreChange: (value: string) => void; onTargetAudienceChange: (value: string) => void; onToneChange: (value: string) => void; onLanguageChange: (value: string) => void; onVisualStyleChange: (value: string) => void; onAspectRatioChange: (value: string) => void; onDurationMinutesChange: (value: number) => void; onUniverseChange: (value: string) => void; onTimePeriodChange: (value: string) => void; onPrimaryLocationChange: (value: string) => void;
}

export default function StoryBibleProductionDetails({ genre, targetAudience, tone, language, visualStyle, aspectRatio, durationMinutes, universe, timePeriod, primaryLocation, onGenreChange, onTargetAudienceChange, onToneChange, onLanguageChange, onVisualStyleChange, onAspectRatioChange, onDurationMinutesChange, onUniverseChange, onTimePeriodChange, onPrimaryLocationChange }: StoryBibleProductionDetailsProps) {
  const inputClass = "w-full rounded-xl border border-zinc-700 bg-zinc-950 px-5 py-4 outline-none transition focus:border-yellow-500";
  return (
    <section className="rounded-3xl border border-zinc-800 bg-zinc-900 p-8">
      <div className="mb-8"><p className="text-sm uppercase tracking-[0.3em] text-yellow-500">Section 5</p><h2 className="mt-2 text-3xl font-bold">Production Details</h2><p className="mt-3 max-w-3xl text-zinc-400">Define the creative and technical details that shape the production and guide AI-assisted filmmaking.</p></div>
      <div className="grid gap-6 md:grid-cols-2">
        <label className="block text-sm font-medium text-zinc-300">Genre<input value={genre} onChange={(e) => onGenreChange(e.target.value)} placeholder="Drama" className={inputClass + " mt-2 font-normal"} /></label>
        <label className="block text-sm font-medium text-zinc-300">Target Audience<input value={targetAudience} onChange={(e) => onTargetAudienceChange(e.target.value)} placeholder="Youth, Families..." className={inputClass + " mt-2 font-normal"} /></label>
        <label className="block text-sm font-medium text-zinc-300">Tone<input value={tone} onChange={(e) => onToneChange(e.target.value)} placeholder="Hopeful" className={inputClass + " mt-2 font-normal"} /></label>
        <label className="block text-sm font-medium text-zinc-300">Language<input value={language} onChange={(e) => onLanguageChange(e.target.value)} placeholder="English" className={inputClass + " mt-2 font-normal"} /></label>
        <label className="block text-sm font-medium text-zinc-300">Visual Style<input value={visualStyle} onChange={(e) => onVisualStyleChange(e.target.value)} placeholder="Cinematic African Realism" className={inputClass + " mt-2 font-normal"} /></label>
        <label className="block text-sm font-medium text-zinc-300">Aspect Ratio<input value={aspectRatio} onChange={(e) => onAspectRatioChange(e.target.value)} placeholder="16:9" className={inputClass + " mt-2 font-normal"} /></label>
        <label className="block text-sm font-medium text-zinc-300">Duration (Minutes)<input type="number" min={1} value={durationMinutes} onChange={(e) => onDurationMinutesChange(Number(e.target.value))} className={inputClass + " mt-2 font-normal"} /></label>
        <label className="block text-sm font-medium text-zinc-300">Universe<input value={universe} onChange={(e) => onUniverseChange(e.target.value)} placeholder="Contemporary Lagos" className={inputClass + " mt-2 font-normal"} /></label>
        <label className="block text-sm font-medium text-zinc-300">Time Period<input value={timePeriod} onChange={(e) => onTimePeriodChange(e.target.value)} placeholder="Present Day" className={inputClass + " mt-2 font-normal"} /></label>
        <label className="block text-sm font-medium text-zinc-300">Primary Location<input value={primaryLocation} onChange={(e) => onPrimaryLocationChange(e.target.value)} placeholder="Lagos, Nigeria" className={inputClass + " mt-2 font-normal"} /></label>
      </div>
    </section>
  );
}
