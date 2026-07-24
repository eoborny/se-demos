import { Checkbox } from "../../lib/shadcn/checkbox"
import { Progress } from "../../lib/shadcn/progress"
import { cn } from "../../lib/shadcn/utils"
import type { OnboardingTask } from "../../data/onboarding"

interface Props {
  tasks: OnboardingTask[]
  onToggle: (taskId: string) => void
}

export function OnboardingChecklist({ tasks, onToggle }: Props) {
  const done = tasks.filter((t) => t.completed).length
  const pct = tasks.length ? Math.round((done / tasks.length) * 100) : 0

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium">Onboarding progress</span>
          <span className="text-muted-foreground">
            {done} of {tasks.length} tasks · {pct}%
          </span>
        </div>
        <Progress value={pct} className="h-2" />
      </div>

      <ul className="space-y-1">
        {tasks.map((task) => (
          <li key={task.id}>
            <label className="flex cursor-pointer items-center gap-3 rounded-md px-2 py-2 hover:bg-accent">
              <Checkbox
                checked={task.completed}
                onCheckedChange={() => onToggle(task.id)}
              />
              <span
                className={cn(
                  "text-sm",
                  task.completed && "text-muted-foreground line-through",
                )}
              >
                {task.label}
              </span>
            </label>
          </li>
        ))}
      </ul>
    </div>
  )
}
