import { redirect } from "next/navigation";

export default function ClientStoriesPage() {
  redirect("/blog?category=client-stories");
}
