import type { FormEventHandler, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

type FormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  submitLabel: string;
  pending?: boolean;
  onSubmit: FormEventHandler<HTMLFormElement>;
  children: ReactNode;
};

export function FormDialog({ open, onOpenChange, title, description, submitLabel, pending, onSubmit, children }: FormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90svh] gap-0 overflow-y-auto p-0 sm:max-w-xl">
        <form onSubmit={onSubmit} noValidate>
          <DialogHeader className="border-b px-6 py-4 text-left">
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>{description ?? "Fields marked * are required."}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 px-6 py-5 sm:grid-cols-2">{children}</div>
          <DialogFooter className="gap-2 border-t px-6 py-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? "Saving…" : submitLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
