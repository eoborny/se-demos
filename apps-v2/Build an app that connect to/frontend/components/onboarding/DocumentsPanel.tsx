import { useRef, useState } from "react"
import { FileText, Trash2, Upload } from "lucide-react"
import { Button } from "../../lib/shadcn/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../lib/shadcn/select"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "../../lib/shadcn/empty"
import {
  DOCUMENT_CATEGORIES,
  type DocumentCategory,
  type EmployeeDocument,
} from "../../data/onboarding"

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

interface Props {
  documents: EmployeeDocument[]
  onUpload: (doc: {
    name: string
    category: DocumentCategory
    sizeLabel: string
  }) => void
  onRemove: (docId: string) => void
}

export function DocumentsPanel({ documents, onUpload, onRemove }: Props) {
  const [category, setCategory] = useState<DocumentCategory>("Identification")
  const fileRef = useRef<HTMLInputElement>(null)

  const handleFiles = (files: FileList | null) => {
    if (!files) return
    Array.from(files).forEach((file) => {
      onUpload({
        name: file.name,
        category,
        sizeLabel: formatSize(file.size),
      })
    })
    if (fileRef.current) fileRef.current.value = ""
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 rounded-lg border border-dashed border-border bg-muted/30 p-4 sm:flex-row sm:items-end">
        <div className="space-y-1.5 sm:w-56">
          <span className="text-sm font-medium">Document type</span>
          <Select
            value={category}
            onValueChange={(v) => setCategory(v as DocumentCategory)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DOCUMENT_CATEGORIES.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <input
          ref={fileRef}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
        <Button
          onClick={() => fileRef.current?.click()}
          className="gap-2 rounded-full"
        >
          <Upload className="h-4 w-4" />
          Upload documents
        </Button>
      </div>

      {documents.length === 0 ? (
        <Empty className="border border-dashed border-border rounded-lg py-10">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <FileText className="h-6 w-6" />
            </EmptyMedia>
            <EmptyTitle>No documents yet</EmptyTitle>
            <EmptyDescription>
              Upload onboarding paperwork such as IDs, tax forms and contracts.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <ul className="divide-y divide-border rounded-lg border border-border">
          {documents.map((doc) => (
            <li
              key={doc.id}
              className="flex items-center gap-3 px-4 py-3"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-muted">
                <FileText className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{doc.name}</p>
                <p className="text-xs text-muted-foreground">
                  {doc.category} · {doc.sizeLabel} · Uploaded {doc.uploadedAt}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                aria-label={`Remove ${doc.name}`}
                onClick={() => onRemove(doc.id)}
                className="text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
