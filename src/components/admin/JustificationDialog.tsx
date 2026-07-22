import { useState, type ReactNode } from "react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export function JustificationDialog({
  trigger,
  title,
  description,
  children,
  onConfirm,
  pending,
  confirmLabel = "Confirmar",
  destructive,
}: {
  trigger: ReactNode;
  title: string;
  description?: string;
  children?: ReactNode;
  onConfirm: (justification: string) => unknown;
  pending?: boolean;
  confirmLabel?: string;
  destructive?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [justification, setJustification] = useState("");

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) setJustification("");
      }}
    >
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description ? (
            <p className="text-sm text-muted-foreground">{description}</p>
          ) : null}
        </DialogHeader>
        <div className="space-y-4">
          {children}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Justificativa (obrigatória)
            </label>
            <Textarea
              value={justification}
              onChange={(e) => setJustification(e.target.value)}
              placeholder="Explique brevemente o motivo. Registrado nos logs administrativos."
              minLength={5}
              maxLength={500}
              rows={3}
            />
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancelar</Button>
          </DialogClose>
          <Button
            variant={destructive ? "destructive" : "default"}
            disabled={pending || justification.trim().length < 5}
            onClick={async () => {
              await onConfirm(justification.trim());
              setOpen(false);
              setJustification("");
            }}
          >
            {pending ? "Salvando…" : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
