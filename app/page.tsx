"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { useState } from "react";
import { useLanguage } from "@/app/context/LanguageContext";
import Image from "next/image";
import Link from "next/link";
import { CanManage } from "./components/AuthGuard";
import { useToast } from "@/app/components/ToastProvider";
import { getApiBaseUrl, getErrorMessage, throwApiError } from "@/app/lib/api-client";
import StateMessage from "@/app/components/StateMessage";
import { HomeGridSkeleton } from "@/app/components/PageSkeletons";

const API_BASE = getApiBaseUrl();
const VOTE_KEY = "vanguard_arrestee_votes";

type Arrestee = {
  id: string;
  nameEn: string;
  nameNp: string;
  postEn: string;
  postNp: string;
  causeEn: string;
  causeNp: string;
  profileImgUrl?: string;
  likes: number;
  dislikes: number;
};

type ArresteeCardProps = {
  arrestee: Arrestee;
  lang: string;
  userVote: "like" | "dislike" | undefined;
  onVote: (type: "like" | "dislike") => void;
  votingDisabled: boolean;
};

type VoteBtnProps = {
  icon: string;
  active: boolean;
  count: number;
  onClick: () => void;
  color: "primary" | "error";
  disabled: boolean;
};

export default function ArresteesPage() {
  const { lang } = useLanguage();
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [storedVotes, setStoredVotes] = useState<Record<string, "like" | "dislike">>(() => {
    if (typeof window === "undefined") return {};
    return JSON.parse(localStorage.getItem(VOTE_KEY) || "{}");
  });

  const { data: arrestees, isLoading, isError, error } = useQuery<Arrestee[]>({
    queryKey: ["arrestees"],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/arrestee`, { credentials: "include" });
      await throwApiError(res, "Failed to load arrestees");
      const json = await res.json();
      return json.data ?? [];
    },
    gcTime: 5 * 60 * 1000,
    staleTime: 2 * 60 * 1000,
  });

  const filtered =
    arrestees?.filter(
      (a: Arrestee) =>
        a.nameNp.includes(searchTerm) ||
        a.nameEn.toLowerCase().includes(searchTerm.toLowerCase()),
    ) ?? [];

  const voteMutation = useMutation({
    mutationFn: async ({ id, type }: { id: string; type: "like" | "dislike" }) => {
      const current = storedVotes[id];
      const isRemoving = current === type;

      if (isRemoving) {
        const res = await fetch(`${API_BASE}/arrestee/${id}/${type}/remove`, {
          method: "PATCH",
          credentials: "include",
        });
        await throwApiError(res, "Could not remove reaction");
        return res;
      }

      if (current) {
        const removeRes = await fetch(`${API_BASE}/arrestee/${id}/${current}/remove`, {
          method: "PATCH",
          credentials: "include",
        });
        await throwApiError(removeRes, "Could not update reaction");
      }

      const voteRes = await fetch(`${API_BASE}/arrestee/${id}/${type}`, {
        method: "PATCH",
        credentials: "include",
      });
      await throwApiError(voteRes, "Could not submit reaction");
      return voteRes;
    },
    onSuccess: (_, { id, type }) => {
      const wasSameVote = storedVotes[id] === type;
      const nextVotes = { ...storedVotes };
      if (storedVotes[id] === type) delete nextVotes[id];
      else nextVotes[id] = type;

      setStoredVotes(nextVotes);
      localStorage.setItem(VOTE_KEY, JSON.stringify(nextVotes));
      queryClient.invalidateQueries({ queryKey: ["arrestees"] });
      showToast({
        type: "success",
        title: wasSameVote
          ? lang === "Np"
            ? "प्रतिक्रिया हटाइयो"
            : "Reaction removed"
          : lang === "Np"
            ? "प्रतिक्रिया दर्ता भयो"
            : "Reaction submitted",
      });
    },
    onError: (mutationError) => {
      const fallback =
        lang === "Np" ? "प्रतिक्रिया दर्ता गर्न सकिएन" : "Could not submit reaction";
      showToast({
        type: "error",
        title: getErrorMessage(mutationError, fallback),
      });
    },
  });

  if (isLoading) {
    return <HomeGridSkeleton />;
  }

  return (
    <div className="page-wrap pb-20 content-fade-in">
      <header className="paper-panel rounded-[2rem] p-7 md:p-10 mb-10">
        <div className="page-header-kicker">
          <span className="kicker-dot" />
          {lang === "Np" ? "जनचासो अनुगमन" : "Public Watch"}
        </div>

        <h1 className="ink-title mt-4 text-4xl md:text-6xl font-black font-headline text-on-surface leading-[1.05]">
          {lang === "Np" ? "पक्राउको पछिल्लो" : "Latest "}
          <span className="text-primary">{lang === "Np" ? "चित्र" : "Custody Pulse"}</span>
        </h1>

        <p className="mt-4 max-w-2xl text-sm md:text-base ui-text-muted leading-relaxed">
          {lang === "Np"
            ? "चलिरहेका अनुसन्धानसँग जोडिएका व्यक्तिहरूको सूची, पृष्ठभूमि र सार्वजनिक प्रतिक्रिया एउटै ठाउँमा हेर्नुहोस्।"
            : "Follow key detainee profiles and public reactions in one live tracker."}
        </p>

        <div className="mt-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/polls"
              className="inline-flex items-center gap-2 rounded-full border border-primary/30 px-4 py-2 text-primary font-bold text-sm hover:bg-primary/10 transition-colors"
            >
              <span className="material-symbols-outlined text-base">poll</span>
              {lang === "Np" ? "मत सर्वेक्षण हेर्नुहोस्" : "Explore Polls"}
            </Link>

            <CanManage>
              <Link
                href="/arrestee/create"
                className="inline-flex items-center gap-2 rounded-full bg-primary text-on-primary px-5 py-2.5 font-bold text-sm hover:opacity-90 transition-opacity"
              >
                <span className="material-symbols-outlined text-base">add</span>
                {lang === "Np" ? "नयाँ प्रोफाइल थप्नुहोस्" : "Add Profile"}
              </Link>
            </CanManage>
          </div>

          <input
            type="text"
            placeholder={lang === "Np" ? "खोज्नुहोस्..." : "Search..."}
            className="w-full md:w-80 px-4 py-3 bg-surface-container-low rounded-xl border border-outline-variant/40 focus:outline-none focus:ring-2 focus:ring-primary/30"
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </header>

      <div className="mb-4 section-label">
        {lang === "Np" ? "प्रोफाइल सूची" : "Profile List"}
      </div>

      <div className="card-grid">
        {isError ? (
          <StateMessage
            tone="error"
            message={getErrorMessage(
              error,
              lang === "Np" ? "डेटा लोड गर्न सकिएन" : "Failed to load data",
            )}
            className="md:col-span-2 lg:col-span-3 py-16"
          />
        ) : null}

        {!isError && filtered.length === 0 ? (
          <div className="empty-state">
            <p className="text-4xl mb-3">🗳️</p>
            <p className="text-on-surface font-bold text-lg">
              {lang === "Np" ? "प्रोफाइल फेला परेन" : "No profiles found"}
            </p>
            <p className="text-sm mt-1 ui-text-muted">
              {lang === "Np"
                ? "फरक खोज शब्द प्रयोग गर्नुहोस् वा केही समयपछि फेरि प्रयास गर्नुहोस्।"
                : "Try another search term or check back in a moment."}
            </p>
          </div>
        ) : null}

        {filtered.map((a: Arrestee) => (
          <ArresteeCard
            key={a.id}
            arrestee={a}
            lang={lang}
            userVote={storedVotes[a.id]}
            votingDisabled={voteMutation.isPending}
            onVote={(t: "like" | "dislike") => voteMutation.mutate({ id: a.id, type: t })}
          />
        ))}
      </div>
    </div>
  );
}

function ArresteeCard({ arrestee, lang, userVote, onVote, votingDisabled }: ArresteeCardProps) {
  return (
    <article className="paper-panel rounded-3xl overflow-hidden flex flex-col transition-transform duration-200 hover:-translate-y-0.5">
      <div className="relative h-64 bg-surface-container">
        {arrestee.profileImgUrl && (
          <Image
            src={arrestee.profileImgUrl}
            alt={arrestee.nameNp}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover"
          />
        )}
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/40 to-transparent" />
      </div>
      <div className="p-6 flex-grow">
        <h2 className="text-2xl font-bold font-headline leading-tight">{lang === "Np" ? arrestee.nameNp : arrestee.nameEn}</h2>
        <p className="mt-2 inline-flex rounded-full bg-primary/12 px-2.5 py-1 text-primary font-bold text-[11px] tracking-wide uppercase">{lang === "Np" ? arrestee.postNp : arrestee.postEn}</p>
        <p className="mt-3 ui-text-muted text-sm line-clamp-3">{lang === "Np" ? arrestee.causeNp : arrestee.causeEn}</p>
      </div>
      <div className="p-6 border-t border-outline-variant/40 flex justify-between items-center gap-3">
        <div className="flex gap-2">
          <VoteBtn
            icon="thumb_up"
            active={userVote === "like"}
            count={arrestee.likes}
            onClick={() => onVote("like")}
            color="primary"
            disabled={votingDisabled}
          />
          <VoteBtn
            icon="thumb_down"
            active={userVote === "dislike"}
            count={arrestee.dislikes}
            onClick={() => onVote("dislike")}
            color="error"
            disabled={votingDisabled}
          />
        </div>
        <div className="flex items-center gap-3">
          <CanManage>
            <Link href={`/arrestee/${arrestee.id}/edit`} className="ui-link-muted text-xs">
              {lang === "Np" ? "सम्पादन" : "Edit"}
            </Link>
          </CanManage>
          <Link href={`/arrestee/${arrestee.id}`} className="ui-link-primary text-xs flex items-center gap-1">
            {lang === "Np" ? "विवरण" : "Detail"} <span className="material-symbols-outlined text-sm">arrow_forward</span>
          </Link>
        </div>
      </div>
    </article>
  );
}

function VoteBtn({ icon, active, count, onClick, color, disabled }: VoteBtnProps) {
  const activeStyles = color === "primary" ? "bg-primary text-on-primary" : "bg-error text-on-error";
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-bold transition-all disabled:opacity-60 disabled:cursor-not-allowed ${active ? activeStyles : "ui-vote-btn"}`}
    >
      <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: active ? "'FILL' 1" : "'FILL' 0" }}>
        {icon}
      </span>
      {count}
    </button>
  );
}
