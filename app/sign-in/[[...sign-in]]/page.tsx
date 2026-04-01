import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="flex min-h-[80vh] items-center justify-center">
      <SignIn 
        appearance={{
          elements: {
            card: "shadow-none border border-outline-variant/20 rounded-3xl bg-surface-container-lowest",
            headerTitle: "font-headline text-primary",
            primaryButton: "bg-primary hover:bg-primary-container transition-all"
          }
        }} 
      />
    </div>
  );
}