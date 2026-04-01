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

type PollOption = {
  id: string;
  optionTextNp: string;
  optionTextEn: string;
  voteCount: number;
  optionImage?: string | null;
  optionImageUrl?: string | null;
  image?: string | null;
};

type PollDetail = {
  id: string;
  titleNp: string;
  titleEn: string;
  options: PollOption[];
};

type PollDetailResponse = {
  poll: PollDetail;
  userVote?: {
    optionId?: string;
  };
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

export default function PollDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { getToken } = useAuth();
  const { lang } = useLanguage();
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const [newOptionNp, setNewOptionNp] = useState("");
  const [newOptionEn, setNewOptionEn] = useState("");
  const [newOptionImage, setNewOptionImage] = useState<File | null>(null);
  const [editingOptionId, setEditingOptionId] = useState<string | null>(null);
  const [editingOptionNp, setEditingOptionNp] = useState("");
  const [editingOptionEn, setEditingOptionEn] = useState("");
  const [editingOptionImage, setEditingOptionImage] = useState<File | null>(null);

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
      return (await res.json()) as VoteResponse;
    },
    onSuccess: (payload) => {
      queryClient.invalidateQueries({ queryKey: ["poll", id] });
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

      showToast({
        type: "success",
        title: payload?.message || fallbackTitle,
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
      const formData = new FormData();
      formData.append("optionTextNp", newOptionNp.trim());
      formData.append("optionTextEn", newOptionEn.trim());
      if (newOptionImage) {
        formData.append("optionImage", newOptionImage);
      }

      const res = await fetcher(`${POLL_API}/${id}/options`, {
        method: "POST",
        body: formData,
      }, getToken);

      await throwApiError(res, "Failed to add option");

      return res.json().catch(() => null) as Promise<{ message?: string } | null>;
    },
    onSuccess: (payload) => {
      setNewOptionNp("");
      setNewOptionEn("");
      setNewOptionImage(null);
      queryClient.invalidateQueries({ queryKey: ["poll", id] });
      queryClient.invalidateQueries({ queryKey: ["polls"] });
      showToast({
        type: "success",
        title: payload?.message || (lang === "Np" ? "विकल्प थपियो" : "Option added"),
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

  const updateOptionMutation = useMutation({
    mutationFn: async (optionId: string) => {
      const formData = new FormData();
      if (editingOptionNp.trim()) {
        formData.append("optionTextNp", editingOptionNp.trim());
      }
      if (editingOptionEn.trim()) {
        formData.append("optionTextEn", editingOptionEn.trim());
      }
      if (editingOptionImage) {
        formData.append("optionImage", editingOptionImage);
      }

      const res = await fetcher(`${POLL_API}/options/${optionId}`, {
        method: "PATCH",
        body: formData,
      }, getToken);

      await throwApiError(res, "Failed to update option");

      return res.json().catch(() => null) as Promise<{ message?: string } | null>;
    },
    onSuccess: (payload) => {
      setEditingOptionId(null);
      setEditingOptionNp("");
      setEditingOptionEn("");
      setEditingOptionImage(null);
      queryClient.invalidateQueries({ queryKey: ["poll", id] });
      queryClient.invalidateQueries({ queryKey: ["polls"] });
      showToast({
        type: "success",
        title: payload?.message || (lang === "Np" ? "विकल्प परिमार्जन भयो" : "Option updated"),
      });
    },
    onError: (error) => {
      const fallback = lang === "Np" ? "विकल्प परिमार्जन गर्न सकिएन" : "Could not update option";
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

  const handleEditOption = (option: PollOption) => {
    setEditingOptionId(option.id);
    setEditingOptionNp(option.optionTextNp);
    setEditingOptionEn(option.optionTextEn);
    setEditingOptionImage(null);
  };

  const handleSaveOption = () => {
    if (!editingOptionId) return;
    if (!editingOptionNp.trim() && !editingOptionEn.trim() && !editingOptionImage) {
      showToast({
        type: "error",
        title: lang === "Np" ? "कम्तिमा एक परिवर्तन आवश्यक छ" : "At least one change is required",
      });
      return;
    }
    updateOptionMutation.mutate(editingOptionId);
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
  const selectedOptionId = pollData.userVote?.optionId;

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
          <input
            type="file"
            accept="image/*"
            className="ui-input md:col-span-3"
            onChange={(e) => setNewOptionImage(e.target.files?.[0] || null)}
          />
        </div>
      </div>
      
      <div className="space-y-4">
        {poll.options.map((opt: PollOption) => {
          const percent = total > 0 ? Math.round((opt.voteCount / total) * 100) : 0;
          const isSelected = selectedOptionId === opt.id;
          const imageSrc = getOptionImageSrc(opt);

          return (
            <div key={opt.id} className="space-y-2">
              <div className="flex items-stretch gap-2">
                <button
                  disabled={voteMutation.isPending}
                  onClick={() => voteMutation.mutate(opt.id)}
                  className={`poll-detail-vote flex-1 min-h-16 disabled:opacity-60 disabled:cursor-not-allowed ${isSelected ? "is-selected" : ""}`}
                >
                  <div className={`poll-detail-vote-fill ${isSelected ? "is-selected" : ""}`} style={{ width: `${percent}%` }} />
                  <div className="relative z-10 px-6 py-3 flex justify-between items-center gap-3 font-bold">
                    <div className="flex items-center gap-3 min-w-0">
                      {imageSrc && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={imageSrc} alt={lang === "Np" ? opt.optionTextNp : opt.optionTextEn} className="h-10 w-10 rounded-lg object-cover" />
                      )}
                      <span className={isSelected ? "text-primary truncate" : "text-on-surface truncate"}>
                        {lang === "Np" ? opt.optionTextNp : opt.optionTextEn}
                        {isSelected && " (Voted)"}
                      </span>
                    </div>
                    <span className="text-sm font-black shrink-0">{percent}%</span>
                  </div>
                </button>
                <AdminOnly>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleEditOption(opt)}
                      disabled={updateOptionMutation.isPending}
                      className="ui-btn-secondary rounded-2xl px-3 text-sm"
                      aria-label={lang === "Np" ? "विकल्प सम्पादन गर्नुहोस्" : "Edit option"}
                      title={lang === "Np" ? "विकल्प सम्पादन गर्नुहोस्" : "Edit option"}
                    >
                      {lang === "Np" ? "सम्पादन" : "Edit"}
                    </button>
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
                  </div>
                </AdminOnly>
              </div>

              {editingOptionId === opt.id && (
                <div className="form-card">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <input
                      value={editingOptionNp}
                      onChange={(e) => setEditingOptionNp(e.target.value)}
                      placeholder="विकल्प पाठ (नेपाली)"
                      className="ui-input"
                    />
                    <input
                      value={editingOptionEn}
                      onChange={(e) => setEditingOptionEn(e.target.value)}
                      placeholder="Option text (English)"
                      className="ui-input"
                    />
                    <input
                      type="file"
                      accept="image/*"
                      className="ui-input md:col-span-2"
                      onChange={(e) => setEditingOptionImage(e.target.files?.[0] || null)}
                    />
                  </div>
                  <div className="mt-3 flex gap-2">
                    <button
                      type="button"
                      onClick={handleSaveOption}
                      disabled={updateOptionMutation.isPending}
                      className="ui-btn-primary px-4 py-2 text-sm"
                    >
                      {updateOptionMutation.isPending
                        ? lang === "Np"
                          ? "सेभ हुँदै..."
                          : "Saving..."
                        : lang === "Np"
                          ? "सेभ गर्नुहोस्"
                          : "Save"}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingOptionId(null);
                        setEditingOptionImage(null);
                      }}
                      className="ui-btn-secondary px-4 py-2 text-sm"
                    >
                      {lang === "Np" ? "रद्द गर्नुहोस्" : "Cancel"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}