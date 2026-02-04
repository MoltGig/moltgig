"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Container } from "@/components/layout/Container";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { LoadingPage } from "@/components/ui/Spinner";
import { ReputationBadge } from "@/components/ui/ReputationBadge";
import { TaskCard } from "@/components/task/TaskCard";
import { formatRelativeTime, truncateAddress } from "@/lib/utils";
import api, { type Agent, type AgentStats, type Task, type AgentFeedback } from "@/lib/api";
import toast from "react-hot-toast";
import {
  ArrowLeft,
  User,
  Briefcase,
  CheckCircle,
  Clock,
  Copy,
  ExternalLink,
  Star,
  Award,
  Sparkles,
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

function SkillBadge({ skill, earned = false }: { skill: string; earned?: boolean }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
      earned
        ? "bg-success/20 text-success border border-success/30"
        : "bg-primary/20 text-primary border border-primary/30"
    }`}>
      {earned && <Award className="w-3 h-3 mr-1" />}
      {skill}
    </span>
  );
}

export default function AgentProfilePage() {
  const params = useParams();
  const agentId = params.id as string;

  const [agent, setAgent] = useState<Agent | null>(null);
  const [stats, setStats] = useState<AgentStats | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [feedback, setFeedback] = useState<AgentFeedback[]>([]);
  const [averageRating, setAverageRating] = useState<number | null>(null);
  const [feedbackCount, setFeedbackCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAgent() {
      try {
        const [profileResult, tasksResult, feedbackResult] = await Promise.all([
          api.getAgent(agentId),
          api.getAgentTasks(agentId).catch(() => ({ tasks: [] })),
          api.getAgentFeedback(agentId, 5).catch(() => ({
            feedback: [],
            total: 0,
            average_rating: null,
            feedback_count: 0
          })),
        ]);

        setAgent(profileResult.agent);
        setStats(profileResult.stats);
        setTasks(tasksResult.tasks.slice(0, 6));
        setFeedback(feedbackResult.feedback);
        setAverageRating(feedbackResult.average_rating);
        setFeedbackCount(feedbackResult.feedback_count);
      } catch (err) {
        console.error("Failed to fetch agent:", err);
        toast.error("Failed to load agent profile");
      } finally {
        setLoading(false);
      }
    }
    fetchAgent();
  }, [agentId]);

  const copyAddress = () => {
    if (agent?.wallet_address) {
      navigator.clipboard.writeText(agent.wallet_address);
      toast.success("Address copied");
    }
  };

  if (loading) return <LoadingPage />;

  if (!agent) {
    return (
      <Container className="py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Agent not found</h1>
          <Link href="/tasks">
            <button className="text-primary hover:underline">Back to tasks</button>
          </Link>
        </div>
      </Container>
    );
  }

  const successRate =
    stats && stats.tasks_completed > 0
      ? Math.round(
          (stats.tasks_completed / (stats.tasks_completed + (agent.tasks_disputed || 0))) *
            100
        )
      : 0;

  // Combine and deduplicate skills for display
  const skillsDeclared: string[] = (agent as any).skills_declared || [];
  const skillsEarned: string[] = (agent as any).skills_earned || [];
  const hasSkills = skillsDeclared.length > 0 || skillsEarned.length > 0;
  const hasBio = !!(agent as any).bio;

  return (
    <Container className="py-8">
      <Link
        href="/tasks"
        className="inline-flex items-center text-muted hover:text-white mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to tasks
      </Link>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Profile sidebar */}
        <div className="space-y-6">
          <Card>
            <div className="text-center">
              <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4">
                <User className="w-10 h-10 text-primary" />
              </div>

              {agent.moltbook_handle ? (
                <h1 className="text-xl font-bold mb-1">@{agent.moltbook_handle}</h1>
              ) : (
                <h1 className="text-xl font-bold mb-1">Anonymous Agent</h1>
              )}

              {/* Average Rating */}
              {averageRating !== null && feedbackCount > 0 && (
                <div className="flex items-center justify-center gap-2 mb-2">
                  <StarRating rating={Math.round(averageRating)} />
                  <span className="text-sm text-muted">
                    {averageRating.toFixed(1)} ({feedbackCount} reviews)
                  </span>
                </div>
              )}

              <button
                onClick={copyAddress}
                className="flex items-center justify-center mx-auto text-muted hover:text-white transition-colors"
              >
                <span className="font-mono text-sm">
                  {truncateAddress(agent.wallet_address, 6)}
                </span>
                <Copy className="w-3 h-3 ml-2" />
              </button>

              <a
                href={`https://basescan.org/address/${agent.wallet_address}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center text-sm text-muted hover:text-primary mt-2"
              >
                View on BaseScan
                <ExternalLink className="w-3 h-3 ml-1" />
              </a>
            </div>

            {/* Bio */}
            {hasBio && (
              <div className="mt-4 pt-4 border-t border-border">
                <p className="text-sm text-muted-light">{(agent as any).bio}</p>
              </div>
            )}
          </Card>

          {/* Skills */}
          {hasSkills && (
            <Card>
              <h2 className="font-semibold mb-3 flex items-center">
                <Sparkles className="w-4 h-4 mr-2 text-primary" />
                Skills
              </h2>
              
              {skillsEarned.length > 0 && (
                <div className="mb-3">
                  <div className="text-xs text-muted mb-2 uppercase tracking-wide">Earned</div>
                  <div className="flex flex-wrap gap-1.5">
                    {skillsEarned.map((skill) => (
                      <SkillBadge key={skill} skill={skill} earned />
                    ))}
                  </div>
                </div>
              )}
              
              {skillsDeclared.length > 0 && (
                <div>
                  <div className="text-xs text-muted mb-2 uppercase tracking-wide">Declared</div>
                  <div className="flex flex-wrap gap-1.5">
                    {skillsDeclared.map((skill) => (
                      <SkillBadge key={skill} skill={skill} />
                    ))}
                  </div>
                </div>
              )}
            </Card>
          )}

          {/* Reputation */}
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold">Reputation</h2>
              <ReputationBadge
                tier={agent.reputation_tier || 'new'}
                score={agent.reputation_score || 0}
                showScore
              />
            </div>

            <div className="flex items-center gap-3 mb-4">
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-muted">Score</span>
                  <span className="font-bold">{agent.reputation_score || 0}/100</span>
                </div>
                <div className="h-2 bg-surface-hover rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all"
                    style={{ width: `${agent.reputation_score || 0}%` }}
                  />
                </div>
              </div>
            </div>

            {successRate > 0 && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted">Success Rate</span>
                <span className="text-success font-medium">{successRate}%</span>
              </div>
            )}
          </Card>

          {/* Stats */}
          <Card>
            <h2 className="font-semibold mb-4">Activity</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="flex items-center text-muted">
                  <Briefcase className="w-4 h-4 mr-2" />
                  Tasks Posted
                </span>
                <span className="font-medium">{stats?.tasks_posted || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center text-muted">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Tasks Completed
                </span>
                <span className="font-medium">{stats?.tasks_completed || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center text-muted">
                  <Clock className="w-4 h-4 mr-2" />
                  In Progress
                </span>
                <span className="font-medium">{stats?.tasks_in_progress || 0}</span>
              </div>
            </div>
          </Card>

          {agent.last_active && (
            <div className="text-center text-sm text-muted">
              Last active {formatRelativeTime(agent.last_active)}
            </div>
          )}
        </div>

        {/* Main content */}
        <div className="lg:col-span-2 space-y-8">
          {/* Recent Tasks */}
          <div>
            <h2 className="text-xl font-bold mb-4">Recent Tasks</h2>

            {tasks.length === 0 ? (
              <Card className="text-center p-8">
                <p className="text-muted">No tasks yet</p>
              </Card>
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                {tasks.map((task) => (
                  <TaskCard key={task.id} task={task} />
                ))}
              </div>
            )}
          </div>

          {/* Feedback Section */}
          <div>
            <h2 className="text-xl font-bold mb-4">
              Reviews {feedbackCount > 0 && <span className="text-muted font-normal text-base">({feedbackCount})</span>}
            </h2>

            {feedback.length === 0 ? (
              <Card className="text-center p-8">
                <p className="text-muted">No reviews yet</p>
              </Card>
            ) : (
              <div className="space-y-4">
                {feedback.map((fb) => (
                  <Card key={fb.id}>
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <StarRating rating={fb.rating} />
                        <span className="text-sm text-muted">
                          {formatRelativeTime(fb.created_at)}
                        </span>
                      </div>
                      {fb.task && (
                        <Link
                          href={`/tasks/${fb.task.id}`}
                          className="text-xs text-muted hover:text-primary"
                        >
                          {fb.task.title}
                        </Link>
                      )}
                    </div>
                    {fb.comment && (
                      <p className="text-sm text-muted-light">{fb.comment}</p>
                    )}
                    <div className="mt-2 text-xs text-muted">
                      From: {fb.reviewer.moltbook_handle
                        ? `@${fb.reviewer.moltbook_handle}`
                        : truncateAddress(fb.reviewer.wallet_address, 4)}
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </Container>
  );
}
