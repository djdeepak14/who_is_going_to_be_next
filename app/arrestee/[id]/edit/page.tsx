"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";

import { useLanguage } from "@/app/context/LanguageContext";
import { fetcher, getApiBaseUrl, getErrorMessage, throwApiError } from "@/app/lib/api-client";
import { CanManage } from "@/app/components/AuthGuard";
import { useToast } from "@/app/components/ToastProvider";
import StateMessage from "@/app/components/StateMessage";

const API_BASE = getApiBaseUrl();
const MAX_FILE_SIZE = 20 * 1024 * 1024;

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
};

type ArresteeResponse = {
  data?: Arrestee;
};

export default function EditArresteePage() {
  const { lang } = useLanguage();
  const { showToast } = useToast();
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const arresteeId = params?.id;

  const [error, setError] = useState("");
  const fieldClass = "ui-input";
  const textareaClass = `${fieldClass} ui-textarea`;

  const arresteeQuery = useQuery<ArresteeResponse>({
    queryKey: ["arrestee", arresteeId],
    queryFn: async () => {
      const res = await fetcher(`${API_BASE}/arrestee/${arresteeId}`, {
        method: "GET",
      });
      await throwApiError(res, "Failed to load arrestee");
      return (await res.json()) as ArresteeResponse;
    },
    enabled: Boolean(arresteeId),
    gcTime: 5 * 60 * 1000,
    staleTime: 1 * 60 * 1000,
  });

  const updateMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const res = await fetcher(`${API_BASE}/arrestee/${arresteeId}`, {
        method: "PATCH",
        body: formData,
      });

      await throwApiError(res, "Failed to update arrestee");
      return res.json().catch(() => null);
    },
    onSuccess: () => {
      showToast({
        type: "success",
        title: lang === "Np" ? "रेकर्ड अपडेट भयो" : "Record updated",
      });
      router.push(`/arrestee/${arresteeId}`);
    },
    onError: (mutationError) => {
      const fallback = lang === "Np" ? "अपडेट गर्न सकिएन" : "Failed to update";
      const message = getErrorMessage(mutationError, fallback);
      setError(message);
      showToast({
        type: "error",
        title: message,
      });
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    const form = e.currentTarget;
    const raw = new FormData(form);
    const profileImg = raw.get("profileImg");
    const nameEn = String(raw.get("nameEn") || "").trim();
    const nameNp = String(raw.get("nameNp") || "").trim();
    const age = String(raw.get("age") || "").trim();
    const postEn = String(raw.get("postEn") || "").trim();
    const postNp = String(raw.get("postNp") || "").trim();
    const causeEn = String(raw.get("causeEn") || "").trim();
    const causeNp = String(raw.get("causeNp") || "").trim();
    const detailsEnText = String(raw.get("detailsEnText") || "");
    const detailsNpText = String(raw.get("detailsNpText") || "");

    if (profileImg instanceof File && profileImg.size > MAX_FILE_SIZE) {
      const message = lang === "Np" ? "फाइल 20MB भन्दा सानो हुनुपर्छ" : "File must be less than 20MB";
      setError(message);
      showToast({ type: "error", title: message });
      return;
    }

    const detailsEn = detailsEnText
      .split("\n")
      .map((item) => item.trim())
      .filter(Boolean);
    const detailsNp = detailsNpText
      .split("\n")
      .map((item) => item.trim())
      .filter(Boolean);

    const formData = new FormData();
    formData.append("nameEn", nameEn);
    formData.append("nameNp", nameNp);
    formData.append("age", age);
    formData.append("postEn", postEn);
    formData.append("postNp", postNp);
    formData.append("causeEn", causeEn);
    formData.append("causeNp", causeNp);

    for (const detail of detailsEn) {
      formData.append("detailsEn", detail);
    }
    for (const detail of detailsNp) {
      formData.append("detailsNp", detail);
    }

    if (profileImg instanceof File && profileImg.size > 0) {
      formData.append("profileImg", profileImg);
    }

    updateMutation.mutate(formData);
  };

  const arresteeData = arresteeQuery.data?.data;

  return (
    <CanManage>
      <div className="page-wrap max-w-4xl mx-auto py-12 content-fade-in" aria-busy={arresteeQuery.isLoading}>
        <p className="page-header-kicker mb-4">
          <span className="kicker-dot" />
          {lang === "Np" ? "सम्पादन मोड" : "Edit Mode"}
        </p>
        <h1 className="ink-title text-3xl md:text-5xl font-black font-headline text-on-surface mb-8 leading-tight">
          {lang === "Np" ? "गिरफ्तारी प्रोफाइल" : "Update Custody "}
          <span className="text-primary">{lang === "Np" ? "परिमार्जन" : "Profile"}</span>
        </h1>

        {arresteeQuery.isLoading ? (
          <div className="paper-panel rounded-3xl p-6 md:p-8 space-y-6" role="status" aria-live="polite" aria-busy="true">
            <span className="sr-only">Loading arrestee details...</span>
            <div className="skeleton-shimmer h-9 w-1/3" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="skeleton-shimmer h-12" />
              <div className="skeleton-shimmer h-12" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="skeleton-shimmer h-12" />
              <div className="skeleton-shimmer h-12" />
              <div className="skeleton-shimmer h-12" />
            </div>
            <div className="space-y-3">
              <div className="skeleton-shimmer h-4 w-28" />
              <div className="skeleton-shimmer h-28" />
              <div className="skeleton-shimmer h-28" />
            </div>
            <div className="space-y-3">
              <div className="skeleton-shimmer h-4 w-32" />
              <div className="skeleton-shimmer h-24" />
              <div className="skeleton-shimmer h-24" />
            </div>
            <div className="skeleton-shimmer h-24" />
            <div className="skeleton-shimmer h-14" />
          </div>
        ) : null}
        {arresteeQuery.isError ? (
          <StateMessage
            tone="error"
            message={getErrorMessage(
              arresteeQuery.error,
              lang === "Np" ? "डेटा लोड गर्न सकिएन" : "Failed to load data",
            )}
            className="py-10"
          />
        ) : null}

        {!arresteeQuery.isLoading && !arresteeQuery.isError && !arresteeData ? (
          <StateMessage
            tone="empty"
            message={lang === "Np" ? "रेकर्ड फेला परेन" : "Record not found"}
            className="py-10"
          />
        ) : null}

        {!arresteeQuery.isLoading && !arresteeQuery.isError && arresteeData ? (
          <form key={arresteeData.id} onSubmit={handleSubmit} className="form-card space-y-6 content-fade-in">
            {error ? <p className="error-banner">{error}</p> : null}

            <section className="space-y-4">
              <h2 className="section-label">
                {lang === "Np" ? "आधारभूत जानकारी" : "Basic Information"}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="nameNp" className="text-sm font-bold text-on-surface">{lang === "Np" ? "नाम (नेपाली)" : "Name (Nepali)"}</label>
                  <input
                    id="nameNp"
                    name="nameNp"
                    defaultValue={arresteeData?.nameNp || ""}
                    placeholder="नाम (नेपाली)"
                    className={fieldClass}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="nameEn" className="text-sm font-bold text-on-surface">{lang === "Np" ? "नाम (अंग्रेजी)" : "Name (English)"}</label>
                  <input
                    id="nameEn"
                    name="nameEn"
                    defaultValue={arresteeData?.nameEn || ""}
                    placeholder="Name (English)"
                    className={fieldClass}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2 md:col-span-1">
                  <label htmlFor="age" className="text-sm font-bold text-on-surface">{lang === "Np" ? "उमेर" : "Age"}</label>
                  <input
                    id="age"
                    name="age"
                    type="number"
                    min={1}
                    step={1}
                    defaultValue={String(arresteeData?.age ?? "")}
                    placeholder={lang === "Np" ? "उमेर" : "Age"}
                    className={fieldClass}
                    required
                  />
                </div>
                <div className="space-y-2 md:col-span-1">
                  <label htmlFor="postNp" className="text-sm font-bold text-on-surface">{lang === "Np" ? "पद (नेपाली)" : "Post (Nepali)"}</label>
                  <input
                    id="postNp"
                    name="postNp"
                    defaultValue={arresteeData?.postNp || ""}
                    placeholder="पद (नेपाली)"
                    className={fieldClass}
                    required
                  />
                </div>
                <div className="space-y-2 md:col-span-1">
                  <label htmlFor="postEn" className="text-sm font-bold text-on-surface">{lang === "Np" ? "पद (अंग्रेजी)" : "Post (English)"}</label>
                  <input
                    id="postEn"
                    name="postEn"
                    defaultValue={arresteeData?.postEn || ""}
                    placeholder="Post (English)"
                    className={fieldClass}
                    required
                  />
                </div>
              </div>
            </section>

            <section className="space-y-4">
              <h2 className="section-label">
                {lang === "Np" ? "पक्राउको कारण" : "Arrest Cause"}
              </h2>
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <label htmlFor="causeNp" className="text-sm font-bold text-on-surface">{lang === "Np" ? "मुख्य कारण (नेपाली)" : "Main Cause (Nepali)"}</label>
                  <textarea
                    id="causeNp"
                    name="causeNp"
                    defaultValue={arresteeData?.causeNp || ""}
                    placeholder="पक्राउको मुख्य कारण (नेपाली)"
                    className={textareaClass}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="causeEn" className="text-sm font-bold text-on-surface">{lang === "Np" ? "मुख्य कारण (अंग्रेजी)" : "Main Cause (English)"}</label>
                  <textarea
                    id="causeEn"
                    name="causeEn"
                    defaultValue={arresteeData?.causeEn || ""}
                    placeholder="Main cause of arrest (English)"
                    className={textareaClass}
                    required
                  />
                </div>
              </div>
            </section>

            <section className="space-y-4">
              <h2 className="section-label">
                {lang === "Np" ? "थप विवरण" : "Additional Details"}
              </h2>
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <label htmlFor="detailsNpText" className="text-sm font-bold text-on-surface">{lang === "Np" ? "विवरण (नेपाली)" : "Details (Nepali)"}</label>
                  <textarea
                    id="detailsNpText"
                    name="detailsNpText"
                    defaultValue={(arresteeData?.detailsNp || []).join("\n")}
                    placeholder={lang === "Np" ? "प्रत्येक लाइनमा एउटा बुँदा लेख्नुहोस्" : "Write one detail per line"}
                    className={textareaClass}
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="detailsEnText" className="text-sm font-bold text-on-surface">{lang === "Np" ? "विवरण (अंग्रेजी)" : "Details (English)"}</label>
                  <textarea
                    id="detailsEnText"
                    name="detailsEnText"
                    defaultValue={(arresteeData?.detailsEn || []).join("\n")}
                    placeholder="Write one detail per line"
                    className={textareaClass}
                  />
                </div>
              </div>
            </section>

            <div className="rounded-2xl border border-dashed border-outline-variant bg-surface-container-low p-6 text-center">
              <label className="cursor-pointer group">
                <span className="material-symbols-outlined text-4xl text-outline group-hover:text-primary transition-colors">add_a_photo</span>
                <p className="mt-2 font-bold text-on-surface-variant">
                  {lang === "Np" ? "नयाँ प्रोफाइल फोटो (वैकल्पिक, 20MB सम्म)" : "New profile image (optional, up to 20MB)"}
                </p>
                <input type="file" name="profileImg" className="hidden" accept="image/*" />
              </label>
            </div>

            <button
              disabled={updateMutation.isPending}
              className="ui-btn-primary w-full py-4 shadow-lg"
            >
              {updateMutation.isPending
                ? lang === "Np"
                  ? "अपडेट हुँदैछ..."
                  : "Updating..."
                : lang === "Np"
                  ? "परिवर्तन सुरक्षित गर्नुहोस्"
                  : "Save Changes"}
            </button>
          </form>
        ) : null}
      </div>
    </CanManage>
  );
}
