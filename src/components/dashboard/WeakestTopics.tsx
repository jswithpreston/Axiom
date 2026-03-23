import Card from "@/components/ui/Card";
import { formatEaseFactor } from "@/utils/formatters";

interface WeakTopic {
  readonly flashcardId: string;
  readonly question: string;
  readonly easeFactor: number;
  readonly courseName: string;
}

interface WeakestTopicsProps {
  readonly topics: readonly WeakTopic[];
}

function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength)}...`;
}

export default function WeakestTopics({ topics }: WeakestTopicsProps) {
  return (
    <Card title="WEAKEST TOPICS">
      {topics.length === 0 ? (
        <p className="py-4 text-center text-sm text-axiom-muted">
          No weak topics identified
        </p>
      ) : (
        <ul className="space-y-3">
          {topics.map((topic) => (
            <li
              key={topic.flashcardId}
              className="rounded-md border border-axiom-border bg-axiom-bg/50 px-4 py-3"
            >
              <p className="text-sm text-axiom-text">
                {truncate(topic.question, 60)}
              </p>
              <div className="mt-1 flex items-center justify-between">
                <span className="text-xs text-axiom-muted">
                  {topic.courseName}
                </span>
                <span className="font-mono text-xs text-axiom-muted">
                  EF {formatEaseFactor(topic.easeFactor)}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
