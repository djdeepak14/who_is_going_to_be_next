"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { useLanguage } from "@/app/context/LanguageContext";
import Image from "next/image";
import Link from "next/link";
import { AdminOnly, CanManage } from "@/app/components/AuthGuard";
import { useToast } from "@/app/components/ToastProvider";
import { fetcher, getApiBaseUrl, getErrorMessage, throwApiError } from "@/app/lib/api-client";
import StateMessage from "@/app/components/StateMessage";
import { ArresteeDetailSkeleton } from "@/app/components/PageSkeletons";

const API_BASE = getApiBaseUrl();
const VOTE_KEY = "vanguard_arrestee_votes";

type Arrestee = {
  id: string;
  nameEn: string;
  nameNp: string;
  age: number;
  postEn: string;
  postNp: string;
  causeEn: string;
  causeNp: string;
  detailsEn?: string[];
  detailsNp?: string[];
  profileImgUrl?: string;
  likes: number;
  dislikes: number;
};

export default function ArresteeDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const arresteeId = params?.id;
  const { getToken } = useAuth();
  const { lang } = useLanguage();
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const [storedVotes, setStoredVotes] = useState<Record<string, "like" | "dislike">>(() => {
    if (typeof window === "undefined") return {};
    return JSON.parse(localStorage.getItem(VOTE_KEY) || "{}");
  });

  const { data: arrestee, isLoading, isError, error } = useQuery<Arrestee | null>({
    queryKey: ["arrestee", arresteeId],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/arrestee/${arresteeId}`, {
        credentials: "include",
      });
      await throwApiError(res, "Failed to fetch arrestee");
      const json = await res.json();
      return (json.data ?? null) as Arrestee | null;
    },
    enabled: Boolean(arresteeId),
    gcTime: 5 * 60 * 1000, // 5 minutes
    staleTime: 1 * 60 * 1000, 
  });

  const voteMutation = useMutation({
    mutationFn: async ({ type }: { type: "like" | "dislike" }) => {
      if (!arresteeId) throw new Error("Invalid arrestee id");
      const current = storedVotes[arresteeId];
      const isRemoving = current === type;
      const options = { method: "PATCH", credentials: ("include" as RequestCredentials) };

      if (isRemoving) {
        const res = await fetch(`${API_BASE}/arrestee/${arresteeId}/${type}/remove`, options);
        await throwApiError(res, "Could not remove reaction");
        return res;
      } else {
        if (current) {
          const removeRes = await fetch(`${API_BASE}/arrestee/${arresteeId}/${current}/remove`, options);
          await throwApiError(removeRes, "Could not update reaction");
        }
        const voteRes = await fetch(`${API_BASE}/arrestee/${arresteeId}/${type}`, options);
        await throwApiError(voteRes, "Could not submit reaction");
        return voteRes;
      }
    },
    onSuccess: (_, { type }) => {
      if (!arresteeId) return;
      const wasSameVote = storedVotes[arresteeId] === type;
      const next = { ...storedVotes };
      if (storedVotes[arresteeId] === type) delete next[arresteeId];
      else next[arresteeId] = type;
      setStoredVotes(next);
      localStorage.setItem(VOTE_KEY, JSON.stringify(next));
      queryClient.invalidateQueries({ queryKey: ["arrestee", arresteeId] });
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
    onError: (error) => {
      const fallback = lang === "Np" ? "प्रतिक्रिया दर्ता गर्न सकिएन" : "Could not submit reaction";
      showToast({
        type: "error",
        title: getErrorMessage(error, fallback),
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!arresteeId) throw new Error("Invalid arrestee id");

      const res = await fetcher(`${API_BASE}/arrestee/${arresteeId}`, {
        method: "DELETE",
      }, getToken);

      await throwApiError(res, "Failed to delete arrestee");

      return true;
    },
    onSuccess: () => {
      showToast({
        type: "success",
        title: lang === "Np" ? "रेकर्ड मेटाइयो" : "Record deleted",
      });
      queryClient.invalidateQueries({ queryKey: ["arrestees"] });
      router.push("/");
    },
    onError: (error) => {
      const fallback = lang === "Np" ? "मेटाउन सकिएन" : "Delete failed";
      showToast({
        type: "error",
        title: getErrorMessage(error, fallback),
      });
    },
  });

  const handleDelete = () => {
    const confirmed = window.confirm(
      lang === "Np"
        ? "यो रेकर्ड मेटाउन निश्चित हुनुहुन्छ?"
        : "Are you sure you want to delete this record?",
    );

    if (!confirmed) return;
    deleteMutation.mutate();
  };

  if (isLoading) {
    return <ArresteeDetailSkeleton />;
  }

  if (isError || !arrestee) {
    return (
      <StateMessage
        tone="error"
        message={getErrorMessage(error, lang === "Np" ? "गिरफ्तारी विवरण लोड गर्न सकिएन" : "Failed to load arrestee detail.")}
      />
    );
  }

  const userVote = arresteeId ? storedVotes[arresteeId] : undefined;

  return (
    <div className="page-wrap pt-10 pb-16 content-fade-in">
      <div className="form-card w-full min-h-[320px] relative flex flex-col lg:flex-row border-b border-outline-variant/20">
        <div className="relative w-full lg:w-2/5 min-h-[400px] max-h-[600px] flex-shrink-0">
          {arrestee.profileImgUrl ? (
            <Image
              src={arrestee.profileImgUrl}
              alt={arrestee.nameNp}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 40vw, 33vw"
              className="object-cover rounded-none lg:rounded-r-2xl"
              priority
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-surface-container ui-text-muted text-2xl">
              {lang === "Np" ? "छवि छैन" : "No Image"}
            </div>
          )}
        </div>
        <div className="flex-1 p-6 lg:p-12 flex flex-col justify-between">
          <div>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="text-4xl font-bold font-headline text-on-surface mb-1">
                  {lang === "Np" ? arrestee.nameNp : arrestee.nameEn}
                </h1>
                <p className="text-primary font-bold text-lg">{lang === "Np" ? arrestee.postNp : arrestee.postEn}</p>
                <p className="ui-text-muted mt-1 text-base">{lang === "Np" ? `उमेर: ${arrestee.age}` : `Age: ${arrestee.age}`}</p>
              </div>
              <div className="flex items-center gap-4">
                <CanManage>
                  <Link href={`/arrestee/${arrestee.id}/edit`} className="ui-link-muted text-base">
                    {lang === "Np" ? "सम्पादन" : "Edit"}
                  </Link>
                </CanManage>
                <AdminOnly>
                  <button
                    onClick={handleDelete}
                    disabled={deleteMutation.isPending}
                    className="ui-btn-danger px-3 py-1 text-base"
                  >
                    {deleteMutation.isPending
                      ? lang === "Np"
                        ? "मेटाउँदै..."
                        : "Deleting..."
                      : lang === "Np"
                        ? "मेटाउनुहोस्"
                        : "Delete"}
                  </button>
                </AdminOnly>
              </div>
            </div>
            <div className="paper-panel p-6 rounded-xl my-8 shadow-sm">
              <p className="text-on-surface font-semibold leading-relaxed text-lg">
                {lang === "Np" ? arrestee.causeNp : arrestee.causeEn}
              </p>
            </div>
            {(lang === "Np" ? arrestee.detailsNp : arrestee.detailsEn)?.length ? (
              <ul className="list-disc pl-8 space-y-2 ui-text-muted text-base">
                {(lang === "Np" ? arrestee.detailsNp : arrestee.detailsEn)?.map((detail, idx) => (
                  <li key={`${detail}-${idx}`}>{detail}</li>
                ))}
              </ul>
            ) : null}
          </div>
          <div className="mt-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex gap-3">
              <VoteBtn
                active={userVote === "like"}
                count={arrestee.likes}
                icon="thumb_up"
                onClick={() => voteMutation.mutate({ type: "like" })}
                activeClass="bg-primary text-on-primary"
                disabled={voteMutation.isPending}
              />
              <VoteBtn
                active={userVote === "dislike"}
                count={arrestee.dislikes}
                icon="thumb_down"
                onClick={() => voteMutation.mutate({ type: "dislike" })}
                activeClass="bg-error text-on-error"
                disabled={voteMutation.isPending}
              />
            </div>
            <Link href="/" className="ui-link-primary text-base">
              {lang === "Np" ? "सूचीमा फर्कनुहोस्" : "Back to list"}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

type VoteBtnProps = {
  active: boolean;
  count: number;
  icon: string;
  onClick: () => void;
  activeClass: string;
  disabled: boolean;
};

function VoteBtn({ active, count, icon, onClick, activeClass, disabled }: VoteBtnProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold transition-colors disabled:opacity-60 disabled:cursor-not-allowed ${active ? activeClass : "ui-vote-btn"}`}
    >
      <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: active ? "'FILL' 1" : "'FILL' 0" }}>{icon}</span>
      {count}
    </button>
  );
}