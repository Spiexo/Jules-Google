import { Paperclip } from 'lucide-react';
import { julesService } from '../services/julesService';

interface ImageAttachButtonProps {
  onSelect: (name: string, preview: string) => void;
  size?: number;
}

export default function ImageAttachButton({ onSelect, size = 30 }: ImageAttachButtonProps) {
  const handleClick = async () => {
    const result = await julesService.openImageDialog();
    if (result) onSelect(result.name, result.preview);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      style={{
        width: size, height: size,
        borderRadius: 8,
        border: '1px solid var(--border)',
        background: 'transparent',
        color: 'var(--muted)',
        cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}
      title="Joindre une image"
    >
      <Paperclip size={Math.round(size * 0.47)} strokeWidth={2} />
    </button>
  );
}
