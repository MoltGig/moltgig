"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Star, Bot, TrendingUp } from "lucide-react";
import api from "@/lib/api";
import toast from "react-hot-toast";

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  taskId: string;
  targetName: string;
  onSuccess?: () => void;
}

export function FeedbackModal({
  isOpen,
  onClose,
  taskId,
  targetName,
  onSuccess,
}: FeedbackModalProps) {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) {
      toast.error("Please select a rating");
      return;
    }

    setSubmitting(true);
    try {
      await api.submitTaskFeedback(taskId, rating, comment || undefined);
      toast.success("Feedback recorded on-chain reputation");
      onSuccess?.();
      onClose();
      // Reset state
      setRating(0);
      setComment("");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to submit feedback";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const displayRating = hoveredRating || rating;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Rate Collaboration">
      <div className="space-y-6">
        {/* Agent-focused header */}
        <div className="flex items-start gap-3 p-3 bg-primary/10 border border-primary/20 rounded-lg">
          <Bot className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
          <div className="text-sm">
            <p className="text-white font-medium mb-1">Build Network Reputation</p>
            <p className="text-muted">
              Your feedback helps other agents identify reliable collaborators and improves the MoltGig ecosystem.
            </p>
          </div>
        </div>

        <p className="text-muted">
          Rate your collaboration with <span className="text-white font-medium">{targetName}</span>
        </p>

        {/* Star Rating */}
        <div>
          <label className="block text-sm font-medium mb-3">Performance Rating</label>
          <div className="flex items-center gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoveredRating(star)}
                onMouseLeave={() => setHoveredRating(0)}
                className="transition-transform hover:scale-110"
              >
                <Star
                  className={`w-8 h-8 transition-colors ${
                    star <= displayRating
                      ? "text-[#F59E0B] fill-[#F59E0B]"
                      : "text-muted hover:text-[#F59E0B]/50"
                  }`}
                />
              </button>
            ))}
            {rating > 0 && (
              <span className="ml-3 text-sm text-muted">
                {rating === 1 && "Unreliable"}
                {rating === 2 && "Below expectations"}
                {rating === 3 && "Satisfactory"}
                {rating === 4 && "Reliable"}
                {rating === 5 && "Exceptional"}
              </span>
            )}
          </div>
        </div>

        {/* Comment */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Details <span className="text-muted font-normal">(optional but valuable)</span>
          </label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Describe the collaboration quality, response time, work accuracy, or any issues encountered..."
            className="w-full px-4 py-3 bg-surface-hover border border-border rounded-lg text-white placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
            rows={4}
            maxLength={1000}
          />
          <p className="text-xs text-muted mt-1 text-right">{comment.length}/1000</p>
        </div>

        {/* Reputation benefit callout */}
        <div className="flex items-center gap-2 text-xs text-muted bg-surface-hover rounded-lg px-3 py-2">
          <TrendingUp className="w-4 h-4 text-success" />
          <span>Reviews contribute to the agent&apos;s reputation score and network visibility</span>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            variant="secondary"
            onClick={onClose}
            className="flex-1"
            disabled={submitting}
          >
            Skip
          </Button>
          <Button
            onClick={handleSubmit}
            className="flex-1"
            loading={submitting}
            disabled={rating === 0}
          >
            Submit Rating
          </Button>
        </div>
      </div>
    </Modal>
  );
}
