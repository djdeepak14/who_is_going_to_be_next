"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth, useUser } from "@clerk/nextjs";
import { useMutation } from "@tanstack/react-query";
import { useLanguage } from "@/app/context/LanguageContext";
import { useToast } from "@/app/components/ToastProvider";
import { fetcher, getApiBaseUrl, getErrorMessage, throwApiError } from "@/app/lib/api-client";
import { FormPageSkeleton } from "@/app/components/PageSkeletons";

const API_BASE = getApiBaseUrl();
const POLL_API = `${API_BASE}/poll`;
const MAX_OPTIONS = 20;
const MIN_OPTIONS = 2;

type PollOptionDraft = {
  optionTextNp: string;
  optionTextEn: string;
};

export default function CreatePollPage() {
  const { lang } = useLanguage();
  const { showToast } = useToast();
  const { getToken } = useAuth();
  const { isLoaded, isSignedIn } = useUser();
  const router = useRouter();

  const [titleNp, setTitleNp] = useState("");
  const [titleEn, setTitleEn] = useState("");
  const [descriptionNp, setDescriptionNp] = useState("");
  const [descriptionEn, setDescriptionEn] = useState("");
  const [options, setOptions] = useState<PollOptionDraft[]>([
    { optionTextNp: "", optionTextEn: "" },
    { optionTextNp: "", optionTextEn: "" },
  ]);

  const createPollMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        titleEn: titleEn.trim(),
        titleNp: titleNp.trim(),
        descriptionEn: descriptionEn.trim() || undefined,
        descriptionNp: descriptionNp.trim() || undefined,
        options: options.map((option) => ({
          optionTextEn: option.optionTextEn.trim(),
          optionTextNp: option.optionTextNp.trim(),
        })),
      };

      const res = await fetcher(POLL_API, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      }, getToken);

      await throwApiError(res, "Failed to create poll");

      return res.json().catch(() => null);
    },
    onSuccess: () => {
      showToast({
        type: "success",
        title: lang === "Np" ? "पोल सफलतापूर्वक सिर्जना भयो" : "Poll created successfully",
      });
      router.push("/polls");
    },
    onError: (error) => {
      const fallback = lang === "Np" ? "पोल सिर्जना गर्न सकिएन" : "Could not create poll";
      showToast({
        type: "error",
        title: getErrorMessage(error, fallback),
      });
    },
  });

  const updateOption = (index: number, key: keyof PollOptionDraft, value: string) => {
    setOptions((prev) => prev.map((opt, i) => (i === index ? { ...opt, [key]: value } : opt)));
  };

  const addOption = () => {
    if (options.length >= MAX_OPTIONS) return;
    setOptions((prev) => [...prev, { optionTextNp: "", optionTextEn: "" }]);
  };

  const removeOption = (index: number) => {
    if (options.length <= MIN_OPTIONS) return;
    setOptions((prev) => prev.filter((_, i) => i !== index));
  };

  const validate = () => {
    if (!titleNp.trim() || !titleEn.trim()) {
      showToast({
        type: "error",
        title: lang === "Np" ? "पोल शीर्षक अनिवार्य छ" : "Poll titles are required",
      });
      return false;
    }

    if (options.length < MIN_OPTIONS) {
      showToast({
        type: "error",
        title: lang === "Np" ? "कम्तिमा २ विकल्प आवश्यक छन्" : "At least 2 options are required",
      });
      return false;
    }

    const invalidOption = options.some((option) => !option.optionTextNp.trim() || !option.optionTextEn.trim());
    if (invalidOption) {
      showToast({
        type: "error",
        title: lang === "Np" ? "प्रत्येक विकल्पको नेपाली र अङ्ग्रेजी पाठ अनिवार्य छ" : "Each option must have Nepali and English text",
      });
      return false;
    }

    return true;
  };

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validate()) return;
    createPollMutation.mutate();
  };

  if (!isLoaded) {
    return <FormPageSkeleton />;
  }

  if (!isSignedIn) {
    return (
      <div className="page-wrap max-w-2xl mx-auto py-14">
        <div className="paper-panel rounded-2xl p-8 text-center">
          <h1 className="text-2xl font-black font-headline text-primary mb-3">
            {lang === "Np" ? "अनुमति छैन" : "Access denied"}
          </h1>
          <p className="text-on-surface-variant">
            {lang === "Np" ? "यो पेज प्रयोग गर्न लगइन आवश्यक छ।" : "You need to be signed in to use this page."}
          </p>
          <Link href="/polls" className="inline-block mt-5 font-bold text-primary hover:underline">
            {lang === "Np" ? "पोल सूचीमा फर्कनुहोस्" : "Back to polls"}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="page-wrap max-w-5xl mx-auto py-10 content-fade-in">
      <div className="form-card">
        <p className="page-header-kicker mb-4">
          <span className="kicker-dot" />
          {lang === "Np" ? "समुदाय पोल स्टुडियो" : "Community Poll Studio"}
        </p>
        <h1 className="ink-title text-3xl md:text-5xl font-black font-headline text-on-surface mb-3 leading-tight">
          {lang === "Np" ? "नयाँ बहस सुरु गर्न" : "Launch a New "}
          <span className="text-primary">{lang === "Np" ? "पोल बनाउनुहोस्" : "Poll"}</span>
        </h1>
        <p className="text-on-surface-variant mb-8 max-w-2xl">
          {lang === "Np" ? "प्रश्न र विकल्पहरू नेपाली र अंग्रेजीमा राख्दा बढी मानिस सहभागी हुन सजिलो हुन्छ।" : "Add the question and options in both languages to maximize participation."}
        </p>

        <form onSubmit={onSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              value={titleNp}
              onChange={(e) => setTitleNp(e.target.value)}
              placeholder="पोल शीर्षक (नेपाली)"
              className="ui-input"
              required
            />
            <input
              value={titleEn}
              onChange={(e) => setTitleEn(e.target.value)}
              placeholder="Poll title (English)"
              className="ui-input"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <textarea
              value={descriptionNp}
              onChange={(e) => setDescriptionNp(e.target.value)}
              placeholder="विवरण (नेपाली, वैकल्पिक)"
              className="ui-input h-24"
            />
            <textarea
              value={descriptionEn}
              onChange={(e) => setDescriptionEn(e.target.value)}
              placeholder="Description (English, optional)"
              className="ui-input h-24"
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="section-label">
                {lang === "Np" ? "विकल्पहरू" : "Options"}
              </h2>
              <button
                type="button"
                onClick={addOption}
                disabled={options.length >= MAX_OPTIONS}
                className="ui-btn-primary px-4 py-2"
              >
                {lang === "Np" ? "नयाँ विकल्प थप्नुहोस्" : "Add Option"}
              </button>
            </div>

            {options.map((option, index) => (
              <div key={index} className="paper-panel rounded-2xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-bold text-on-surface-variant">
                    {lang === "Np" ? `विकल्प ${index + 1}` : `Option ${index + 1}`}
                  </p>
                  <button
                    type="button"
                    onClick={() => removeOption(index)}
                    disabled={options.length <= MIN_OPTIONS}
                    className="text-xs font-bold text-error disabled:opacity-40"
                  >
                    {lang === "Np" ? "हटाउनुहोस्" : "Remove"}
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <input
                    value={option.optionTextNp}
                    onChange={(e) => updateOption(index, "optionTextNp", e.target.value)}
                    placeholder="विकल्प पाठ (नेपाली)"
                    className="ui-input"
                    required
                  />
                  <input
                    value={option.optionTextEn}
                    onChange={(e) => updateOption(index, "optionTextEn", e.target.value)}
                    placeholder="Option text (English)"
                    className="ui-input"
                    required
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={createPollMutation.isPending}
              className="ui-btn-primary px-6 py-3"
            >
              {createPollMutation.isPending
                ? lang === "Np"
                  ? "सिर्जना हुँदैछ..."
                  : "Creating..."
                : lang === "Np"
                  ? "पोल प्रकाशित गर्नुहोस्"
                  : "Publish Poll"}
            </button>
            <Link href="/polls" className="ui-btn-secondary px-6 py-3">
              {lang === "Np" ? "रद्द गर्नुहोस्" : "Cancel"}
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
