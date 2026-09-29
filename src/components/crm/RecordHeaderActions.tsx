import { Pencil, Trash2 } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { ConfirmDelete } from "./ConfirmDelete";

type Props = {
  entityLabel: string;
  name: string;
  deleteDescription: string;
  onEdit: () => void;
  onDelete: () => void | Promise<void>;
};

export function RecordHeaderActions({ entityLabel, name, deleteDescription, onEdit, onDelete }: Props) {
  return (
    <>
      <Button variant="outline" onClick={onEdit}>
        <Pencil />
        Edit
      </Button>
      <ConfirmDelete title={`Delete ${entityLabel.toLowerCase()} “${name}”?`} description={deleteDescription} onConfirm={onDelete}>
        <Button variant="outline" className="text-destructive hover:text-destructive" aria-label={`Delete ${entityLabel.toLowerCase()}`}>
          <Trash2 />
        </Button>
      </ConfirmDelete>
    </>
  );
}
