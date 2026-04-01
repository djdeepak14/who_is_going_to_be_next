"use client";

import { AdminOnly } from "@/app/components/AuthGuard";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { useLanguage } from "@/app/context/LanguageContext";
import { useToast } from "@/app/components/ToastProvider";
import { CanManage } from "@/app/components/CanManage";
import Link from "next/link";
import { fetcher, getApiBaseUrl, getErrorMessage, throwApiError } from "@/app/lib/api-client";
import StateMessage from "@/app/components/StateMessage";
import { PollsListSkeleton } from "@/app/components/PageSkeletons";

const API_BASE = getApiBaseUrl();
const POLL_API = `${API_BASE}/poll`;

type PollOption = {
  id: string;
  optionTextNp: string;
  optionTextEn: string;
  voteCount: number;
  optionImage?: string | null;
  optionImageUrl?: string | null;
  image?: string | null;
};
type Poll = {
  id: string;
  titleNp: string;
  titleEn: string;
  options: PollOption[];
  createdBy?: string;
  userVote?: {
    optionId?: string;
  };
};
type PollResponse = { data?: Poll[] };

type PollCardProps = {
  poll: Poll;
  lang: string;
  votedOptionId?: string;
  votingDisabled: boolean;
  deletingPoll: boolean;
  deletingOption: boolean;
  addingOption: boolean;
  pollState: { np: string; en: string; show: boolean; image: File | null };
  onVote: (pollId: string, optionId: string) => void;
  onDeletePoll: (pollId: string) => void;
  onDeleteOption: (optionId: string) => void;
  onToggleAddOption: (show: boolean) => void;
  onChangeOptionNp: (value: string) => void;
  onChangeOptionEn: (value: string) => void;
  onChangeOptionImage: (file: File | null) => void;
  onAddOption: (pollId: string, optionTextNp: string, optionTextEn: string, image: File | null) => void;
};

type VoteResponse = {
  message?: string;
  data?: {
    action?: "created" | "updated" | "unchanged";
  };
};

function getOptionImageSrc(option: PollOption): string | null {
  return option.optionImageUrl || option.optionImage || option.image || null;
}

export default function PollsPage() {
  const { getToken } = useAuth();
    // Delete Poll Mutation (admin only)
    const deletePollMutation = useMutation({
      mutationFn: async (pollId: string) => {
        const res = await fetcher(`${POLL_API}/${pollId}`, {
          method: "DELETE",
        }, getToken);
        await throwApiError(res, lang === "Np" ? "पोल मेटाउन सकिएन" : "Could not delete poll");
        return true;
      },
      onSuccess: () => {
        showToast({
          type: "success",
          title: lang === "Np" ? "पोल मेटाइयो" : "Poll deleted",
        });
        queryClient.invalidateQueries({ queryKey: ["polls"] });
        // Optionally, scroll to top or show a message
      },
      onError: (error) => {
        const fallback = lang === "Np" ? "पोल मेटाउन सकिएन" : "Could not delete poll";
        showToast({
          type: "error",
          title: getErrorMessage(error, fallback),
        });
      },
    });
  const { lang } = useLanguage();
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  // Store new option state per poll
  const [newOptionState, setNewOptionState] = useState<Record<string, { np: string; en: string; show: boolean; image: File | null }>>({});

  const deleteOptionMutation = useMutation({
    mutationFn: async (optionId: string) => {
      const res = await fetcher(`${POLL_API}/options/${optionId}`, { method: "DELETE" }, getToken);
      await throwApiError(res, lang === "Np" ? "विकल्प मेटाउन सकिएन" : "Could not delete option");
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["polls"] });
      showToast({ type: "success", title: lang === "Np" ? "विकल्प मेटाइयो" : "Option deleted" });
    },
    onError: (error) => {
      showToast({ type: "error", title: getErrorMessage(error, lang === "Np" ? "विकल्प मेटाउन सकिएन" : "Could not delete option") });
    },
  });

  const { data: polls = [], isLoading, isError, error } = useQuery<Poll[]>({
    queryKey: ["polls"],
    queryFn: async () => {
      const res = await fetch(POLL_API, { credentials: "include" });
      await throwApiError(res, "Failed to fetch polls");
      const json = (await res.json()) as PollResponse;
      return json.data ?? [];
    },
    gcTime: 5 * 60 * 1000,
    staleTime: 1 * 60 * 1000,
  });

  const addOptionMutation = useMutation({
    mutationFn: async ({ pollId, optionTextNp, optionTextEn, image }: { pollId: string; optionTextNp: string; optionTextEn: string; image: File | null }) => {
      const formData = new FormData();
      formData.append("optionTextNp", optionTextNp);
      formData.append("optionTextEn", optionTextEn);
      if (image) {
        formData.append("optionImage", image);
      }

      const res = await fetcher(`${POLL_API}/${pollId}/options`, {
        method: "POST",
        body: formData,
      }, getToken);
      await throwApiError(res, "Failed to add option");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["polls"] });
      showToast({ type: "success", title: lang === "Np" ? "विकल्प थपियो" : "Option added" });
    },
    onError: (error) => {
      showToast({ type: "error", title: getErrorMessage(error, lang === "Np" ? "विकल्प थप्न सकिएन" : "Could not add option") });
    },
  });

  const voteMutation = useMutation({
    mutationFn: async ({ pollId, optionId }: { pollId: string; optionId: string }) => {
      const res = await fetch(`${POLL_API}/vote`, {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pollId, optionId }),
      });
      await throwApiError(res, "Failed to cast vote");
      return (await res.json()) as VoteResponse;
    },
    onSuccess: (payload) => {
      queryClient.invalidateQueries({ queryKey: ["polls"] });
      const fallbackTitle =
        payload?.data?.action === "updated"
          ? lang === "Np"
            ? "मत परिवर्तन भयो"
            : "Vote updated"
          : payload?.data?.action === "unchanged"
            ? lang === "Np"
              ? "उही विकल्प पहिले नै चयन गरिएको छ"
              : "Option already selected"
            : lang === "Np"
              ? "मत दर्ता भयो"
              : "Vote submitted";
      showToast({ type: "success", title: payload?.message || fallbackTitle });
    },
    onError: (error) => {
      showToast({ type: "error", title: getErrorMessage(error, lang === "Np" ? "मत दिन सकिएन" : "Could not submit vote") });
    },
  });

  if (isLoading) return <PollsListSkeleton />;
  if (isError) return <StateMessage tone="error" message={getErrorMessage(error, lang === "Np" ? "पोलहरू लोड गर्न सकिएन" : "Failed to load polls.")} />;

  return (
    <div className="page-wrap pt-10 content-fade-in">
      {/* ── Header ── */}
      <header className="paper-panel mb-12 rounded-3xl p-8 md:p-10 text-center">
        <p className="page-header-kicker mb-4">
          <span className="kicker-dot" />
          {lang === "Np" ? "जनमत सर्वेक्षण" : "Community Polls"}
        </p>
        <h1 className="ink-title text-4xl md:text-6xl font-black tracking-tight mb-4 text-on-surface leading-tight font-headline">
          {lang === "Np" ? "अबको चर्चा" : "What Happens "}
          <span className="text-primary">{lang === "Np" ? "केमा छ?" : "Next?"}</span>
        </h1>
        <p className="text-base ui-text-muted leading-relaxed max-w-xl mx-auto">
          {lang === "Np" ? "चलिरहेका घटनाक्रमबारे सार्वजनिक धारणालाई पोलमार्फत नजिकबाट हेर्नुहोस्।" : "Track public sentiment around ongoing anti-corruption developments through live polls."}
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* ── Poll list ── */}
        <section className="lg:col-span-8 space-y-6">
          {polls.map((poll) => {
            const pollState = newOptionState[poll.id] || { np: "", en: "", show: false, image: null };
            const setPollState = (update: Partial<{ np: string; en: string; show: boolean; image: File | null }>) =>
              setNewOptionState((prev) => ({
                ...prev,
                [poll.id]: { ...pollState, ...update },
              }));
            return (
              <PollCard
                key={poll.id}
                poll={poll}
                lang={lang}
                votedOptionId={poll.userVote?.optionId}
                votingDisabled={voteMutation.isPending}
                deletingPoll={deletePollMutation.isPending}
                deletingOption={deleteOptionMutation.isPending}
                addingOption={addOptionMutation.isPending}
                pollState={pollState}
                onVote={(pollId, optionId) => {
                  voteMutation.mutate({ pollId, optionId });
                }}
                onDeletePoll={(pollId) => {
                  if (deletePollMutation.isPending) return;
                  if (window.confirm(lang === "Np" ? "यो पोल मेटाउन निश्चित हुनुहुन्छ?" : "Are you sure you want to delete this poll?")) {
                    deletePollMutation.mutate(pollId);
                  }
                }}
                onDeleteOption={(optionId) => {
                  if (deleteOptionMutation.isPending) return;
                  if (window.confirm(lang === "Np" ? "यो विकल्प मेटाउन निश्चित हुनुहुन्छ?" : "Are you sure you want to delete this option?")) {
                    deleteOptionMutation.mutate(optionId);
                  }
                }}
                onToggleAddOption={(show) => setPollState({ show })}
                onChangeOptionNp={(value) => setPollState({ np: value })}
                onChangeOptionEn={(value) => setPollState({ en: value })}
                onChangeOptionImage={(file) => setPollState({ image: file })}
                onAddOption={(pollId, optionTextNp, optionTextEn, image) => {
                  addOptionMutation.mutate(
                    { pollId, optionTextNp: optionTextNp.trim(), optionTextEn: optionTextEn.trim(), image },
                    { onSuccess: () => setPollState({ np: "", en: "", show: false, image: null }) },
                  );
                }}
              />
            );
          })}
        </section>

        {/* ── Sidebar ── */}
        <aside className="lg:col-span-4 space-y-6">
          <div className="rounded-2xl p-6 shadow-xl bg-[linear-gradient(160deg,var(--primary),var(--primary-container))] text-on-primary">
            <span className="material-symbols-outlined text-4xl mb-4 block">add_task</span>
            <h3 className="font-bold text-xl mb-2 font-headline">
              {lang === "Np" ? "नयाँ पोल सुरु गर्ने?" : "Start a New Poll?"}
            </h3>
            <p className="text-sm opacity-80 mb-4 leading-relaxed">
              {lang === "Np"
                ? "महत्त्वपूर्ण विषयमा समुदायको धारणा मापन गर्न तुरुन्तै नयाँ पोल बनाउनुहोस्।"
                : "Create a fresh poll and watch how public opinion shifts in real time."}
            </p>
            <Link
              href="/polls/create"
              className="block w-full py-2.5 text-center bg-on-primary ui-link-primary rounded-xl text-sm hover:opacity-90 transition-opacity"
            >
              {lang === "Np" ? "नयाँ पोल बनाउनुहोस्" : "Create Poll"}
            </Link>
          </div>

          <p className="text-[11px] ui-text-muted leading-relaxed px-1">
            {lang === "Np"
              ? "मतदान अनौपचारिक हो। नतिजाले समग्र जनभावना मात्र देखाउँछ।"
              : "Votes are informal and reflect public opinion only. Results are not statistically representative."}
          </p>
        </aside>
      </div>
    </div>
  );
}

function PollCard({
  poll,
  lang,
  votedOptionId,
  votingDisabled,
  deletingPoll,
  deletingOption,
  addingOption,
  pollState,
  onVote,
  onDeletePoll,
  onDeleteOption,
  onToggleAddOption,
  onChangeOptionNp,
  onChangeOptionEn,
  onChangeOptionImage,
  onAddOption,
}: PollCardProps) {
  const totalVotes = poll.options.reduce((sum, o) => sum + o.voteCount, 0);
  const hasVoted = Boolean(votedOptionId);
  const getPct = (optionVotes: number) => (totalVotes > 0 ? Math.round((optionVotes / totalVotes) * 100) : 0);

  return (
    <article className="form-card">
      <div className="flex items-start justify-between gap-4 mb-5">
        <div className="min-w-0 flex-1">
          <h2 className="font-headline text-xl font-bold text-on-surface leading-snug">
            {lang === "Np" ? poll.titleNp : poll.titleEn}
          </h2>
        </div>

        <span className="shrink-0 mt-0.5 text-[11px] font-semibold tracking-wide text-on-surface-variant border border-outline-variant rounded-full px-2.5 py-0.5 whitespace-nowrap">
          {lang === "Np" ? `कुल मत: ${totalVotes}` : `${totalVotes} votes`}
        </span>

        <AdminOnly>
          <button
            onClick={() => onDeletePoll(poll.id)}
            disabled={deletingPoll}
            className="ui-btn-danger ml-2 px-3 py-1 text-xs"
          >
            {deletingPoll
              ? lang === "Np"
                ? "मेटाउँदै..."
                : "Deleting..."
              : lang === "Np"
                ? "पोल मेटाउनुहोस्"
                : "Delete Poll"}
          </button>
        </AdminOnly>
      </div>

      <div className="space-y-3">
        {poll.options.map((option) => {
          const pct = getPct(option.voteCount);
          const isSelected = votedOptionId === option.id;
          const imageSrc = getOptionImageSrc(option);
          return (
            <div
              key={option.id}
              className={`poll-option-track ${votingDisabled ? "cursor-not-allowed opacity-70" : "cursor-pointer"}`}
              onClick={() => {
                if (votingDisabled) return;
                onVote(poll.id, option.id);
              }}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key !== "Enter" || votingDisabled) return;
                onVote(poll.id, option.id);
              }}
            >
              <div
                className={`poll-option-fill ${isSelected ? "poll-option-fill-active" : ""}`}
                style={{ width: `${hasVoted ? pct : 0}%` }}
              />

              <div className="relative z-10 flex items-center justify-between gap-2 p-3">
                <div className="flex items-center gap-2 min-w-0">
                  {imageSrc && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={imageSrc} alt={lang === "Np" ? option.optionTextNp : option.optionTextEn} className="h-8 w-8 rounded object-cover" />
                  )}
                  <span className={`text-sm font-semibold truncate ${isSelected ? "text-on-primary" : "text-on-surface"}`}>
                    {lang === "Np" ? option.optionTextNp : option.optionTextEn}
                  </span>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {hasVoted && (
                    <span className={`text-xs font-bold tabular-nums ${isSelected ? "text-on-primary" : "text-on-surface-variant"}`}>
                      {pct}%
                    </span>
                  )}
                  {isSelected && <span className="text-xs font-bold text-on-primary">✓</span>}
                  <CanManage>
                    <button
                      type="button"
                      className={`ml-1 text-[10px] font-medium ${isSelected ? "text-on-primary/90 hover:text-on-primary" : "text-on-surface-variant hover:text-error"}`}
                      title={lang === "Np" ? "विकल्प मेटाउनुहोस्" : "Delete option"}
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteOption(option.id);
                      }}
                      disabled={deletingOption}
                    >
                      {lang === "Np" ? "मेटाउनुहोस्" : "Remove"}
                    </button>
                  </CanManage>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 flex items-center justify-between text-xs ui-text-muted">
        <span>
          {lang === "Np"
            ? `${totalVotes} मत${!hasVoted ? " · मत दिनुहोस्" : ""}`
            : `${totalVotes} vote${totalVotes !== 1 ? "s" : ""}${!hasVoted ? " · tap to vote" : ""}`}
        </span>
      </div>

      <div className="mt-5 pt-4 border-t border-outline-variant/40">
        {pollState.show ? (
          <form
            className="flex flex-col md:flex-row gap-2 items-stretch md:items-end"
            onSubmit={(e) => {
              e.preventDefault();
              if (!pollState.np.trim() && !pollState.en.trim()) return;
                onAddOption(poll.id, pollState.np, pollState.en, pollState.image);
            }}
          >
            <input
              className="ui-input flex-1"
              placeholder={lang === "Np" ? "विकल्प (नेपाली)" : "Option (Nepali)"}
              value={pollState.np}
              onChange={(e) => onChangeOptionNp(e.target.value)}
              disabled={addingOption}
            />
            <input
              className="ui-input flex-1"
              placeholder="Option (English)"
              value={pollState.en}
              onChange={(e) => onChangeOptionEn(e.target.value)}
              disabled={addingOption}
            />
            <input
              type="file"
              accept="image/*"
              className="ui-input flex-1"
              onChange={(e) => onChangeOptionImage(e.target.files?.[0] || null)}
              disabled={addingOption}
            />
            <button
              type="submit"
              className="ui-btn-primary px-4 py-2 text-sm"
              disabled={addingOption}
            >
              {addingOption ? (lang === "Np" ? "थपिँदै..." : "Adding…") : (lang === "Np" ? "थप्नुहोस्" : "Add")}
            </button>
            <button
              type="button"
              className="ui-btn-secondary ml-1 px-3 py-2 text-xs"
              onClick={() => onToggleAddOption(false)}
              disabled={addingOption}
            >
              {lang === "Np" ? "रद्द गर्नुहोस्" : "Cancel"}
            </button>
          </form>
        ) : (
          <button
            className="text-xs ui-link-muted font-medium"
            onClick={() => onToggleAddOption(true)}
          >
            + {lang === "Np" ? "नयाँ विकल्प थप्नुहोस्" : "Add option"}
          </button>
        )}
      </div>
    </article>
  );
}