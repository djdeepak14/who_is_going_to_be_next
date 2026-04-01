"use client";

import { useEffect, useState } from "react";

import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import Image from "next/image";
import { fetcher, getApiBaseUrl, getApiErrorMessage, getErrorMessage } from "@/app/lib/api-client";
import { useLanguage } from "@/app/context/LanguageContext";
import { useToast } from "@/app/components/ToastProvider";

const API_BASE = getApiBaseUrl();
const MAX_FILE_SIZE = 20 * 1024 * 1024;

export default function CreateArresteePage() {
  const { lang } = useLanguage();
  const { showToast } = useToast();
  const { getToken } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [selectedImageName, setSelectedImageName] = useState<string>("");
  const fieldClass = "ui-input";
  const textareaClass = `${fieldClass} ui-textarea`;

  useEffect(() => {
    return () => {
      if (imagePreviewUrl) {
        URL.revokeObjectURL(imagePreviewUrl);
      }
    };
  }, [imagePreviewUrl]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      setSelectedImageName("");
      if (imagePreviewUrl) {
        URL.revokeObjectURL(imagePreviewUrl);
      }
      setImagePreviewUrl(null);
      return;
    }

    setSelectedImageName(file.name);
    if (imagePreviewUrl) {
      URL.revokeObjectURL(imagePreviewUrl);
    }
    setImagePreviewUrl(URL.createObjectURL(file));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const form = e.currentTarget;
    const raw = new FormData(form);
    const profileImg = raw.get("profileImg");

    if (profileImg instanceof File && profileImg.size > MAX_FILE_SIZE) {
      setLoading(false);
      const message = lang === "Np" ? "फाइल 20MB भन्दा सानो हुनुपर्छ" : "File must be less than 20MB";
      setError(message);
      showToast({ type: "error", title: message });
      return;
    }

    const formData = new FormData();
    const detailsEn = (raw.get("detailsEnText") as string)
      .split("\n")
      .map((item) => item.trim())
      .filter(Boolean);
    const detailsNp = (raw.get("detailsNpText") as string)
      .split("\n")
      .map((item) => item.trim())
      .filter(Boolean);

    formData.append("nameEn", String(raw.get("nameEn") || ""));
    formData.append("nameNp", String(raw.get("nameNp") || ""));
    formData.append("age", String(raw.get("age") || ""));
    formData.append("postEn", String(raw.get("postEn") || ""));
    formData.append("postNp", String(raw.get("postNp") || ""));
    formData.append("causeEn", String(raw.get("causeEn") || ""));
    formData.append("causeNp", String(raw.get("causeNp") || ""));

    for (const detail of detailsEn) {
      formData.append("detailsEn", detail);
    }
    for (const detail of detailsNp) {
      formData.append("detailsNp", detail);
    }

    if (profileImg instanceof File && profileImg.size > 0) {
      formData.append("profileImg", profileImg);
    }

    try {
      const res = await fetcher(`${API_BASE}/arrestee`, {
        method: "POST",
        body: formData,
      }, getToken);

      if (res.ok) {
        showToast({
          type: "success",
          title: lang === "Np" ? "रेकर्ड सफलतापूर्वक सिर्जना भयो" : "Record created successfully",
        });
        router.push("/");
      } else {
        const fallback = lang === "Np" ? "रेकर्ड सिर्जना गर्न सकिएन" : "Failed to create record";
        const message = await getApiErrorMessage(res, fallback);
        throw new Error(message);
      }
    } catch (error) {
      const fallback = lang === "Np" ? "रेकर्ड सिर्जना गर्न सकिएन" : "Failed to create record";
      const message = getErrorMessage(error, fallback);
      setError(message);
      showToast({ type: "error", title: message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-wrap max-w-4xl mx-auto py-12 content-fade-in">
      <div className="form-card">
        <p className="page-header-kicker mb-4">
          <span className="kicker-dot" />
          {lang === "Np" ? "नयाँ प्रोफाइल प्रविष्टि" : "New Profile Entry"}
        </p>
        <h1 className="ink-title text-3xl md:text-5xl font-black font-headline text-on-surface mb-2 leading-tight">
          {lang === "Np" ? "गिरफ्तारी प्रोफाइल" : "Create Custody "}
          <span className="text-primary">{lang === "Np" ? "सिर्जना गर्नुहोस्" : "Profile"}</span>
        </h1>
        <p className="text-sm text-on-surface-variant mb-8 max-w-2xl">
          {lang === "Np" ? "नेपाली र अंग्रेजी दुवै भाषामा तथ्यहरू स्पष्ट रूपमा भरेर नयाँ रेकर्ड सुरक्षित गर्नुहोस्।" : "Add clear details in both Nepali and English to publish a complete profile."}
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error ? <p className="error-banner">{error}</p> : null}

          <section className="space-y-4">
            <h2 className="section-label">
              {lang === "Np" ? "आधारभूत जानकारी" : "Basic Information"}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="nameNp" className="text-sm font-bold text-on-surface">{lang === "Np" ? "नाम (नेपाली)" : "Name (Nepali)"}</label>
                <input id="nameNp" name="nameNp" placeholder="नाम (नेपाली)" className={fieldClass} required />
              </div>
              <div className="space-y-2">
                <label htmlFor="nameEn" className="text-sm font-bold text-on-surface">{lang === "Np" ? "नाम (अंग्रेजी)" : "Name (English)"}</label>
                <input id="nameEn" name="nameEn" placeholder="Name (English)" className={fieldClass} required />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2 md:col-span-1">
                <label htmlFor="age" className="text-sm font-bold text-on-surface">{lang === "Np" ? "उमेर" : "Age"}</label>
                <input id="age" name="age" type="number" min={1} step={1} placeholder={lang === "Np" ? "उमेर" : "Age"} className={fieldClass} required />
              </div>
              <div className="space-y-2 md:col-span-1">
                <label htmlFor="postNp" className="text-sm font-bold text-on-surface">{lang === "Np" ? "पद (नेपाली)" : "Post (Nepali)"}</label>
                <input id="postNp" name="postNp" placeholder="पद (नेपाली)" className={fieldClass} required />
              </div>
              <div className="space-y-2 md:col-span-1">
                <label htmlFor="postEn" className="text-sm font-bold text-on-surface">{lang === "Np" ? "पद (अंग्रेजी)" : "Post (English)"}</label>
                <input id="postEn" name="postEn" placeholder="Post (English)" className={fieldClass} required />
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
                <textarea id="causeNp" name="causeNp" placeholder="पक्राउको मुख्य कारण (नेपाली)" className={textareaClass} required />
              </div>
              <div className="space-y-2">
                <label htmlFor="causeEn" className="text-sm font-bold text-on-surface">{lang === "Np" ? "मुख्य कारण (अंग्रेजी)" : "Main Cause (English)"}</label>
                <textarea id="causeEn" name="causeEn" placeholder="Main cause of arrest (English)" className={textareaClass} required />
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
                  placeholder={lang === "Np" ? "प्रत्येक लाइनमा एउटा बुँदा लेख्नुहोस्" : "Write one detail per line"}
                  className={textareaClass}
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="detailsEnText" className="text-sm font-bold text-on-surface">{lang === "Np" ? "विवरण (अंग्रेजी)" : "Details (English)"}</label>
                <textarea
                  id="detailsEnText"
                  name="detailsEnText"
                  placeholder="Write one detail per line"
                  className={textareaClass}
                />
              </div>
            </div>
          </section>

          <div className="rounded-2xl border border-dashed border-outline-variant bg-surface-container-low p-6">
            <label className="cursor-pointer group block text-center">
              <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-surface-container-lowest border border-outline-variant/60 text-on-surface-variant group-hover:text-primary group-hover:border-primary/40 transition-colors">
                <svg viewBox="0 0 24 24" aria-hidden="true" className="h-7 w-7 fill-current">
                  <path d="M19 20H5c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2h4l1.4 1.5h3.2L15 4h4c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2Zm-7-5 4-4h-3V7h-2v4H8l4 4Z" />
                </svg>
              </div>
              <p className="font-bold text-on-surface-variant">
                {lang === "Np" ? "प्रोफाइल फोटो छान्नुहोस् (20MB सम्म)" : "Select profile image (up to 20MB)"}
              </p>
              <p className="mt-1 text-xs text-on-surface-variant/80">
                {lang === "Np" ? "JPG, PNG, WEBP समर्थित" : "JPG, PNG, WEBP supported"}
              </p>
              <input
                type="file"
                name="profileImg"
                className="hidden"
                accept="image/*"
                onChange={handleImageChange}
              />
            </label>

            {selectedImageName ? (
              <p className="mt-4 text-center text-sm font-bold text-on-surface">{selectedImageName}</p>
            ) : null}

            {imagePreviewUrl ? (
              <div className="mt-4 overflow-hidden rounded-2xl border border-outline-variant/60 bg-surface-container-lowest">
                <Image
                  src={imagePreviewUrl}
                  alt={lang === "Np" ? "छानिएको प्रोफाइल फोटोको पूर्वावलोकन" : "Preview of selected profile image"}
                  className="h-64 w-full object-cover"
                  width={1024}
                  height={512}
                  unoptimized
                />
              </div>
            ) : null}
          </div>

          <button
            disabled={loading}
            className="ui-btn-primary w-full py-4 shadow-lg"
          >
            {loading
              ? lang === "Np"
                ? "प्रक्रियामा..."
                : "Submitting..."
              : lang === "Np"
                ? "प्रोफाइल प्रकाशित गर्नुहोस्"
                : "Publish Profile"}
          </button>
        </form>
      </div>
    </div>
  );
}