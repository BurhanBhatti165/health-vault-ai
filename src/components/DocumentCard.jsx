import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Download, Eye } from "lucide-react";

export const DocumentCard = ({ document, userId, onPreview }) => {
  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const getFileIcon = (fileType) => {
    if (fileType?.includes("image")) return "🖼️";
    if (fileType?.includes("pdf")) return "📄";
    return "📎";
  };

  return (
    <Card className="shadow-card border-border/50 hover:shadow-hover transition-all">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-primary">
              <FileText className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-base line-clamp-1">{document.file_name}</CardTitle>
              <CardDescription className="text-xs mt-1">
                {formatFileSize(document.file_size || 0)}
              </CardDescription>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>{getFileIcon(document.file_type)}</span>
          <span>{document.file_type || "Unknown type"}</span>
        </div>
        <CardDescription className="text-xs">
          Uploaded {new Date(document.created_at).toLocaleDateString()}
        </CardDescription>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 gap-2"
            onClick={() => onPreview(document)}
          >
            <Eye className="h-3 w-3" />
            Preview
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
