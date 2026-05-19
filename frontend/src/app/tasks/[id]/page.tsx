import { redirect } from "next/navigation";

interface TaskRedirectPageProps {
  params: Promise<{ id: string }>;
}

export default async function TaskRedirectPage({ params }: TaskRedirectPageProps) {
  const { id } = await params;
  redirect(`/gigs/${id}`);
}
