"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ProviderRegister() {
  const router = useRouter();

  useEffect(() => {
    if (localStorage.getItem("logged_in")) {
      router.replace("/dashboard?section=my-agents");
    } else {
      router.replace("/register");
    }
  }, [router]);

  return null;
}
