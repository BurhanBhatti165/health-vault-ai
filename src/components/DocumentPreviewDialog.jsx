import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FileText, Download, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export const DocumentPreviewDialog = ({ open, onOpenChange, document }) => {
  if (!document) return null;

  const isPDF = document.file_type === "application/pdf" || document.file_name.toLowerCase().endsWith('.pdf');
  const isImage = document.file_type.startsWith("image/") || 
                  document.file_name.match(/\.(jpg|jpeg|png|gif|webp)$/i);

  const formatFileSize = (bytes) => {
    if (!bytes) return "Unknown size";
    const mb = bytes / (1024 * 1024);
    if (mb < 1) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }
    return `${mb.toFixed(1)} MB`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl">{document.file_name}</DialogTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span>{formatFileSize(document.file_size)}</span>
            <span>•</span>
            <span>{new Date(document.created_at).toLocaleDateString()}</span>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-auto bg-muted/30 rounded-lg p-4 min-h-[400px] flex items-center justify-center">
          {isPDF ? (
            <div className="text-center space-y-4">
              <div className="mx-auto p-6 rounded-full bg-gradient-primary w-fit">
                <FileText className="h-16 w-16 text-white" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-semibold text-foreground">PDF Document</h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  This is a demo preview. In a production app, the PDF would be displayed here using a PDF viewer library.
                </p>
                <div className="pt-4">
                  <Button variant="outline" className="gap-2">
                    <Download className="h-4 w-4" />
                    Download PDF
                  </Button>
                </div>
              </div>
            </div>
          ) : isImage ? (
            <div className="text-center space-y-4 w-full">
              <div className="mx-auto p-6 rounded-full bg-gradient-primary w-fit">
                <FileText className="h-16 w-16 text-white" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-semibold text-foreground">Image Document</h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  This is a demo preview. In a production app, the image would be displayed here.
                </p>
                <div className="pt-4">
                  <Button variant="outline" className="gap-2">
                    <Download className="h-4 w-4" />
                    Download Image
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center space-y-4">
              <div className="mx-auto p-6 rounded-full bg-gradient-primary w-fit">
                <FileText className="h-16 w-16 text-white" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-semibold text-foreground">Document Preview</h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  Preview not available for this file type. Download to view.
                </p>
                <div className="pt-4">
                  <Button variant="outline" className="gap-2">
                    <Download className="h-4 w-4" />
                    Download File
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
