import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, Download, Eye } from "lucide-react";
import { toast } from "sonner";

export const DocumentCard = ({ document, userId, onPreview }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case "uploaded":
        return "default";
      case "processing":
        return "secondary";
      case "ready":
        return "default";
      default:
        return "secondary";
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return "Unknown size";
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const handleDownload = () => {
    toast.info("This is a demo. In production, the file would be downloaded.");
  };

  const handleView = () => {
    onPreview(document);
  };

  return (
    <Card className="shadow-card border-border/50">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3 flex-1">
            <div className="p-2 rounded-lg bg-gradient-primary">
              <FileText className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <CardTitle className="text-base truncate">{document.file_name}</CardTitle>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant={getStatusColor(document.processing_status)} className="text-xs">
                  {document.processing_status}
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-1 text-xs text-muted-foreground">
          <p>Size: {formatFileSize(document.file_size)}</p>
          <p>Uploaded: {new Date(document.created_at).toLocaleDateString()}</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleView}
            className="flex-1"
          >
            <Eye className="h-3 w-3 mr-1" />
            View
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownload}
            className="flex-1"
          >
            <Download className="h-3 w-3 mr-1" />
            Download
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
