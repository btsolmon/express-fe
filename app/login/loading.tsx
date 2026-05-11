import { Suspense } from "react";
import LoginPage from "./page";

export default function Loading() {
  return (
    <Suspense>
      <LoginPage />
    </Suspense>
  );
}