"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ProviderLogin() {
  const router = useRouter();

  useEffect(() => {
    if (localStorage.getItem("logged_in")) {
      router.replace("/dashboard");
    } else {
      router.replace("/register?mode=signin");
    }
  }, [router]);

  return null;
}
