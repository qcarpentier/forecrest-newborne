import { Trash } from "@phosphor-icons/react";
import { Button } from "../components";
import Modal, { ModalBody, ModalFooter, Checkbox } from "./Modal";

export default function ConfirmDeleteModal({ onConfirm, onCancel, skipNext, setSkipNext, t }) {
  var iconNode = (
    <div style={{
      width: 40, height: 40, borderRadius: "var(--r-lg)",
      background: "var(--color-error-bg)",
      border: "1px solid var(--color-error-border)",
      display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      <Trash size={18} color="var(--color-error)" weight="bold" />
    </div>
  );

  return (
    <Modal
      open
      onClose={onCancel}
      size="sm"
      title={t.confirm_title}
      subtitle={t.confirm_body}
      icon={iconNode}
      hideClose
    >
      <ModalBody>
        <Checkbox
          checked={skipNext}
          onChange={function (v) { setSkipNext(v); }}
          label={t.confirm_skip}
        />
      </ModalBody>

      <ModalFooter>
        <Button color="tertiary" size="md" onClick={onCancel}>
          {t.cancel}
        </Button>
        <Button color="primary-destructive" size="md" onClick={onConfirm}>
          {t.delete}
        </Button>
      </ModalFooter>
    </Modal>
  );
}
