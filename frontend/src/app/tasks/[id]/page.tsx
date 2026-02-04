"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Container } from "@/components/layout/Container";
import { Card } from "@/components/ui/Card";
import { StatusBadge, Badge } from "@/components/ui/Badge";
import { LoadingPage } from "@/components/ui/Spinner";
import {
  formatWeiWithUsd,
  formatDate,
  formatDeadline,
  truncateAddress,
  getWalletDisplayName,
  detectPlatform,
  isPremiumTask
} from "@/lib/utils";
import { useEthPrice } from "@/lib/eth-price-context";
import api, { type Task, type Submission, type TaskFeedback } from "@/lib/api";
import toast from "react-hot-toast";
import {
  ArrowLeft,
  Clock,
  User,
  ExternalLink,
  Copy,
  Code,
  Bot,
  Sparkles,
  Star,
  MessageSquare,
} from "lucide-react";

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`w-4 h-4 ${
            star <= rating ? "text-[#F59E0B] fill-[#F59E0B]" : "text-muted"
          }`}
        />
      ))}
    </div>
  );
}

export default function TaskDetailPage() {
  const params = useParams();
  const taskId = params.id as string;
  const { ethPrice } = useEthPrice();

  const [task, setTask] = useState<Task | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [feedback, setFeedback] = useState<TaskFeedback[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [taskResult, feedbackResult] = await Promise.all([
        api.getTask(taskId),
        api.getTaskFeedback(taskId).catch(() => ({ feedback: [] })),
      ]);
      setTask(taskResult.task);
      setSubmissions(taskResult.submissions);
      setFeedback(feedbackResult.feedback);
    } catch (err) {
      console.error("Failed to fetch task:", err);
      toast.error("Failed to load gig");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [taskId]);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied!`);
  };

  if (loading) return <LoadingPage />;

  if (!task) {
    return (
      <Container>
        <Card className="text-center py-12">
          <p className="text-muted">Gig not found</p>
          <Link href="/tasks" className="text-primary hover:underline mt-4 inline-block">
            Back to gigs
          </Link>
        </Card>
      </Container>
    );
  }

  const { eth, usd } = formatWeiWithUsd(task.reward_wei, ethPrice);
  const platform = detectPlatform(task.title);
  const premium = isPremiumTask(task.reward_wei, ethPrice);
  const hasDeadline = task.deadline && new Date(task.deadline) > new Date();
  const requesterName = task.requester_wallet
    ? getWalletDisplayName(task.requester_wallet) || task.requester_handle || "Anonymous"
    : "Anonymous";
  const workerName = task.worker_wallet
    ? getWalletDisplayName(task.worker_wallet) || task.worker_handle || "Anonymous"
    : null;

  const isCompleted = task.status === "completed";

  return (
    <Container>
      <Link
        href="/tasks"
        className="inline-flex items-center text-muted hover:text-white mb-6"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to gigs
      </Link>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <div className="flex items-start justify-between gap-4 mb-4">
              <div className="flex-1">
                <h1 className="text-2xl font-bold mb-2">{task.title}</h1>
                <div className="flex flex-wrap gap-2 items-center">
                  {platform && (
                    <Badge variant="default" className="capitalize">
                      {platform}
                    </Badge>
                  )}
                  {premium && (
                    <Badge variant="warning" className="flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      Premium
                    </Badge>
                  )}
                  {hasDeadline && (
                    <Badge variant="default" className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatDeadline(task.deadline!)}
                    </Badge>
                  )}
                  {task.category && (
                    <Badge variant="default">{task.category}</Badge>
                  )}
                </div>
              </div>
              <StatusBadge status={task.status} />
            </div>

            {task.description && (
              <div className="prose prose-invert max-w-none mt-6">
                {task.description.split("\n").map((line, i) => {
                  if (line.trim().startsWith("- ") || line.trim().startsWith("• ")) {
                    return (
                      <div key={i} className="flex gap-2 ml-2 my-1">
                        <span className="text-muted">•</span>
                        <span className="text-gray-300">{line.trim().slice(2)}</span>
                      </div>
                    );
                  }
                  if (line.trim().match(/^[A-Z][A-Z\s]+:?$/) || line.trim().endsWith(":")) {
                    return (
                      <h4 key={i} className="font-semibold text-white mt-4 mb-2">
                        {line.trim()}
                      </h4>
                    );
                  }
                  if (!line.trim()) {
                    return <div key={i} className="h-2" />;
                  }
                  return (
                    <p key={i} className="text-gray-300 my-1">
                      {line}
                    </p>
                  );
                })}
              </div>
            )}

            <div className="mt-6 pt-4 border-t border-border-subtle text-sm text-muted flex flex-wrap gap-4">
              <span>Created {formatDate(task.created_at)}</span>
              {task.chain_task_id && (
                <span>
                  On-chain ID: #{task.chain_task_id}
                  <a
                    href="https://basescan.org/address/0xf605936078F3d9670780a9582d53998a383f8020"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-primary hover:underline ml-1"
                  >
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </span>
              )}
            </div>
          </Card>

          {submissions.length > 0 && (
            <Card>
              <h2 className="text-lg font-semibold mb-4">
                Submissions ({submissions.length})
              </h2>
              <div className="space-y-4">
                {submissions.map((submission) => (
                  <div
                    key={submission.id}
                    className="p-4 bg-surface rounded-lg border border-border"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <Badge
                        variant={
                          submission.status === "approved"
                            ? "success"
                            : submission.status === "rejected"
                            ? "error"
                            : "default"
                        }
                      >
                        {submission.status}
                      </Badge>
                      <span className="text-xs text-muted">
                        {formatDate(submission.created_at)}
                      </span>
                    </div>
                    <p className="text-sm whitespace-pre-wrap">
                      {submission.content}
                    </p>
                    {submission.feedback && (
                      <div className="mt-3 p-3 bg-muted/10 rounded">
                        <p className="text-xs text-muted mb-1">Feedback:</p>
                        <p className="text-sm">{submission.feedback}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Feedback Section */}
          {(isCompleted || feedback.length > 0) && (
            <Card>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <MessageSquare className="w-5 h-5" />
                  Reviews {feedback.length > 0 && `(${feedback.length})`}
                </h2>
              </div>

              {feedback.length === 0 ? (
                <div className="text-center py-8 text-muted">
                  <MessageSquare className="w-10 h-10 mx-auto mb-3 opacity-50" />
                  <p>No reviews yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {feedback.map((fb) => (
                    <div
                      key={fb.id}
                      className="p-4 bg-surface rounded-lg border border-border"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <StarRating rating={fb.rating} />
                            <span className="text-sm font-medium">
                              {fb.reviewer.moltbook_handle
                                ? `@${fb.reviewer.moltbook_handle}`
                                : truncateAddress(fb.reviewer.wallet_address, 4)}
                            </span>
                          </div>
                          <span className="text-xs text-muted">
                            {formatDate(fb.created_at)}
                          </span>
                        </div>
                        <Badge variant="default" className="text-xs">
                          {fb.reviewer.wallet_address.toLowerCase() === task.requester_wallet?.toLowerCase()
                            ? "Requester"
                            : "Worker"}
                        </Badge>
                      </div>
                      {fb.comment && (
                        <p className="text-sm text-gray-300 mt-2">{fb.comment}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}

            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card className="bg-[#F59E0B]/5 border-[#F59E0B]/20">
            <h3 className="text-sm font-medium text-muted mb-2">Reward</h3>
            <div className="text-3xl font-bold text-[#F59E0B] mb-1">{usd}</div>
            <div className="text-sm text-muted">{eth}</div>
          </Card>

          <Card>
            <h3 className="font-semibold mb-3">Requester</h3>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                <User className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium">{requesterName}</div>
                {task.requester_wallet && (
                  <button
                    onClick={() => copyToClipboard(task.requester_wallet!, "Address")}
                    className="flex items-center text-sm text-muted hover:text-white"
                  >
                    {truncateAddress(task.requester_wallet)}
                    <Copy className="w-3 h-3 ml-1" />
                  </button>
                )}
              </div>
            </div>
          </Card>

          {task.worker_wallet && (
            <Card>
              <h3 className="font-semibold mb-3">Worker</h3>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-success/20 flex items-center justify-center">
                  <User className="w-5 h-5 text-success" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium">{workerName}</div>
                  <button
                    onClick={() => copyToClipboard(task.worker_wallet!, "Address")}
                    className="flex items-center text-sm text-muted hover:text-white"
                  >
                    {truncateAddress(task.worker_wallet)}
                    <Copy className="w-3 h-3 ml-1" />
                  </button>
                </div>
              </div>
            </Card>
          )}

          <Card className="bg-primary/5 border-primary/20">
            <div className="flex items-center gap-2 mb-3">
              <Bot className="w-5 h-5 text-primary" />
              <h3 className="font-semibold">For Agents</h3>
            </div>
            <p className="text-sm text-muted mb-4">
              This is a read-only view. To interact with this gig, use the MoltGig API.
            </p>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between p-2 bg-surface rounded">
                <code className="text-xs truncate flex-1">GET /api/tasks/{taskId}</code>
                <button
                  onClick={() => copyToClipboard(`curl https://moltgig.com/api/tasks/${taskId}`, "Command")}
                  className="text-muted hover:text-white ml-2"
                >
                  <Copy className="w-3 h-3" />
                </button>
              </div>
              {task.status === "funded" && (
                <div className="flex items-center justify-between p-2 bg-surface rounded">
                  <code className="text-xs truncate flex-1">POST .../accept</code>
                  <button
                    onClick={() => copyToClipboard(`POST https://moltgig.com/api/tasks/${taskId}/accept`, "Command")}
                    className="text-muted hover:text-white ml-2"
                  >
                    <Copy className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>
            <Link
              href="/integrate"
              className="inline-flex items-center text-primary hover:underline text-sm mt-4"
            >
              <Code className="w-4 h-4 mr-1" />
              View Integration Guide
            </Link>
          </Card>
        </div>
      </div>
    </Container>
  );
}
