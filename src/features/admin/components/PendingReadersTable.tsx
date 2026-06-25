import {
  useAdminPendingReaders,
  useAdminReviewReaderApplication,
} from "../hooks";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Check, X, Eye } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import type { PendingReaderApplication } from "../types/admin.types";

export function PendingReadersTable() {
  const { data: pendingReaders, isLoading } = useAdminPendingReaders();
  const reviewReader = useAdminReviewReaderApplication();
  const [selectedReader, setSelectedReader] =
    useState<PendingReaderApplication | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectDialog, setShowRejectDialog] = useState(false);

  const handleApprove = async (id: string) => {
    try {
      await reviewReader.mutateAsync({
        id,
        data: { action: "APPROVED" },
      });
      toast.success("Reader approved successfully");
    } catch (error) {
      toast.error("Failed to approve reader");
    }
  };

  const handleReject = async () => {
    if (!selectedReader) return;
    try {
      await reviewReader.mutateAsync({
        id: selectedReader.id,
        data: {
          action: "REJECTED",
          rejectionReason: rejectReason || undefined,
        },
      });
      toast.success("Reader rejected");
      setShowRejectDialog(false);
      setRejectReason("");
      setSelectedReader(null);
    } catch (error) {
      toast.error("Failed to reject reader");
    }
  };

  if (isLoading) {
    return <div className="text-center py-8">Loading pending readers...</div>;
  }

  if (!pendingReaders || pendingReaders.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No pending reader applications
      </div>
    );
  }

  return (
    <>
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Reader</TableHead>
              <TableHead>Specialties</TableHead>
              <TableHead>Applied</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pendingReaders.map((reader) => (
              <TableRow key={reader.id}>
                <TableCell className="flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>
                      {reader.fullName[0]?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium">{reader.fullName}</div>
                    <div className="text-xs text-muted-foreground">
                      {reader.email}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {reader.specialties?.slice(0, 2).map((s: string) => (
                      <Badge key={s} variant="secondary" className="text-xs">
                        {s}
                      </Badge>
                    ))}
                    {reader.specialties?.length > 2 && (
                      <Badge variant="secondary" className="text-xs">
                        +{reader.specialties.length - 2}
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-sm">
                  {new Date(reader.createdAt).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <Badge variant="warning">Pending</Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setSelectedReader(reader)}
                    >
                      <Eye className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="default"
                      className="bg-emerald-500 hover:bg-emerald-600"
                      onClick={() => handleApprove(reader.id)}
                    >
                      <Check className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => {
                        setSelectedReader(reader);
                        setShowRejectDialog(true);
                      }}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Reader Application</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Are you sure you want to reject{" "}
              <strong>{selectedReader?.fullName}</strong>'s application?
            </p>
            <div className="space-y-2">
              <label className="text-sm font-medium">Reason (optional)</label>
              <Textarea
                placeholder="Provide a reason for rejection..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={3}
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => setShowRejectDialog(false)}
              >
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleReject}>
                Reject
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
