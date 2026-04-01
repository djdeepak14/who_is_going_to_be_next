"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { useLanguage } from "@/app/context/LanguageContext";
import { useToast } from "@/app/components/ToastProvider";
import { AdminOnly } from "@/app/components/AuthGuard";
import { fetcher, getApiBaseUrl, getErrorMessage, throwApiError } from "@/app/lib/api-client";
import StateMessage from "@/app/components/StateMessage";
import { PollDetailSkeleton } from "@/app/components/PageSkeletons";

const API_BASE = getApiBaseUrl();
const POLL_API = `${API_BASE}/poll`;
const POLL_VOTE_KEY = "vanguard_poll_history";

type PollOption = {
  id: string;
  optionTextNp: string;
  optionTextEn: string;
  voteCount: number;
};

type PollDetail = {
  id: string;
  titleNp: string;
  titleEn: string;
  options: PollOption[];
};

type PollDetailResponse = {
  poll: PollDetail;
};

export default function PollDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { getToken } = useAuth();
  const { lang } = useLanguage();
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const [votedPolls, setVotedPolls] = useState<Record<string, string>>(() => {
    if (typeof window === "undefined") return {};
    return JSON.parse(localStorage.getItem(POLL_VOTE_KEY) || "{}");
  });
  const [newOptionNp, setNewOptionNp] = useState("");
  const [newOptionEn, setNewOptionEn] = useState("");

  const { data: pollData, isLoading, isError, error } = useQuery<PollDetailResponse>({
    queryKey: ["poll", id],
    queryFn: async () => {
      const res = await fetch(`${POLL_API}/${id}`, {
        credentials: "include",
      });
      await throwApiError(res, "Failed to load poll");
      const json = await res.json();
      return json.data;
    },
    gcTime: 5 * 60 * 1000, // 5 minutes
    staleTime: 1 * 60 * 1000, 
  });

  const voteMutation = useMutation({
    mutationFn: async (optionId: string) => {
      const res = await fetch(`${POLL_API}/vote`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pollId: id, optionId }),
      });
      await throwApiError(res, "Could not submit vote");
      return res.json();
    },
    onSuccess: (_, optionId) => {
      const nextHistory = { ...votedPolls, [id as string]: optionId };
      setVotedPolls(nextHistory);
      localStorage.setItem(POLL_VOTE_KEY, JSON.stringify(nextHistory));
      queryClient.invalidateQueries({ queryKey: ["poll", id] });
      showToast({
        type: "success",
        title: lang === "Np" ? "मत दर्ता भयो" : "Vote submitted",
      });
    },
    onError: (error) => {
      const fallback = lang === "Np" ? "मत दिन सकिएन" : "Could not submit vote";
      showToast({
        type: "error",
        title: getErrorMessage(error, fallback),
      });
    },
  });

  const deletePollMutation = useMutation({
    mutationFn: async () => {
      const res = await fetcher(`${POLL_API}/${id}`, {
        method: "DELETE",
      }, getToken);

      await throwApiError(res, "Failed to delete poll");

      return true;
    },
    onSuccess: () => {
      showToast({
        type: "success",
        title: lang === "Np" ? "पोल मेटाइयो" : "Poll deleted",
      });
      queryClient.invalidateQueries({ queryKey: ["polls"] });
      router.push("/polls");
    },
    onError: (error) => {
      const fallback = lang === "Np" ? "पोल मेटाउन सकिएन" : "Could not delete poll";
      showToast({
        type: "error",
        title: getErrorMessage(error, fallback),
      });
    },
  });

  const addOptionMutation = useMutation({
    mutationFn: async () => {
      const res = await fetcher(`${POLL_API}/${id}/options`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          optionTextNp: newOptionNp.trim(),
          optionTextEn: newOptionEn.trim(),
        }),
      }, getToken);

      await throwApiError(res, "Failed to add option");

      return res.json().catch(() => null);
    },
    onSuccess: () => {
      setNewOptionNp("");
      setNewOptionEn("");
      queryClient.invalidateQueries({ queryKey: ["poll", id] });
      queryClient.invalidateQueries({ queryKey: ["polls"] });
      showToast({
        type: "success",
        title: lang === "Np" ? "विकल्प थपियो" : "Option added",
      });
    },
    onError: (error) => {
      const fallback = lang === "Np" ? "विकल्प थप्न सकिएन" : "Could not add option";
      showToast({
        type: "error",
        title: getErrorMessage(error, fallback),
      });
    },
  });

  const deleteOptionMutation = useMutation({
    mutationFn: async (optionId: string) => {
      const res = await fetcher(`${POLL_API}/options/${optionId}`, {
        method: "DELETE",
      }, getToken);

      await throwApiError(res, "Failed to delete option");

      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["poll", id] });
      queryClient.invalidateQueries({ queryKey: ["polls"] });
      showToast({
        type: "success",
        title: lang === "Np" ? "विकल्प मेटाइयो" : "Option deleted",
      });
    },
    onError: (error) => {
      const fallback = lang === "Np" ? "विकल्प मेटाउन सकिएन" : "Could not delete option";
      showToast({
        type: "error",
        title: getErrorMessage(error, fallback),
      });
    },
  });

  const handleDeletePoll = () => {
    const confirmed = window.confirm(
      lang === "Np"
        ? "यो पोल मेटाउन निश्चित हुनुहुन्छ?"
        : "Are you sure you want to delete this poll?",
    );
    if (!confirmed) return;
    deletePollMutation.mutate();
  };

  const handleAddOption = () => {
    if (!newOptionNp.trim() || !newOptionEn.trim()) {
      showToast({
        type: "error",
        title:
          lang === "Np"
            ? "नेपाली र अङ्ग्रेजी दुवै विकल्प पाठ अनिवार्य छन्"
            : "Both Nepali and English option text are required",
      });
      return;
    }

    addOptionMutation.mutate();
  };

  const handleDeleteOption = (optionId: string) => {
    const confirmed = window.confirm(
      lang === "Np"
        ? "यो विकल्प मेटाउन निश्चित हुनुहुन्छ?"
        : "Are you sure you want to delete this option?",
    );
    if (!confirmed) return;
    deleteOptionMutation.mutate(optionId);
  };

  if (isLoading) {
    return <PollDetailSkeleton />;
  }

  if (isError) {
    return (
      <StateMessage
        tone="error"
        message={getErrorMessage(error, lang === "Np" ? "पोल लोड गर्न सकिएन" : "Failed to load poll")}
      />
    );
  }

  if (!pollData) {
    return <StateMessage tone="empty" message={lang === "Np" ? "पोल फेला परेन" : "Poll not found"} />;
  }

  const { poll } = pollData;
  const total = poll.options.reduce((acc: number, o: PollOption) => acc + o.voteCount, 0);

  return (
    <div className="page-wrap max-w-4xl mx-auto py-12 content-fade-in">
      <div className="mb-12 flex items-start justify-between gap-4">
        <h1 className="text-4xl font-black font-headline text-primary">{lang === "Np" ? poll.titleNp : poll.titleEn}</h1>
        <AdminOnly>
          <button
            onClick={handleDeletePoll}
            disabled={deletePollMutation.isPending}
            className="ui-btn-danger px-4 py-2 text-sm"
          >
            {deletePollMutation.isPending
              ? lang === "Np"
                ? "मेटाउँदै..."
                : "Deleting..."
              : lang === "Np"
                ? "पोल मेटाउनुहोस्"
                : "Delete Poll"}
          </button>
        </AdminOnly>
      </div>

      <div className="form-card mb-6">
        <h2 className="text-lg font-black font-headline text-on-surface mb-3">
          {lang === "Np" ? "विकल्प थप्नुहोस्" : "Add option"}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <input
            value={newOptionNp}
            onChange={(e) => setNewOptionNp(e.target.value)}
            placeholder="विकल्प पाठ (नेपाली)"
            className="ui-input md:col-span-1"
          />
          <input
            value={newOptionEn}
            onChange={(e) => setNewOptionEn(e.target.value)}
            placeholder="Option text (English)"
            className="ui-input md:col-span-1"
          />
          <button
            type="button"
            onClick={handleAddOption}
            disabled={addOptionMutation.isPending}
            className="ui-btn-primary md:col-span-1 px-4 py-3"
          >
            {addOptionMutation.isPending
              ? lang === "Np"
                ? "थप्दै..."
                : "Adding..."
              : lang === "Np"
                ? "विकल्प थप्नुहोस्"
                : "Add option"}
          </button>
        </div>
      </div>
      
      <div className="space-y-4">
        {poll.options.map((opt: PollOption) => {
          const percent = total > 0 ? Math.round((opt.voteCount / total) * 100) : 0;
          const isSelected = votedPolls[id as string] === opt.id;

          return (
            <div key={opt.id} className="flex items-stretch gap-2">
              <button
                disabled={voteMutation.isPending}
                onClick={() => voteMutation.mutate(opt.id)}
                className={`poll-detail-vote flex-1 h-16 disabled:opacity-60 disabled:cursor-not-allowed ${isSelected ? 'is-selected' : ''}`}
              >
                <div className={`poll-detail-vote-fill ${isSelected ? 'is-selected' : ''}`} style={{ width: `${percent}%` }} />
                <div className="absolute inset-0 px-6 flex justify-between items-center font-bold">
                  <span className={isSelected ? 'text-primary' : 'text-on-surface'}>
                    {lang === "Np" ? opt.optionTextNp : opt.optionTextEn}
                    {isSelected && " (Voted)"}
                  </span>
                  <span className="text-sm font-black">{percent}%</span>
                </div>
              </button>
              <AdminOnly>
                <button
                  type="button"
                  onClick={() => handleDeleteOption(opt.id)}
                  disabled={deleteOptionMutation.isPending}
                  className="ui-btn-danger rounded-2xl px-3 text-sm"
                  aria-label={lang === "Np" ? "विकल्प मेटाउनुहोस्" : "Delete option"}
                  title={lang === "Np" ? "विकल्प मेटाउनुहोस्" : "Delete option"}
                >
                  {lang === "Np" ? "मेटाउनुहोस्" : "Delete"}
                </button>
              </AdminOnly>
            </div>
          );
        })}
      </div>
    </div>
  );
}